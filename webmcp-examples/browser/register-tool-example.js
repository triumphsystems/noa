/**
 * Browser-Native WebMCP Example: Registering Dynamic Tools
 * Run this snippet directly in the browser developer tools console on any page.
 */

// 1. Register a dynamic client tool
document.modelContext.registerTool({
  name: "search_products",
  description: "Search the clinical product and medication catalog",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search keyword or generic drug name" },
      category: { type: "string", description: "Filter by category (e.g. antibiotics, analgesics)" }
    },
    required: ["query"]
  },
  execute: async (input) => {
    console.log("[WebMCP Tool] Searching products for:", input.query)
    // Custom logic, fetch calls, or in-memory search:
    return {
      query: input.query,
      results: [
        { id: "med-1", name: "Amoxicillin 500mg", category: "Antibiotics", stock: 120 },
        { id: "med-2", name: "Lisinopril 10mg", category: "Antihypertensives", stock: 85 }
      ]
    }
  }
})

console.log("Tool registered! Now execute it:")

// 2. Execute the dynamically registered tool
document.modelContext.executeTool("search_products", { query: "Amoxicillin" })
  .then(result => {
    console.log("Execution output:")
    console.log(result.content[0].text)
  })

// 3. List all active tools (shows your tool alongside preloaded Noa tools)
console.log("All active tools in document.modelContext:", document.modelContext.listTools())
