import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import {
  MCPServerMetadata,
  MCPServerOptions,
  handleMCPServerRegistry,
} from "../config"

export function createMcpServer() {
  const server = new McpServer(MCPServerMetadata, MCPServerOptions)

  handleMCPServerRegistry(server)

  return server
}
