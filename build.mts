import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { config as initEnv } from "dotenv"
import fg from "fast-glob"
import {
  existsSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import {
  basename,
  dirname,
  join,
  relative as relativePath,
  resolve,
} from "node:path"
import { build as tsupBuild } from "tsup"
import { build as viteBuild } from "vite"

// Load environment variables
initEnv({ quiet: true })

type ClientEntry = {
  name: string
  absolute: string
  relative: string
}

// Output directories
const OUTPUT_DIR = resolve("output")
const ASSETS_DIR = join(OUTPUT_DIR, "assets")

// Server and Client entry points
const SERVER_ENTRY = resolve("server/index.ts")
const CLIENT_ENTRY = "src/widget/*/index.{tsx,ts,jsx,js}"

const formatUrlPath = (url?: string) => {
  if (!url) {
    return ""
  }

  return url.endsWith("/") ? url.slice(0, -1) : url
}

// ========= Common Helper =========
function log(prefix: string, message: string) {
  console.log(`[${prefix}] ${message}`)
}

function group(prefix: string, message: string) {
  console.group(`[${prefix}] ${message}`)
}

function groupEnd() {
  console.groupEnd()
}

// ========= Build Server =========
async function buildServer() {
  const PREFIX = "BUILD:SERVER"

  if (!existsSync(SERVER_ENTRY)) {
    throw new Error("Server entry file not found")
  }

  log(PREFIX, "Starting server build...")

  await tsupBuild({
    entry: [SERVER_ENTRY],
    outDir: OUTPUT_DIR,
    target: "node18",
    platform: "node",
    format: ["esm"],
    bundle: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    minify: "terser",
    skipNodeModulesBundle: true,
    dts: false,
    shims: true,
  })

  log(PREFIX, "Server build finished")
}

// ========= Build Client =========
async function buildClient() {
  const PREFIX = "BUILD:CLIENT"

  log(PREFIX, "Starting client asset build...")

  // Normalize Windows-style paths
  function normalizeRelative(filepath: string): string {
    return filepath.split("\\").join("/")
  }

  // Collect all client widget entry files
  function collectClientEntries(): ClientEntry[] {
    const files = fg.sync(CLIENT_ENTRY, { dot: false })
    if (!files.length) {
      throw new Error("No client entry files found")
    }

    const entries: ClientEntry[] = []
    for (const file of files) {
      const name = basename(dirname(file))
      const abs = resolve(file)
      if (entries.some((entry) => entry.name === name)) {
        throw new Error(`Duplicate asset name detected: ${name}`)
      }
      const rel = normalizeRelative(relativePath(process.cwd(), abs))
      entries.push({
        name,
        absolute: abs,
        relative: rel,
      })
    }
    return entries
  }

  const entries = collectClientEntries()
  const inputs = Object.fromEntries(
    entries.map(({ name, absolute }) => [name, absolute])
  )

  // Run Vite build process
  await viteBuild({
    configFile: false,
    plugins: [tailwindcss(), react()],
    build: {
      target: "es2018",
      outDir: ASSETS_DIR,
      emptyOutDir: false,
      assetsDir: ".",
      cssCodeSplit: true,
      manifest: "manifest.json",
      rollupOptions: {
        input: inputs,
        output: {
          format: "es",
          entryFileNames: "chunks/[name].js",
          chunkFileNames: "chunks/[name].js",
          assetFileNames() {
            return "static/[name][extname]"
          },
        },
      },
    },
  })

  // Validate manifest output
  const manifestPath = join(ASSETS_DIR, "manifest.json")
  if (!existsSync(manifestPath)) {
    throw new Error("Vite manifest file not found, build failed")
  }

  const builtNames = entries.map(({ name }) => name)
  const rawManifest = JSON.parse(readFileSync(manifestPath, "utf8"))
  const manifest = new Map<string, { file: string; key: string }>()

  // Match Vite output files with original entries
  for (const entry of entries) {
    const manifestEntry =
      (rawManifest[entry.name] && {
        key: entry.name,
        value: rawManifest[entry.name],
      }) ??
      (rawManifest[entry.relative] && {
        key: entry.relative,
        value: rawManifest[entry.relative],
      }) ??
      (rawManifest[normalizeRelative(entry.relative)] && {
        key: normalizeRelative(entry.relative),
        value: rawManifest[normalizeRelative(entry.relative)],
      })

    if (!manifestEntry) {
      throw new Error(
        `Asset "${entry.name}" (entry: ${entry.relative}) not found in Vite manifest`
      )
    }

    const { key, value } = manifestEntry
    manifest.set(entry.name, {
      key,
      file: value.file,
    })
  }

  const renamedAssets = new Map<string, { js: string; css: string[] }>()
  const renamedFiles = new Map<string, string>()

  function ensureRenamed(originalRelativePath: string): string {
    const normalized = normalizeRelative(originalRelativePath)

    const cached = renamedFiles.get(normalized)
    if (cached) {
      return cached
    }

    const renamed = renameWithVersion(normalized)
    renamedFiles.set(normalized, renamed)

    return renamed
  }

  function renameWithVersion(originalRelativePath: string): string {
    const absPath = join(ASSETS_DIR, originalRelativePath)
    if (!existsSync(absPath)) {
      throw new Error(
        `Attempted to rename missing file: ${originalRelativePath}`
      )
    }
    const dir = dirname(originalRelativePath)
    const ext = originalRelativePath.slice(
      originalRelativePath.lastIndexOf(".")
    )

    const base = basename(originalRelativePath, ext)
    const name = `${base}${ext}`

    const newRelativePath = dir ? normalizeRelative(join(dir, name)) : name
    const newAbsPath = join(ASSETS_DIR, newRelativePath)

    renameSync(absPath, newAbsPath)
    log("*", `${originalRelativePath} -> ${newRelativePath}`)

    return newRelativePath
  }

  function collectCssDependencies(
    key: string,
    visited: Set<string> = new Set()
  ): string[] {
    if (visited.has(key)) {
      return []
    }
    visited.add(key)

    const record = rawManifest[key]
    if (!record) {
      return []
    }

    const cssFiles = new Set<string>()
    for (const css of record.css ?? []) {
      cssFiles.add(normalizeRelative(css))
    }

    for (const importKey of record.imports ?? []) {
      for (const css of collectCssDependencies(importKey, visited)) {
        cssFiles.add(css)
      }
    }

    return [...cssFiles]
  }

  group(PREFIX, "Renaming static assets")
  for (const name of builtNames) {
    const manifestEntry = manifest.get(name)
    if (!manifestEntry) {
      throw new Error(`No manifest info found for asset "${name}"`)
    }

    const jsRelative = manifestEntry.file
    const renamedJsRelative = ensureRenamed(jsRelative)
    const cssRelatives = collectCssDependencies(manifestEntry.key)
      .map((cssFile) => ensureRenamed(cssFile))
      .sort()

    renamedAssets.set(name, {
      js: renamedJsRelative,
      css: cssRelatives,
    })
  }
  groupEnd()

  const defaultBaseUrl = `${formatUrlPath(process.env.REMOTE_URL)}/assets`
  const baseUrlCandidate = process.env.BASE_URL?.trim() ?? ""
  const baseUrlRaw =
    baseUrlCandidate.length > 0 ? baseUrlCandidate : defaultBaseUrl
  const normalizedBaseUrl = baseUrlRaw.replace(/\/+$/, "") || defaultBaseUrl

  // Generate minimal HTML files for each entry
  for (const name of builtNames) {
    const assets = renamedAssets.get(name)
    if (!assets) {
      throw new Error(`Missing rename record for asset "${name}"`)
    }

    const head = [
      '<meta charset="utf-8" />',
      '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">',
      `<script type="module" src="${normalizedBaseUrl}/${assets.js}"></script>`,
      ...assets.css.map(
        (it) => `<link rel="stylesheet" href="${normalizedBaseUrl}/${it}"/>`
      ),
    ].join("")

    const html = `<html><head>${head}</head><body><div id="${name}-root"></div></body></html>`

    const liveHtmlPath = join(ASSETS_DIR, `${name}.html`)
    writeFileSync(liveHtmlPath, html, "utf8")
    log(PREFIX, `Generated HTML for entry: ${name}`)
  }

  if (existsSync(manifestPath)) {
    rmSync(manifestPath, { force: true })
    rmSync(join(ASSETS_DIR, ".vite"), { recursive: true, force: true })
  }

  log(PREFIX, "Client build finished")
}

// ========= Entry Function =========
async function main() {
  const PREFIX = "BUILD:ALL"
  log(PREFIX, "Cleaning output directory...")
  rmSync(OUTPUT_DIR, { recursive: true, force: true })

  await buildServer()
  await buildClient()

  log(PREFIX, "Build completed. Output located in ./output/")
}

// Entry point
main().catch((error) => {
  console.error("[BUILD:ERROR]", error)
  process.exitCode = 1
})
