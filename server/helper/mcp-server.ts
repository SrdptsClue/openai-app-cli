import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import {
  CallToolRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourceTemplatesRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
} from "@modelcontextprotocol/sdk/types.js"
import { WidgetProvider } from "../base/widgetProvider"
import {
  MCPServerMetadata,
  MCPServerOptions,
  widgetCollection,
} from "../config"

export function createMcpServer(): Server {
  const widgetProvider = new WidgetProvider(widgetCollection)

  const server = new Server(MCPServerMetadata, MCPServerOptions)

  server.setRequestHandler(
    ReadResourceRequestSchema,
    async (request: ReadResourceRequest) => {
      const widgetMapItem = widgetProvider.getWidgetMapItemByUri(
        request.params.uri
      )
      if (!widgetMapItem) {
        throw new Error(`Unknown resource: ${request.params.uri}`)
      }

      const { widget } = widgetMapItem
      const widgetMeta = widgetProvider.getWidgetMetaByUri(request.params.uri)

      return {
        contents: [
          {
            uri: widget.templateUri,
            mimeType: "text/html+skybridge",
            text: widget.html,
            _meta: widgetMeta,
          },
        ],
      }
    }
  )

  server.setRequestHandler(
    ListToolsRequestSchema,
    async (_request: ListToolsRequest) => ({
      tools: widgetProvider.getTools(),
    })
  )

  server.setRequestHandler(
    ListResourcesRequestSchema,
    async (_request: ListResourcesRequest) => ({
      resources: widgetProvider.getResources(),
    })
  )

  server.setRequestHandler(
    ListResourceTemplatesRequestSchema,
    async (_request: ListResourceTemplatesRequest) => ({
      resourceTemplates: widgetProvider.getResourceTemplates(),
    })
  )

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      const widgetMapItem = widgetProvider.getWidgetMapItemById(
        request.params.name
      )
      if (!widgetMapItem) {
        throw new Error(`Unknown tool: ${request.params.name}`)
      }

      const { widget, toolInputParser } = widgetMapItem
      const args = toolInputParser.parse(request.params.arguments ?? {})
      const widgetMeta = widgetProvider.getWidgetMetaById(request.params.name)

      return {
        content: [
          {
            type: "text",
            text: widget.responseText,
          },
        ],
        structuredContent: args,
        _meta: widgetMeta,
      }
    }
  )

  return server
}
