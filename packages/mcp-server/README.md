# EventLite MCP Server

MCP (Model Context Protocol) server for EventLite - Allows Claude to manage events and registrations.

## Installation

### Using npx (recommended)

```bash
npx @eventlite/mcp-server
```

### From source

```bash
cd packages/mcp-server
npm install
npm run build
npm start
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `EVENTLITE_API_URL` | No | API base URL (default: `http://localhost:3000`) |
| `EVENTLITE_API_KEY` | **Yes** | Your EventLite API key |

### Getting your API Key

Your API key is generated from your email and the app's secret:

```javascript
const apiKey = btoa(`your-email@example.com:${NEXTAUTH_SECRET}`);
```

Or use the value from your EventLite dashboard.

## Claude Desktop Configuration

Add to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "eventlite": {
      "command": "npx",
      "args": ["@eventlite/mcp-server"],
      "env": {
        "EVENTLITE_API_URL": "https://your-app.vercel.app",
        "EVENTLITE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### For local development

```json
{
  "mcpServers": {
    "eventlite": {
      "command": "node",
      "args": ["/path/to/cc-events/packages/mcp-server/dist/index.js"],
      "env": {
        "EVENTLITE_API_URL": "http://localhost:3000",
        "EVENTLITE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Available Tools

### Events

| Tool | Description |
|------|-------------|
| `list_events` | List all events with optional status filter |
| `get_event` | Get details of an event by ID or slug |
| `create_event` | Create a new event |
| `update_event` | Update an existing event |
| `delete_event` | Delete an event |

### Registrations

| Tool | Description |
|------|-------------|
| `list_registrations` | List registrations for an event |
| `register_attendee` | Register someone for an event |
| `unregister_attendee` | Cancel a registration |

### Notifications

| Tool | Description |
|------|-------------|
| `send_notification` | Send email to event attendees |

## Usage Examples

Once configured, you can ask Claude:

### List events
> "Show me my upcoming events"
> "List all published events"

### Create an event
> "Create a new meetup called 'AI Workshop' for next Friday at 7pm at 42 rue de la Tech, Paris"

### Manage registrations
> "How many people are registered for the AI Workshop?"
> "Register john@example.com (John Doe) for the meetup"
> "Show me the waitlist for the workshop"

### Send notifications
> "Send a reminder to all confirmed attendees for tomorrow's event"
> "Notify the waitlist that spots might open up"

## Example Conversation

```
User: Create a meetup about Claude for February 20th at 7pm

Claude: I'll create that event for you.
[calls create_event]
✅ Event created successfully!
Title: Meetup Claude
Slug: meetup-claude
Status: DRAFT

Would you like me to publish it?

User: Yes, publish it and set capacity to 30

Claude: [calls update_event]
✅ Event updated! It's now published with 30 spots available.

User: Register alice@example.com

Claude: [calls register_attendee]
✅ Alice has been registered and confirmed!

User: How many spots are left?

Claude: [calls get_event]
Currently 1/30 spots filled. 29 spots remaining.
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Run locally
EVENTLITE_API_KEY=your-key npm start
```

## License

MIT
