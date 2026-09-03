# WebMCP Documentation: Model Context Protocol for Noa

Noa implements the **Model Context Protocol (MCP)** specification across both server-side transports (HTTP JSON-RPC 2.0 & Server-Sent Events) and client-side browser environments via the browser-native `document.modelContext` standard (with aliases on `window.webmcp` and `navigator.modelContext`).

---

## 1. Server-Side MCP Endpoint (`/api/mcp`)

The server endpoint is located at `/api/mcp`.

### Transports Supported
1. **HTTP POST (JSON-RPC 2.0)**: Supports single requests and batch request arrays conforming to the MCP protocol version `2024-11-05`.
2. **Server-Sent Events (SSE)**: Send a `GET /api/mcp` request with `Accept: text/event-stream` to establish a persistent streaming session for agents like Claude Desktop.
3. **Service Discovery (GET)**: Send a `GET /api/mcp` with `Accept: application/json` to discover all registered tools, resources, templates, and prompt counts.

### Quick cURL Examples

#### Discover Tools and Resources
```bash
curl -X GET http://localhost:3000/api/mcp \
  -H "Accept: application/json"
```

#### Execute a Tool (`generate_soap_note`)
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "generate_soap_note",
      "arguments": {
        "transcript": "Doctor: Good morning John, what brings you in? Patient: I have had a severe dry cough for three days and a mild fever."
      }
    }
  }'
```

#### Read a Resource (`patient://patient-1`)
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "resources/read",
    "params": {
      "uri": "patient://patient-1"
    }
  }'
```

#### Fetch a Prompt Template (`soap-note-generation`)
```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "prompts/get",
    "params": {
      "name": "soap-note-generation",
      "arguments": {
        "transcript": "Doctor: Hello, how are you feeling? Patient: Terrible headache since yesterday."
      }
    }
  }'
```

---

## 2. Connecting External Agents (Cursor IDE & Claude Desktop)

Noa provides pre-configured integration profiles for external coding assistants and desktop agents:

### Cursor IDE
A ready-to-use configuration file is provided at [`.cursor/mcp.json`](file:///E:/Documents/Projects/noa/.cursor/mcp.json):
```json
{
  "mcpServers": {
    "noa-clinical": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```
Open Cursor settings &rarr; **Features** &rarr; **MCP**, and Noa's 23+ clinical tools will be discovered automatically.

### Claude Desktop
A ready-to-use configuration example is provided at [`claude_desktop_config.example.json`](file:///E:/Documents/Projects/noa/claude_desktop_config.example.json). Add the entry to your Claude Desktop configuration:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "noa-clinical": {
      "url": "http://localhost:3000/api/mcp"
    }
  }
}
```

---

## 3. Browser-Native WebMCP Standard (`document.modelContext`)

On the client side, Noa polyfills and exposes `document.modelContext`.

### Registering Tools Locally in Any Page or Component
```typescript
document.modelContext.registerTool({
  name: "search_products",
  description: "Search the product catalog",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      category: { type: "string" }
    },
    required: ["query"]
  },
  execute: async (input) => {
    const results = await fetch(`/api/products?q=${encodeURIComponent(input.query)}`)
    return await results.json()
  }
})
```

### Executing Tools in the Browser
```typescript
// Call a client-side or server-side tool seamlessly:
const result = await document.modelContext.executeTool("generate_patient_summary", {
  soapNote: "SUBJECTIVE: Patient has hypertension. PLAN: Continue Lisinopril 10mg."
})
console.log(result.content[0].text)
```

### Accessing Client Session State
```typescript
// Inspect live in-memory Zustand stores (recording status, duration, active doctor):
console.log(document.modelContext.clientState)

// Start or stop recording from an agent:
await document.modelContext.executeTool("client_start_recording")
await document.modelContext.executeTool("client_stop_recording")
```

### React Hook Usage
```tsx
import { useModelContext } from '@/lib/webmcp'

export function MyComponent() {
  const modelContext = useModelContext()

  useEffect(() => {
    if (!modelContext) return

    modelContext.registerTool({
      name: "highlight_tab",
      description: "Switches the active consultation tab",
      execute: async ({ tab }) => {
        setActiveTab(tab)
        return { success: true }
      }
    })

    return () => {
      modelContext.unregisterTool("highlight_tab")
    }
  }, [modelContext])
}
```

---

## 3. Catalog of Exported Tools

| Domain | Tool Name | Description |
| :--- | :--- | :--- |
| **Clinical AI** | `generate_soap_note` | Generates structured Subjective, Objective, Assessment, Plan notes from audio transcript. |
| **Clinical AI** | `generate_clinical_insights` | Generates differential diagnoses and clinical decision support recommendations with Nova Pro. |
| **Clinical AI** | `generate_patient_summary` | Converts complex clinical SOAP notes into jargon-free summaries for patients. |
| **Clinical AI** | `generate_triage_priority` | Evaluates complaints, symptoms, and vitals to determine acuity (`emergent`, `urgent`, `routine`). |
| **Clinical AI** | `generate_follow_up_plan` | Formulates actionable post-consultation care plans and monitoring schedules. |
| **Clinical AI** | `get_clinical_suggestions` | Contextual real-time clinical suggestions and questions during active consultation. |
| **Clinical AI** | `analyze_session_sentiment` | Analyzes patient sentiment, emotional distress, and clinical urgency. |
| **Voice Intake** | `process_intake_turn` | Processes conversational voice turns, extracts structured health data, and manages language. |
| **Voice Intake** | `transcribe_consultation_audio` | Transcribes consultation audio via AWS Transcribe Medical integration. |
| **Patients** | `get_patient_by_id` | Retrieves patient demographics, conditions, medications, and allergies. |
| **Patients** | `list_doctor_patients` | Lists all patients assigned to a clinician. |
| **Patients** | `create_new_patient` | Registers a new patient with medical history in DynamoDB. |
| **Patients** | `update_patient_record` | Updates patient clinical or demographic fields. |
| **Patients** | `delete_patient_record` | Removes a patient record from the database. |
| **Doctors** | `get_doctor_profile` | Retrieves doctor credentials and clinic profile by ID or email. |
| **Doctors** | `update_doctor_profile` | Updates doctor specialty, clinic name, phone, and avatar. |
| **Doctors** | `get_doctor_stats` | Computes live practice metrics (total patients, active/completed visits, pending notes). |
| **Sessions** | `get_consultation_session` | Retrieves consultation session record by ID. |
| **Sessions** | `list_doctor_sessions` | Retrieves all consultation sessions conducted by a doctor. |
| **Sessions** | `create_consultation_session` | Creates a new consultation session between a doctor and patient. |
| **Sessions** | `update_session_soap_note` | Attaches or updates finalized SOAP note on a session. |
| **Sessions** | `complete_consultation_session` | Finalizes a consultation session and records completion timestamp. |
| **Intakes** | `get_patient_intake_record` | Retrieves structured intake questionnaire by patient ID. |
| **Intakes** | `save_patient_intake_record` | Saves completed intake questionnaire and medical history. |
| **Browser Client** | `client_get_active_session` | Reads live consultation session from browser memory (Zustand). |
| **Browser Client** | `client_start_recording` | Starts audio recording on the active client session store. |
| **Browser Client** | `client_stop_recording` | Stops audio recording on the active client session store. |
| **Browser Client** | `client_append_transcript` | Injects text chunks into the active client transcript. |

---

## 4. Catalog of Exported Resources

| URI Template | MIME Type | Description |
| :--- | :--- | :--- |
| `patient://{patientId}` | `application/json` | Patient demographic and clinical profile. |
| `patient://{patientId}/history` | `application/json` | Patient chronological consultation history. |
| `doctor://{doctorId}` | `application/json` | Doctor profile, clinic, and specialty. |
| `doctor://{doctorId}/dashboard` | `application/json` | Unified doctor dashboard payload (profile, patients, sessions, metrics). |
| `session://{sessionId}` | `application/json` | Full consultation session record and status. |
| `session://{sessionId}/transcript` | `text/plain` | Raw conversational audio transcript. |
| `soap://{sessionId}` | `application/json` | Structured clinical SOAP note. |
| `intake://{patientId}` | `application/json` | Patient intake health questionnaire. |
| `stats://doctor/{doctorId}` | `application/json` | Practice performance metrics. |

---

## 5. Catalog of Exported Prompts

| Prompt Name | Arguments | Description |
| :--- | :--- | :--- |
| `soap-note-generation` | `transcript` (req), `patientContext` (opt) | Synthesizes structured SOAP notes from transcript. |
| `clinical-insights` | `patientHistory` (req), `currentPresentation` (req), `previousFindings` (opt) | Generates clinical considerations and differential diagnoses. |
| `patient-summary` | `soapNote` (req), `clinicalTerms` (opt) | Translates clinical notes into patient-accessible health summaries. |
| `triage-assessment` | `chiefComplaint` (req), `symptoms` (req), `vitalSigns` (opt) | Evaluates acuity and assigns emergency triage priority. |
| `intake-conversation-turn` | `transcript` (req), `language` (opt) | Conducts conversational medical intake interview turns. |
| `follow-up-care-plan` | `assessment` (req), `medications` (req) | Synthesizes follow-up care plans and patient instructions. |
