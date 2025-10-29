import { StreamableHTTPTransport } from "@hono/mcp"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { createMcpServer } from "./mcp-server"

const SSE_PATH = "/mcp"
const ASSETS_PATH = "/assets/*"

export async function createStreamableHTTPApp() {
  const app = new Hono()

  for (const path of [SSE_PATH, ASSETS_PATH]) {
    app.use(path, cors())
  }

  app.use("*", async (c, next) => {
    console.log(`[${new Date().toISOString()}] ${c.req.method} ${c.req.url}`)
    await next()
  })

  app.use(ASSETS_PATH, serveStatic({ root: "./output" }))

  app.all(SSE_PATH, async (c) => {
    const transport = new StreamableHTTPTransport()
    const mcpServer = createMcpServer()
    await mcpServer.connect(transport)

    return transport.handleRequest(c)
  })

  return app
}

export { SSE_PATH }
