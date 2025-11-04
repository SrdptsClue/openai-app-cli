import type { ServerOptions } from "@modelcontextprotocol/sdk/server/index.js"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import z from "zod"
import { readWidgetHtmlByUri } from "./utils/resource"

export const MCPServerMetadata: ConstructorParameters<typeof McpServer>[0] = {
  name: process.env.MCP_SERVER_NAME || "demo-server",
  version: process.env.MCP_SERVER_VERSION || "1.0.0",
}

export const MCPServerOptions: ServerOptions = {}

export function handleMCPServerRegistry(server: McpServer) {
  const remoteAssetsOrigin = process.env.REMOTE_URL

  const greetingWidgetUri = "ui://widget/greeting.html"

  server.registerResource(
    "greeting",
    greetingWidgetUri,
    {
      title: "Greeting Resource",
      description: "Dynamic greeting generator",
    },
    async ({ href: uri }) => ({
      contents: [
        {
          uri,
          mimeType: "text/html+skybridge",
          text: readWidgetHtmlByUri(uri),
          _meta: {
            "openai/widgetPrefersBorder": true,
            ...(remoteAssetsOrigin && {
              "openai/widgetDomain": remoteAssetsOrigin,
              "openai/widgetCSP": {
                connect_domains: [remoteAssetsOrigin],
                resource_domains: [remoteAssetsOrigin],
              },
            }),
          },
        },
      ],
    })
  )

  server.registerTool(
    "greeting",
    {
      title: "greeting Tool",
      description: "Generate greeting messages",
      _meta: {
        "openai/outputTemplate": greetingWidgetUri,
        "openai/widgetAccessible": true,
        "openai/resultCanProduceWidget": true,
      },
      inputSchema: { message: z.string() },
      outputSchema: { result: z.string() },
    },
    async ({ message }) => {
      return {
        content: [],
        structuredContent: { result: `AI: ${message}` },
      }
    }
  )
}
