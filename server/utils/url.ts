export const getUrlPath = (url?: string) => {
  try {
    if (!url) return ""
    const path = new URL(url).pathname
    return path.endsWith("/") ? path.slice(0, -1) : path
  } catch {
    return ""
  }
}
