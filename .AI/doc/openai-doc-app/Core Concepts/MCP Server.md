MCP
Understand how the Model Context Protocol works with Apps SDK.

What is MCP?
The Model Context Protocol (MCP) is an open specification for connecting large language model clients to external tools and resources. An MCP server exposes tools that a model can call during a conversation, and return results given specified parameters. Other resources (metadata) can be returned along with tool results, including the inline html that we can use in the Apps SDK to render an interface.

With Apps SDK, MCP is the backbone that keeps server, model, and UI in sync. By standardising the wire format, authentication, and metadata, it lets ChatGPT reason about your app the same way it reasons about built-in tools.

Protocol building blocks
A minimal MCP server for Apps SDK implements three capabilities:

List tools – your server advertises the tools it supports, including their JSON Schema input and output contracts and optional annotations.
Call tools – when a model selects a tool to use, it sends a call_tool request with the arguments corresponding to the user intent. Your server executes the action and returns structured content the model can parse.
Return components – in addition to structured content returned by the tool, each tool (in its metadata) can optionally point to an embedded resource that represents the interface to render in the ChatGPT client.
The protocol is transport agnostic, you can host the server over Server-Sent Events or Streamable HTTP. Apps SDK supports both options, but we recommend Streamable HTTP.

Why Apps SDK standardises on MCP
Working through MCP gives you several benefits out of the box:

Discovery integration – the model consumes your tool metadata and surface descriptions the same way it does for first-party connectors, enabling natural-language discovery and launcher ranking. See Discovery for details.
Conversation awareness – structured content and component state flow through the conversation. The model can inspect the JSON result, refer to IDs in follow-up turns, or render the component again later.
Multiclient support – MCP is self-describing, so your connector works across ChatGPT web and mobile without custom client code.
Extensible auth – the specification includes protected resource metadata, OAuth 2.1 flows, and dynamic client registration so you can control access without inventing a proprietary handshake.
Next steps
If you’re new to MCP, we recommend starting with the following resources:

Model Context Protocol specification
Official SDKs: Python SDK (official; includes FastMCP module) and TypeScript
MCP Inspector for local debugging
Once you are comfortable with the MCP primitives, you can move on to the Set up your server guide for implementation details.
