#!/bin/bash
# WebMCP CLI / cURL Test Scripts

BASE_URL="http://localhost:3000"

echo "=== 1. Discovering WebMCP Capabilities ==="
curl -s "${BASE_URL}/api/mcp" -H "Accept: application/json" | jq .

echo ""
echo "=== 2. Calling generate_soap_note Tool ==="
curl -s -X POST "${BASE_URL}/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "generate_soap_note",
      "arguments": {
        "transcript": "Doctor: Good morning. Patient: I have had shortness of breath and chest tightness since yesterday."
      }
    }
  }' | jq .

echo ""
echo "=== 3. Reading Resource patient://patient-1 ==="
curl -s -X POST "${BASE_URL}/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "resources/read",
    "params": {
      "uri": "patient://patient-1"
    }
  }' | jq .

echo ""
echo "=== 4. Fetching Prompt Template soap-note-generation ==="
curl -s -X POST "${BASE_URL}/api/mcp" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "prompts/get",
    "params": {
      "name": "soap-note-generation",
      "arguments": {
        "transcript": "Doctor: Hello. Patient: My knee is swollen."
      }
    }
  }' | jq .
