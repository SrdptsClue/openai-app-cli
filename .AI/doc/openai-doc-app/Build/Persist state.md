Storage
Persisting state and data for Apps SDK.

Why storage matters
Apps SDK handles conversation state automatically, but most real-world apps also need durable storage. You might cache fetched data, keep track of user preferences, or persist artifacts created inside a component. Choosing the right storage model upfront keeps your connector fast, reliable, and compliant.

Bring your own backend
If you already run an API or need multi-user collaboration, integrate with your existing storage layer. In this model:

Authenticate the user via OAuth (see Authentication) so you can map ChatGPT identities to your internal accounts.
Use your backend’s APIs to fetch and mutate data. Keep latency low; users expect components to render in a few hundred milliseconds.
Return sufficient structured content so the model can understand the data even if the component fails to load.
When you roll your own storage, plan for:

Data residency and compliance – ensure you have agreements in place before transferring PII or regulated data.
Rate limits – protect your APIs against bursty traffic from model retries or multiple active components.
Versioning – include schema versions in stored objects so you can migrate them without breaking existing conversations.
Persisting component state
Regardless of where you store authoritative data, design a clear state contract:

Use window.openai.setWidgetState for ephemeral UI state (selected tab, collapsed sections). This state travels with the conversation and is ideal for restoring context after a follow-up prompt.
Persist durable artifacts in your backend or the managed storage layer. Include identifiers in both the structured content and the widgetState payload so you can correlate them later.
Handle merge conflicts gracefully: if another user updates the underlying data, refresh the component via a follow-up tool call and explain the change in the chat transcript.
Operational tips
Backups and monitoring – treat MCP traffic like any other API. Log tool calls with correlation IDs and monitor for error spikes.
Data retention – set clear policies for how long you keep user data and how users can revoke access.
Dogfood first – run the storage path with internal testers before launching broadly so you can validate quotas, schema evolutions, and replay scenarios.
With a storage strategy in place you can safely handle read and write scenarios without compromising user trust.
