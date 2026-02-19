# Self-Hosted LLM Plan — ResumeMate AI

## Goal
Replace Claude Sonnet API ($0.14/generation, 60-150s) with a fine-tuned open-source model in Docker containers on cloud GPUs (~$0.01/generation, 15-30s).

## Architecture Overview

```
Current:
  User → /api/generate-pro → llm-gateway.ts → Claude Sonnet API → response

Target:
  User → /api/generate-pro → llm-gateway.ts → Your vLLM Container → response
                                            ↘ Claude (fallback on Zod failure)
```

Everything stays the same except the LLM call. The circuit breaker, Zod validation, quality gate, score booster, and merge logic are all unchanged.

---

## Step 1: Generate Training Data ✅ (DONE)

**Script:** `scripts/generate-training-data.ts`

Runs resume+JD pairs through the production Claude pipeline and saves input/output pairs as JSONL for fine-tuning.

**How to run:**
```bash
npx tsx scripts/generate-training-data.ts
```

**What it does:**
- Loads pairs from `scripts/training-data/inputs/*.json` (custom) + 6 built-in synthetic pairs
- Calls Claude Sonnet with the exact production system prompt + tool schema
- Saves to `scripts/training-data/training-data.jsonl` (standard fine-tuning format)
- Tracks progress — resumes from where it left off if interrupted
- Logs cost per call and total

**Output format (JSONL):** Each line is a JSON object with:
```json
{
  "id": "uuid",
  "domain": "software-engineer",
  "messages": [
    {"role": "system", "content": "You are ResumeMate AI..."},
    {"role": "user", "content": "Analyze this resume...RESUME TEXT:...JOB DESCRIPTION:..."},
    {"role": "assistant", "content": "{...ProOutput JSON...}"}
  ],
  "metadata": { "input_tokens": 3500, "output_tokens": 5000, "model": "claude-sonnet-4-5-20250929" }
}
```

**Scaling up:**
- Current: 7 test pairs (~$1.00)
- Target: 200-500 pairs across diverse professions ($28-70)
- Add more pairs to `scripts/training-data/inputs/` as JSON files:
  ```json
  {
    "domain": "accountant",
    "resumeText": "full resume text here",
    "jobDescriptionText": "full JD text here"
  }
  ```
- Re-run script — it skips already-completed pairs
- Aim for diversity: engineering, sales, marketing, healthcare, finance, education, trades, legal, etc.

---

## Step 2: Fine-Tune the Model

**Recommended model:** Qwen 2.5 14B (best structured JSON output in this size class)
**Alternative:** Llama 3.1 8B (faster, fits easily on 16GB Mac, slightly lower quality)

### Option A: Fine-tune on Mac (16GB) — for experimentation

Install MLX (Apple Silicon optimized):
```bash
pip install mlx-lm
```

Convert training data to MLX format:
```bash
# Script needed: scripts/convert-to-mlx.py
# Converts JSONL → MLX chat format
python scripts/convert-to-mlx.py
```

Fine-tune with LoRA:
```bash
mlx_lm.lora \
  --model mlx-community/Qwen2.5-14B-Instruct-4bit \
  --data scripts/training-data/mlx-format \
  --train \
  --batch-size 1 \
  --lora-layers 16 \
  --iters 500 \
  --learning-rate 1e-5
```

This takes 2-4 hours on M-series Mac with 16GB. Output is LoRA adapter weights (~100MB).

### Option B: Fine-tune on cloud GPU (recommended for quality)

Use RunPod or Modal for a single A100 GPU session:

```bash
# Using Unsloth (2x faster fine-tuning, less memory)
pip install unsloth

# Script needed: scripts/finetune-unsloth.py
python scripts/finetune-unsloth.py \
  --model unsloth/Qwen2.5-14B-Instruct \
  --data scripts/training-data/training-data.jsonl \
  --output models/resumemate-14b \
  --epochs 3 \
  --batch-size 2 \
  --learning-rate 2e-5 \
  --lora-rank 64
```

Cost: ~$2-5 on RunPod (A100 for 1-2 hours).

### What the fine-tuning teaches the model:
- Given a resume + JD + system prompt → produce exact ProOutput JSON structure
- Follow all the structural requirements (bulletsByRole, education, skills, coverLetter, etc.)
- Quality rules (no filler, no repeated verbs, metric inference, etc.)
- Domain-appropriate language across different professions

---

## Step 3: Test Quality Locally

### Run on Mac via Ollama

```bash
# Install Ollama
brew install ollama

# Create a Modelfile pointing to your fine-tuned weights
# (after merging LoRA adapters into base model)
ollama create resumemate -f Modelfile

# Test
ollama run resumemate "Analyze this resume..."
```

### Automated quality testing

Script needed: `scripts/test-model-quality.ts`

What it should do:
1. Load 10-20 test pairs (held out from training)
2. Run each through the local model
3. Validate output with Zod (ProOutputSchema) — does it parse?
4. Compare key metrics vs Claude output:
   - Number of roles extracted (should match)
   - Number of bullets per role (should match or exceed original)
   - Keyword checklist completeness
   - Cover letter paragraph count (exactly 4)
   - Radar scores (within ±10 of Claude)
5. Report pass/fail rate

**Target:** 90%+ Zod validation pass rate before proceeding to deployment.

---

## Step 4: Containerize with vLLM

vLLM is the gold standard for LLM serving — batches requests, paged attention, OpenAI-compatible API.

### Dockerfile

```dockerfile
FROM vllm/vllm-openai:latest

# Copy your fine-tuned model (merged LoRA + base)
COPY ./models/resumemate-14b /model

# vLLM serves an OpenAI-compatible API on port 8000
CMD ["--model", "/model", \
     "--quantization", "awq", \
     "--max-model-len", "16384", \
     "--port", "8000"]
```

### Build and test locally (requires NVIDIA GPU)

```bash
docker build -t resumemate-llm .
docker run --gpus all -p 8000:8000 resumemate-llm
```

### Test the API

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "resumemate-14b",
    "messages": [
      {"role": "system", "content": "You are ResumeMate AI..."},
      {"role": "user", "content": "Analyze this resume..."}
    ],
    "max_tokens": 16384
  }'
```

---

## Step 5: Deploy to Cloud

### Option A: RunPod Serverless (recommended — scales to zero)

```bash
# Push Docker image to Docker Hub
docker tag resumemate-llm yourdockerhub/resumemate-llm:latest
docker push yourdockerhub/resumemate-llm:latest

# Create RunPod serverless endpoint via their dashboard:
# - Select your Docker image
# - GPU: A10G (24GB) — fits 14B Q4 comfortably
# - Min workers: 0 (scales to zero)
# - Max workers: 3 (handles 3 concurrent users)
# - Idle timeout: 5 min
```

Cost: ~$0.36/hr per active worker. At ~30s per generation = $0.003/generation.
With scale-to-zero, you only pay when users are generating.

### Option B: GCP Cloud Run GPU

```bash
# Push to Google Artifact Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT/resumemate-llm

# Deploy
gcloud run deploy resumemate-llm \
  --image gcr.io/YOUR_PROJECT/resumemate-llm \
  --gpu 1 --gpu-type nvidia-l4 \
  --memory 16Gi \
  --min-instances 0 \
  --max-instances 3
```

### Option C: Vast.ai (cheapest, less reliable)

Spot GPU instances at $0.15-0.30/hr. Good for testing, less reliable for production.

---

## Step 6: Update llm-gateway.ts

The key change is minimal. In `src/lib/llm.ts`, the `callClaude` function gets a sibling `callSelfHosted`:

```typescript
async function callSelfHosted(
  resumeText: string,
  jobDescriptionText: string,
): Promise<ProOutput> {
  const endpoint = process.env.SELF_HOSTED_LLM_URL; // e.g. "https://your-runpod-endpoint/v1"

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "resumemate-14b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 16384,
    }),
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

In `llm-gateway.ts`, update the call chain:
```
1. Try self-hosted model (fast, cheap)
2. Zod validate
3. If Zod fails → retry self-hosted once
4. If still fails → fallback to Claude Sonnet
5. If Claude fails → fallback to deterministic mock
```

**Environment variables to add:**
```
SELF_HOSTED_LLM_URL=https://your-runpod-endpoint.com/v1
LLM_PROVIDER=self-hosted   # or "claude" to use current setup
```

---

## Cost Comparison

| | Claude (current) | Self-hosted 14B |
|--|--|--|
| Cost per generation | $0.14 | $0.003-0.01 |
| Speed | 60-150s | 15-30s |
| Monthly (100 gens) | $14 | $0.30-1.00 |
| Monthly (1000 gens) | $140 | $3-10 |
| Infrastructure | Zero | Docker + RunPod |
| Quality | 10/10 | 8.5-9.5/10 (fine-tuned) |
| Fallback | N/A | Claude on Zod failure |

## Timeline

1. **Training data** — 7 pairs done (~$1). Scale to 200-500 by collecting real resumes across professions.
2. **Fine-tuning** — 2-4 hours on Mac (experiment) or 1-2 hours on cloud GPU ($2-5).
3. **Quality testing** — 1-2 hours to validate outputs.
4. **Containerize** — 1-2 hours to build Docker image.
5. **Deploy** — 1 hour to push to RunPod/GCP and update env vars.

## Files

```
scripts/
  generate-training-data.ts     ← Step 1: generates training pairs via Claude
  training-data/
    inputs/                     ← Drop resume+JD JSON files here
      example.json              ← Sample input format
    training-data.jsonl         ← Generated training data (JSONL)
    .progress.json              ← Tracks completed pairs
  SELF_HOSTED_LLM_PLAN.md      ← This file
```
