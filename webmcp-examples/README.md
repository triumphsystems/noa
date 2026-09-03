# WebMCP Examples & Agent Integration Profiles

This directory contains clean, standalone configuration profiles and code snippets for integrating Noa's WebMCP server (`/api/mcp`) and browser runtime (`document.modelContext`) with various AI agents and developer environments.

---

## Directory Structure

```
webmcp-examples/
├── claude-desktop/
│   └── claude_desktop_config.json      # Configuration for Anthropic Claude Desktop
├── cursor/
│   └── mcp.json                        # Configuration for Cursor IDE Agent
├── chatgpt/
│   └── actions-openapi.json            # OpenAPI 3.1 schema for ChatGPT Custom Actions
├── curl/
│   └── test-tools.sh                   # Shell script with sample cURL commands
├── browser/
│   └── register-tool-example.js        # Browser snippet using document.modelContext.registerTool
└── README.md                           # This guide
```

---

## 1. Cursor IDE Integration
To connect Cursor's AI Agent to Noa's 23+ clinical tools:
1. Copy [`cursor/mcp.json`](./cursor/mcp.json) to `.cursor/mcp.json` in your local environment, or open Cursor Settings &rarr; **Features** &rarr; **MCP** &rarr; **Add New MCP Server**.
2. Set the Server URL to:
   ```
   http://localhost:3000/api/mcp
   ```

---

## 2. Claude Desktop Integration
To connect Claude Desktop to Noa:
1. Open your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
2. Add the configuration from [`claude-desktop/claude_desktop_config.json`](./claude-desktop/claude_desktop_config.json):
   ```json
   {
     "mcpServers": {
       "noa-clinical": {
         "url": "http://localhost:3000/api/mcp"
       }
     }
   }
   ```
3. Restart Claude Desktop. The hammer icon will show all Noa clinical AI tools.

---

## 3. ChatGPT Custom GPT Actions
To connect a Custom GPT to Noa's WebMCP API:
1. In the ChatGPT GPT Builder, go to **Configure** &rarr; **Actions** &rarr; **Create new action**.
2. Copy and paste the contents of [`chatgpt/actions-openapi.json`](./chatgpt/actions-openapi.json) into the Schema box.

---

## 4. Testing with cURL / HTTP
Run the provided test script in [`curl/test-tools.sh`](./curl/test-tools.sh) to test tool execution, resource reading, and prompt generation from your terminal:
```bash
bash webmcp-examples/curl/test-tools.sh
```

---

## 5. Browser-Native `document.modelContext`
To dynamically register client tools at runtime in any component or browser console, see the example in [`browser/register-tool-example.js`](./browser/register-tool-example.js):
```javascript
document.modelContext.registerTool({
  name: "search_products",
  description: "Search product catalog",
  inputSchema: { ... },
  execute: async (input) => { ... }
})
```
