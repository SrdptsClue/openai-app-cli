import type {
  Resource,
  ResourceTemplate,
  Tool,
} from "@modelcontextprotocol/sdk/types.js"
import fs from "node:fs"
import path from "node:path"
import type { ZodObject } from "zod"

export interface WidgetDefinition {
  readonly id: string
  readonly title: string
  readonly templateUri: string
  readonly invoking: string
  readonly invoked: string
  readonly assetName: string
  readonly responseText: string
  readonly html: string
}

export interface WidgetCollection {
  readonly widget: Omit<WidgetDefinition, "html">
  readonly toolInputSchema: Tool["inputSchema"]
  readonly toolInputParser: ZodObject
}

export interface WidgetMapItem {
  readonly widget: WidgetDefinition
  readonly toolInputSchema: Tool["inputSchema"]
  readonly toolInputParser: ZodObject
}

export type WidgetMeta = ReturnType<WidgetProvider["getWidgetMeta"]>

/**
 * Central registry that loads widget HTML from disk and exposes MCP-friendly
 * structures (tools, resources, metadata). `createMcpServer` instantiates this
 * provider once and reuses the lookups to serve every MCP request.
 */
export class WidgetProvider {
  // Location of the built widget assets (HTML per widget).
  private readonly ASSETS_DIR = path.join(__dirname, "assets")

  private readonly widgetMapById: Map<string, WidgetMapItem> = new Map()
  private readonly widgetMapByUri: Map<string, WidgetMapItem> = new Map()

  private readonly widgetMetaMapById: Map<string, WidgetMeta> = new Map()
  private readonly widgetMetaMapByUri: Map<string, WidgetMeta> = new Map()

  private readonly tools: Tool[] = []
  private readonly resources: Resource[] = []
  private readonly resourceTemplates: ResourceTemplate[] = []

  constructor(widgetCollection: WidgetCollection[]) {
    // Normalize every widget definition into lookup tables + MCP descriptors.
    for (const collection of widgetCollection) {
      const { widget, toolInputSchema, toolInputParser } = collection
      const widgetMapItem = {
        widget: {
          ...widget,
          html: this.readWidgetHtml(widget.assetName),
        },
        toolInputSchema,
        toolInputParser,
      } as const

      this.widgetMapById.set(widget.id, widgetMapItem)
      this.widgetMapByUri.set(widget.templateUri, widgetMapItem)

      const widgetMeta = this.getWidgetMeta(widgetMapItem.widget)

      this.widgetMetaMapById.set(widget.id, widgetMeta)
      this.widgetMetaMapByUri.set(widget.templateUri, widgetMeta)

      this.tools.push({
        name: widget.id,
        inputSchema: toolInputSchema,
        title: widget.title,
        description: widget.title,
        // To disable the approval prompt for the widgets
        annotations: {
          destructiveHint: false,
          openWorldHint: false,
          readOnlyHint: true,
        },
        _meta: widgetMeta,
      })

      this.resources.push({
        uri: widget.templateUri,
        name: widget.title,
        description: `${widget.title} widget markup`,
        mimeType: "text/html+skybridge",
        _meta: widgetMeta,
      })

      this.resourceTemplates.push({
        uriTemplate: widget.templateUri,
        name: widget.title,
        description: `${widget.title} widget markup`,
        mimeType: "text/html+skybridge",
        _meta: widgetMeta,
      })
    }
  }

  // Resolve the HTML snippet Vite produced for a given widget.
  private readWidgetHtml(assetName: string) {
    if (!fs.existsSync(this.ASSETS_DIR)) {
      throw new Error(`Assets folder not found: ${this.ASSETS_DIR}`)
    }

    const directPath = path.join(this.ASSETS_DIR, `${assetName}.html`)
    if (fs.existsSync(directPath)) {
      return fs.readFileSync(directPath, "utf8")
    } else {
      throw new Error(`Widget HTML not found: ${assetName}`)
    }
  }

  // Metadata shared between resource/tool responses so MCP inspector can render widgets inline.
  private getWidgetMeta(widget: WidgetDefinition) {
    return {
      "openai/outputTemplate": widget.templateUri,
      "openai/toolInvocation/invoking": widget.invoking,
      "openai/toolInvocation/invoked": widget.invoked,
      "openai/widgetAccessible": true,
      "openai/resultCanProduceWidget": true,
    } as const
  }

  public getWidgetMapItemById(id: string) {
    return this.widgetMapById.get(id)
  }

  public getWidgetMapItemByUri(uri: string) {
    return this.widgetMapByUri.get(uri)
  }

  public getWidgetMetaById(id: string) {
    return this.widgetMetaMapById.get(id)
  }

  public getWidgetMetaByUri(uri: string) {
    return this.widgetMetaMapByUri.get(uri)
  }

  public getTools() {
    return this.tools
  }

  public getResources() {
    return this.resources
  }

  public getResourceTemplates() {
    return this.resourceTemplates
  }
}
