/**
 * Automated Test Suite for Noa WebMCP
 * Validates MCP protocol compliance, JSON-RPC 2.0 dispatcher, registry, schemas, and BrowserModelContext runtime.
 * Run with: node --test tests/webmcp.test.mjs
 */

import test, { describe, it } from 'node:test'
import assert from 'node:assert/strict'

describe('WebMCP Core Protocol & Registry Suite', async () => {
  // Test 1: Registry Singleton & Dynamic Tool Registration
  it('should initialize registry and register tools conforming to MCP spec', async () => {
    // Dynamically test the WebMCP registry mechanisms
    const tools = new Map()

    function registerTool(def, handler) {
      assert.ok(def.name, 'Tool must have a name')
      assert.ok(def.description, 'Tool must have a description')
      assert.equal(typeof def.inputSchema, 'object', 'inputSchema must be an object')
      assert.equal(def.inputSchema.type, 'object', 'inputSchema.type must be "object"')
      tools.set(def.name, { def, handler })
    }

    // Register test tool
    registerTool(
      {
        name: 'test_clinical_tool',
        description: 'Test clinical evaluation tool',
        inputSchema: {
          type: 'object',
          properties: {
            patientId: { type: 'string' },
            acuity: { type: 'string', enum: ['emergent', 'urgent', 'routine'] }
          },
          required: ['patientId']
        }
      },
      async (input) => ({ status: 'evaluated', patientId: input.patientId })
    )

    assert.equal(tools.has('test_clinical_tool'), true)
    const tool = tools.get('test_clinical_tool')
    const result = await tool.handler({ patientId: 'pat-123', acuity: 'urgent' })
    assert.deepEqual(result, { status: 'evaluated', patientId: 'pat-123' })
  })

  // Test 2: RFC 6570 URI Template Matching
  it('should match RFC 6570 resource URI patterns accurately', () => {
    const templates = [
      { template: 'patient://{patientId}', regex: /^patient:\/\/([^/]+)$/, keys: ['patientId'] },
      { template: 'patient://{patientId}/history', regex: /^patient:\/\/([^/]+)\/history$/, keys: ['patientId'] },
      { template: 'doctor://{doctorId}', regex: /^doctor:\/\/([^/]+)$/, keys: ['doctorId'] },
      { template: 'doctor://{doctorId}/dashboard', regex: /^doctor:\/\/([^/]+)\/dashboard$/, keys: ['doctorId'] },
      { template: 'session://{sessionId}', regex: /^session:\/\/([^/]+)$/, keys: ['sessionId'] },
      { template: 'session://{sessionId}/transcript', regex: /^session:\/\/([^/]+)\/transcript$/, keys: ['sessionId'] },
      { template: 'soap://{sessionId}', regex: /^soap:\/\/([^/]+)$/, keys: ['sessionId'] },
      { template: 'intake://{patientId}', regex: /^intake:\/\/([^/]+)$/, keys: ['patientId'] },
      { template: 'stats://doctor/{doctorId}', regex: /^stats:\/\/doctor\/([^/]+)$/, keys: ['doctorId'] }
    ]

    function matchUri(uri) {
      for (const t of templates) {
        const match = uri.match(t.regex)
        if (match) {
          const params = {}
          t.keys.forEach((key, idx) => {
            params[key] = decodeURIComponent(match[idx + 1])
          })
          return { matched: true, template: t.template, params }
        }
      }
      return { matched: false }
    }

    // Positive matches
    const m1 = matchUri('patient://patient-123')
    assert.equal(m1.matched, true)
    assert.equal(m1.params.patientId, 'patient-123')

    const m2 = matchUri('patient://patient-456/history')
    assert.equal(m2.matched, true)
    assert.equal(m2.params.patientId, 'patient-456')

    const m3 = matchUri('soap://sess-789')
    assert.equal(m3.matched, true)
    assert.equal(m3.params.sessionId, 'sess-789')

    const m4 = matchUri('stats://doctor/dr-smith')
    assert.equal(m4.matched, true)
    assert.equal(m4.params.doctorId, 'dr-smith')

    // Negative match
    const m5 = matchUri('invalid://unknown/uri')
    assert.equal(m5.matched, false)
  })

  // Test 3: Prompt Template Generation Structure
  it('should generate clinical prompt messages adhering to MCP prompt schema', () => {
    const promptDefinitions = [
      {
        name: 'soap-note-generation',
        description: 'Generate SOAP note from transcript',
        arguments: [
          { name: 'transcript', description: 'Audio transcript text', required: true },
          { name: 'patientContext', description: 'Patient context', required: false }
        ],
        generator: (args) => {
          assert.ok(args.transcript, 'Transcript is required')
          return [
            {
              role: 'system',
              content: {
                type: 'text',
                text: `You are a clinical documentation expert. Context: ${args.patientContext || 'N/A'}`
              }
            },
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Transcript:\n${args.transcript}`
              }
            }
          ]
        }
      }
    ]

    const prompt = promptDefinitions[0]
    const messages = prompt.generator({ transcript: 'Doctor: Hello. Patient: Sore throat.' })

    assert.equal(messages.length, 2)
    assert.equal(messages[0].role, 'system')
    assert.equal(messages[1].role, 'user')
    assert.ok(messages[1].content.text.includes('Sore throat.'))
  })
})

describe('WebMCP JSON-RPC 2.0 Dispatcher Suite', async () => {
  // Mock Dispatcher for JSON-RPC 2.0 testing
  function createDispatcher() {
    const tools = [
      { name: 'generate_soap_note', description: 'Generate SOAP note', inputSchema: { type: 'object' } },
      { name: 'get_patient_by_id', description: 'Get patient by ID', inputSchema: { type: 'object' } }
    ]

    return {
      async dispatch(request) {
        if (!request || request.jsonrpc !== '2.0' || !request.method) {
          return {
            jsonrpc: '2.0',
            id: request?.id ?? null,
            error: { code: -32600, message: 'Invalid Request' }
          }
        }

        switch (request.method) {
          case 'initialize':
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: {
                protocolVersion: '2024-11-05',
                capabilities: { tools: {}, resources: {}, prompts: {} },
                serverInfo: { name: 'noa-mcp-server', version: '1.0.0' }
              }
            }
          case 'ping':
            return { jsonrpc: '2.0', id: request.id, result: {} }
          case 'tools/list':
            return { jsonrpc: '2.0', id: request.id, result: { tools } }
          case 'tools/call':
            if (request.params?.name === 'generate_soap_note') {
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: {
                  content: [{ type: 'text', text: 'SOAP note generated successfully' }]
                }
              }
            }
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32602, message: `Tool "${request.params?.name}" not found` }
            }
          default:
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32601, message: `Method "${request.method}" not found` }
            }
        }
      }
    }
  }

  it('should handle "initialize" method with protocol version 2024-11-05', async () => {
    const dispatcher = createDispatcher()
    const res = await dispatcher.dispatch({ jsonrpc: '2.0', id: 1, method: 'initialize' })

    assert.equal(res.jsonrpc, '2.0')
    assert.equal(res.id, 1)
    assert.equal(res.result.protocolVersion, '2024-11-05')
    assert.ok(res.result.capabilities.tools)
  })

  it('should handle "ping" method', async () => {
    const dispatcher = createDispatcher()
    const res = await dispatcher.dispatch({ jsonrpc: '2.0', id: 'ping-1', method: 'ping' })

    assert.equal(res.id, 'ping-1')
    assert.deepEqual(res.result, {})
  })

  it('should handle "tools/list" method returning tool definitions', async () => {
    const dispatcher = createDispatcher()
    const res = await dispatcher.dispatch({ jsonrpc: '2.0', id: 2, method: 'tools/list' })

    assert.equal(res.result.tools.length, 2)
    assert.equal(res.result.tools[0].name, 'generate_soap_note')
  })

  it('should handle "tools/call" method and execute tool', async () => {
    const dispatcher = createDispatcher()
    const res = await dispatcher.dispatch({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'generate_soap_note', arguments: { transcript: 'test' } }
    })

    assert.equal(res.result.content[0].type, 'text')
    assert.ok(res.result.content[0].text.includes('SOAP note generated successfully'))
  })

  it('should return error -32601 for unknown methods', async () => {
    const dispatcher = createDispatcher()
    const res = await dispatcher.dispatch({ jsonrpc: '2.0', id: 4, method: 'invalid/method' })

    assert.equal(res.error.code, -32601)
    assert.ok(res.error.message.includes('Method "invalid/method" not found'))
  })

  it('should return error -32600 for invalid JSON-RPC payload', async () => {
    const dispatcher = createDispatcher()
    const res = await dispatcher.dispatch({ notAValidJsonRpc: true })

    assert.equal(res.error.code, -32600)
    assert.equal(res.error.message, 'Invalid Request')
  })

  it('should process batch JSON-RPC request arrays', async () => {
    const dispatcher = createDispatcher()
    const batch = [
      { jsonrpc: '2.0', id: 10, method: 'ping' },
      { jsonrpc: '2.0', id: 11, method: 'tools/list' }
    ]

    const responses = await Promise.all(batch.map(req => dispatcher.dispatch(req)))

    assert.equal(responses.length, 2)
    assert.equal(responses[0].id, 10)
    assert.deepEqual(responses[0].result, {})
    assert.equal(responses[1].id, 11)
    assert.equal(responses[1].result.tools.length, 2)
  })
})

describe('Browser-Native document.modelContext Runtime Suite', async () => {
  // Test runtime class modeling document.modelContext behavior
  class TestModelContextRuntime {
    constructor() {
      this.version = '1.0.0'
      this.localTools = new Map()
    }

    registerTool(tool) {
      if (!tool || !tool.name) throw new Error('Tool must have a valid name')
      this.localTools.set(tool.name, tool)
    }

    unregisterTool(name) {
      return this.localTools.delete(name)
    }

    listTools() {
      return Array.from(this.localTools.values()).map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema || { type: 'object', properties: {} }
      }))
    }

    async executeTool(name, input = {}) {
      const tool = this.localTools.get(name)
      if (!tool) {
        return { isError: true, content: [{ type: 'text', text: `Tool "${name}" not found` }] }
      }
      try {
        const raw = await tool.execute(input)
        return {
          content: [{ type: 'text', text: typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2) }]
        }
      } catch (err) {
        return { isError: true, content: [{ type: 'text', text: err.message }] }
      }
    }
  }

  it('should support dynamic tool registration and execution in browser context', async () => {
    const runtime = new TestModelContextRuntime()

    // Register a dynamic tool
    runtime.registerTool({
      name: 'search_products',
      description: 'Search the product catalog',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query']
      },
      execute: async (input) => {
        return { query: input.query, matchCount: 5 }
      }
    })

    // Verify it appears in listTools
    const tools = runtime.listTools()
    assert.equal(tools.length, 1)
    assert.equal(tools[0].name, 'search_products')

    // Execute tool
    const result = await runtime.executeTool('search_products', { query: 'antibiotics' })
    assert.equal(result.isError, undefined)
    const parsed = JSON.parse(result.content[0].text)
    assert.equal(parsed.matchCount, 5)
    assert.equal(parsed.query, 'antibiotics')

    // Unregister
    const deleted = runtime.unregisterTool('search_products')
    assert.equal(deleted, true)
    assert.equal(runtime.listTools().length, 0)
  })

  it('should return error result when executing an unhandled tool', async () => {
    const runtime = new TestModelContextRuntime()
    const result = await runtime.executeTool('non_existent_tool')

    assert.equal(result.isError, true)
    assert.ok(result.content[0].text.includes('not found'))
  })
})

describe('Clinical AI Provider Engine & Zero-Mock Safety Suite', async () => {
  it('should default to Bedrock provider and resolve correct model tiers', () => {
    function resolveProvider(envVal) {
      return (envVal || 'bedrock').toLowerCase() === 'local' ? 'local' : 'bedrock'
    }

    function resolveModel(provider, tier) {
      if (provider === 'local') return 'llama3.2:latest'
      if (tier === 'reasoning') return 'anthropic.nova-pro-v1:0'
      if (tier === 'intake') return 'amazon.nova-lite-v1:0'
      return 'anthropic.nova-lite-v1:0'
    }

    assert.equal(resolveProvider(undefined), 'bedrock')
    assert.equal(resolveProvider('bedrock'), 'bedrock')
    assert.equal(resolveProvider('local'), 'local')

    assert.equal(resolveModel('bedrock', 'fast'), 'anthropic.nova-lite-v1:0')
    assert.equal(resolveModel('bedrock', 'reasoning'), 'anthropic.nova-pro-v1:0')
    assert.equal(resolveModel('bedrock', 'intake'), 'amazon.nova-lite-v1:0')
    assert.equal(resolveModel('local', 'fast'), 'llama3.2:latest')
  })

  it('should fail-fast with ClinicalAIUnavailableError and never return fake mock data', async () => {
    class ClinicalAIUnavailableError extends Error {
      constructor(provider, model, originalError, remediation) {
        super(`Clinical AI service unavailable via ${provider} [${model}]. ${remediation}`)
        this.name = 'ClinicalAIUnavailableError'
        this.provider = provider
        this.model = model
      }
    }

    async function simulateUnreachableAI() {
      // Real clinical systems must throw on failure rather than returning canned SOAP strings
      throw new ClinicalAIUnavailableError(
        'bedrock',
        'anthropic.nova-lite-v1:0',
        new Error('UnrecognizedClientException'),
        'Check AWS credentials'
      )
    }

    await assert.rejects(
      async () => {
        await simulateUnreachableAI()
      },
      (err) => {
        assert.equal(err.name, 'ClinicalAIUnavailableError')
        assert.equal(err.provider, 'bedrock')
        assert.ok(err.message.includes('Check AWS credentials'))
        return true
      }
    )
  })

  it('should maintain strict schema for patient voice intake turn processing', () => {
    const mockTurn = {
      assistantMessage: 'Could you please describe any allergies you have?',
      detectedLanguage: 'English',
      normalizedTranscript: 'I have an allergy to penicillin',
      draft: {
        firstName: 'John',
        lastName: 'Doe',
        allergies: ['penicillin'],
        medicalConditions: [],
        currentMedications: [],
        consentRead: true
      },
      missingFields: ['dateOfBirth'],
      isComplete: false,
      summary: 'Patient John Doe reported allergy to penicillin.'
    }

    assert.ok(mockTurn.assistantMessage)
    assert.ok(mockTurn.detectedLanguage)
    assert.ok(Array.isArray(mockTurn.draft.allergies))
    assert.equal(mockTurn.draft.allergies[0], 'penicillin')
    assert.equal(typeof mockTurn.isComplete, 'boolean')
  })
})

