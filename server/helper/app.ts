import { StreamableHTTPTransport } from "@hono/mcp"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { getUrlPath } from "../utils/url"
import { createMcpServer } from "./mcp-server"

export async function bootstrap() {
  const port = Number(process.env.PORT)
  const host = process.env.HOST

  if (!Number.isFinite(port) || !host) {
    console.error("Invalid PORT or HOST environment variables")
    process.exit(0)
  }

  const REMOTE_URL = process.env.REMOTE_URL
  const prefixPath = getUrlPath(REMOTE_URL)

  const SSE_PATH = `${prefixPath}/mcp`
  const ASSETS_PATH = `${prefixPath}/assets/*`

  async function createStreamableHTTPApp() {
    const app = new Hono()

    for (const path of [SSE_PATH, ASSETS_PATH]) {
      app.use(path, cors())
    }

    app.use("*", async (c, next) => {
      console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`)
      await next()
    })

    app.use(
      ASSETS_PATH,
      serveStatic({
        root: "output",
        rewriteRequestPath: (path) => path.replace(prefixPath, ""),
      })
    )

    app.all(SSE_PATH, async (c) => {
      const transport = new StreamableHTTPTransport()
      const mcpServer = createMcpServer()
      await mcpServer.connect(transport)

      return transport.handleRequest(c)
    })

    return app
  }

  try {
    const app = await createStreamableHTTPApp()

    const server = serve({
      fetch: app.fetch,
      hostname: host,
      port,
    })

    process.on("SIGINT", () => {
      server.close()
      process.exit(0)
    })
    process.on("SIGTERM", () => {
      server.close((err) => {
        if (err) {
          console.error(err)
          process.exit(1)
        }
        process.exit(0)
      })
    })

    const baseUrl = new URL(
      process.env.REMOTE_URL || `http://localhost:${port}`
    ).origin
    console.log(`APP MCP server started:`)
    console.log(`  - Streamable HTTP Endpoint: ${baseUrl}${SSE_PATH}`)
  } catch (error) {
    console.error("Failed to start MCP server", error)
    process.exit(1)
  }
}
