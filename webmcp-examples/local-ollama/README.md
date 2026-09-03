# Local LLM Inference Setup (Ollama / LocalAI)

Noa strictly rules out mock data. In development or air-gapped environments, Noa can execute **real local inference** via any OpenAI-compatible server such as Ollama.

---

## 1. Quickstart with Ollama

### Step 1: Install Ollama
Download and install Ollama from [ollama.com](https://ollama.com).

### Step 2: Pull a Fast Medical or General Model
```bash
# General lightweight model (3B parameters, very fast)
ollama pull llama3.2:latest

# Or specialized clinical model:
# ollama pull biomistral:latest
```

### Step 3: Configure Noa Environment
In your `.env.local`:
```env
# Switch from Bedrock to Local Inference
CLINICAL_AI_PROVIDER=local

# Local endpoint (Ollama standard endpoint)
LOCAL_AI_ENDPOINT=http://localhost:11434/v1

# Selected model
LOCAL_AI_MODEL=llama3.2:latest
```

### Step 4: Run Noa
```bash
npm run dev
```

Now, all clinical operations:
- SOAP note generation (`generate_soap_note`)
- Patient voice intake turn processing (`/api/intakes/conversation` and `process_intake_turn`)
- Differential diagnoses and clinical decision support (`generate_clinical_insights`)
- Triage priority assessment (`generate_triage_priority`)

will execute **real inference** against your local machine's GPU/CPU with 0 mock data.
