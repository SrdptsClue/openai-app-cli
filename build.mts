import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { build as esbuildBuild } from "esbuild";
import fg from "fast-glob";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { build as viteBuild } from "vite";
import pkg from "./package.json" with { type: "json" };

const OUTPUT_DIR = resolve("output");
const ASSETS_DIR = join(OUTPUT_DIR, "assets");
const SERVER_ENTRY = resolve("src/server/index.ts");

function collectClientEntries() {
  const files = fg.sync("src/client/*/index.{tsx,ts,jsx,js}", { dot: false });
  if (!files.length) {
    throw new Error(
      "未找到任何 client 入口文件，请在 src/client/<name>/index.tsx 中提供资源入口。"
    );
  }

  const pairs: Array<[string, string]> = [];
  for (const file of files) {
    const name = basename(dirname(file));
    const abs = resolve(file);
    if (pairs.some(([existing]) => existing === name)) {
      throw new Error(`检测到重复的资源名称：${name}`);
    }
    pairs.push([name, abs]);
  }
  return pairs;
}

async function buildClient(pairs: Array<[string, string]>, builtNames: string[]) {
  console.log("开始构建 client 资源...");

  for (const [name, entry] of pairs) {
    console.log(`- ${name}`);
    await viteBuild({
      configFile: false,
      plugins: [tailwindcss(), react()],
      build: {
        target: "es2018",
        outDir: ASSETS_DIR,
        emptyOutDir: false,
        assetsDir: ".",
        cssCodeSplit: false,
        rollupOptions: {
          input: { [name]: entry },
          output: {
            format: "es",
            entryFileNames: `${name}.js`,
            inlineDynamicImports: true,
            assetFileNames(assetInfo) {
              const ext = assetInfo.name?.split(".").pop() ?? "";
              if (ext === "css") {
                return `${name}.css`;
              }
              return `${name}-[hash][extname]`;
            },
          },
        },
      },
    });
    builtNames.push(name);
  }
  console.log("client 构建完成。");
}

async function buildServer() {
  if (!existsSync(SERVER_ENTRY)) {
    throw new Error("未找到 server 入口文件：src/server/index.ts。");
  }
  console.log("开始构建 server...");
  await esbuildBuild({
    entryPoints: [SERVER_ENTRY],
    outfile: join(OUTPUT_DIR, "server.js"),
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node18",
    sourcemap: false,
  });
  console.log("server 构建完成。");
}

async function main() {
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
  mkdirSync(ASSETS_DIR, { recursive: true });

  const entries = collectClientEntries();
  const builtNames: string[] = [];
  await buildClient(entries, builtNames);

  const assetFiles = fg.sync(["*.js", "*.css"], {
    cwd: ASSETS_DIR,
    dot: false,
    absolute: true,
  });

  const hash = createHash("sha256").update(pkg.version, "utf8").digest("hex").slice(0, 4);

  console.group("重命名静态资源");
  for (const file of assetFiles) {
    const dir = dirname(file);
    const ext = file.slice(file.lastIndexOf("."));
    const base = basename(file, ext);
    const newPath = join(dir, `${base}-${hash}${ext}`);
    renameSync(file, newPath);
    console.log(`${basename(file)} -> ${basename(newPath)}`);
  }
  console.groupEnd();

  const defaultBaseUrl = "http://localhost:4444";
  const baseUrlCandidate = process.env.BASE_URL?.trim() ?? "";
  const baseUrlRaw = baseUrlCandidate.length > 0 ? baseUrlCandidate : defaultBaseUrl;
  const normalizedBaseUrl = baseUrlRaw.replace(/\/+$/, "") || defaultBaseUrl;

  for (const name of builtNames) {
    const jsName = `${name}-${hash}.js`;
    const cssName = `${name}-${hash}.css`;
    const hasCss = existsSync(join(ASSETS_DIR, cssName));
    const headLines = [
      '<meta charset="utf-8" />',
      `<script type="module" src="${normalizedBaseUrl}/${jsName}"></script>`,
    ];
    if (hasCss) {
      headLines.push(
        `<link rel="stylesheet" href="${normalizedBaseUrl}/${cssName}">`
      );
    }
    const head = headLines.map((line) => `  ${line}`).join("\n");
    const html = `<!doctype html>
<html>
<head>
${head}
</head>
<body>
  <div id="${name}-root"></div>
</body>
</html>
`;
    const hashedHtmlPath = join(ASSETS_DIR, `${name}-${hash}.html`);
    const liveHtmlPath = join(ASSETS_DIR, `${name}.html`);
    writeFileSync(hashedHtmlPath, html, "utf8");
    writeFileSync(liveHtmlPath, html, "utf8");
  }

  await buildServer();
  console.log("全部构建完成。输出位于 output/ 目录。");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
