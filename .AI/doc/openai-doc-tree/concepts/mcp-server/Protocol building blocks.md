A minimal MCP server for Apps SDK implements three capabilities:

List tools – your server advertises the tools it supports, including their JSON Schema input and output contracts and optional annotations.
Call tools – when a model selects a tool to use, it sends a call_tool request with the arguments corresponding to the user intent. Your server executes the action and returns structured content the model can parse.
Return components – in addition to structured content returned by the tool, each tool (in its metadata) can optionally point to an embedded resource that represents the interface to render in the ChatGPT client.
The protocol is transport agnostic, you can host the server over Server-Sent Events or Streamable HTTP. Apps SDK supports both options, but we recommend Streamable HTTP.