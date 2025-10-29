import z from "zod"
import type { WidgetCollection } from "./base/widgetProvider"
import {
  Server,
  type ServerOptions,
} from "@modelcontextprotocol/sdk/server/index.js"

export const MCPServerMetadata: ConstructorParameters<typeof Server>[0] = {
  name: "app-node",
  version: "0.0.0",
}

export const MCPServerOptions: ServerOptions = {
  capabilities: {
    resources: {},
    tools: {},
  },
}

export const widgetCollection: WidgetCollection[] = [
  {
    widget: {
      id: "example",
      title: "Show Example",
      templateUri: "ui://widget/example.html",
      invoking: "invoking example",
      invoked: "invoked example",
      assetName: "example",
      responseText: "Rendered a example!",
    },
    toolInputSchema: {
      type: "object",
      properties: {
        exampleTip: {
          type: "string",
          description: "A short and pleasant greeting.",
        },
      },
      required: ["exampleTip"],
    },
    toolInputParser: z.object({
      exampleTip: z.string(),
    }),
  },
]
