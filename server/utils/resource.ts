import { existsSync, readFileSync } from "node:fs"

export function readWidgetHtmlByUri(uri: string) {
  const assetsDir = "./output/assets"
  if (!existsSync(assetsDir)) {
    throw new Error("Assets folder not found")
  }

  const fileName = new URL(uri).pathname
  const directPath = `${assetsDir}${fileName}`
  if (!existsSync(directPath)) {
    throw new Error("Widget HTML not found")
  }

  return readFileSync(directPath, "utf8")
}
