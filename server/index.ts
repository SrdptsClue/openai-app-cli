import { serve } from "@hono/node-server"
import { config as initEnv } from "dotenv"
import { createStreamableHTTPApp, SSE_PATH } from "./helper/app"

initEnv({ quiet: true })

async function bootstrap() {
  const port = Number(process.env.PORT)
  const host = process.env.HOST

  if (!Number.isFinite(port) || !host) {
    console.error("Invalid PORT or HOST environment variables")
    process.exit(0)
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

    const baseUrl = `http://localhost:${port}`
    console.log(`APP MCP server started:`)
    console.log(`  - Streamable HTTP Endpoint: ${baseUrl}${SSE_PATH}`)
  } catch (error) {
    console.error("Failed to start MCP server", error)
    process.exit(1)
  }
}

void bootstrap()
