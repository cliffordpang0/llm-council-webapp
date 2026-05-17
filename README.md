# LLM Council

A local AI webapp that sends every question to a **council of personas** — multiple instances of the same LLM running with distinct system prompts — and lets you compare their perspectives side by side. Built with [Ollama](https://ollama.com), [LangChain](https://python.langchain.com), FastAPI, and React.

---

## What It Does

Each persona is the same underlying model (`llama3.1:latest` by default) but shaped by a different system prompt:

| Persona | Personality | Focus |
|---|---|---|
| 🔵 **Analyst** | Logical, evidence-based | Data, structure, implications |
| 🔴 **Skeptic** | Critical, risk-aware | Flaws, assumptions, edge cases |
| 🟢 **Optimist** | Forward-thinking | Opportunities, upsides |
| 🟡 **Pragmatist** | Action-oriented | Concrete steps, real-world constraints |

---

## Council Modes

| Mode | How it works |
|---|---|
| ⚡ **Parallel + Vote** | All 4 personas answer simultaneously in side-by-side panels |
| 🔗 **Sequential Chain** | Each persona refines the previous one's answer |
| ⚖️ **Debate + Synthesis** | Personas debate (STANCE/REASONING/VERDICT), then a synthesizer concludes |
| 🧭 **Mixture of Agents** | A router LLM picks 1–3 relevant experts, runs only them, then aggregates |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Local LLM | [Ollama](https://ollama.com) |
| Orchestration | [LangChain](https://python.langchain.com) (`langchain-ollama`, `langchain-core`) |
| Backend | [FastAPI](https://fastapi.tiangolo.com) + SSE streaming |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + @tailwindcss/typography |
| Markdown | react-markdown |

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.com) running with at least one model: `ollama pull llama3.1`

---

## Setup

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## Run

```bash
# Terminal 1
cd backend && python -m uvicorn main:app --reload

# Terminal 2
cd frontend && npm run dev
```

Open **http://localhost:5173**

---

## Customising Personas

Edit `backend/council/models.py` to add, rename, or change persona system prompts. All modes pick up changes automatically from the `PERSONAS` list.

## Adding More Models

```bash
ollama pull mistral
ollama pull gemma3
```

The model dropdown auto-discovers installed models via `/api/models` on page load.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `uvicorn` not found | Use `python -m uvicorn main:app --reload` |
| Model dropdown shows junk | Ollama printed extra lines; parser requires `model:tag` format |
| Responses don't stream | Ensure backend is on port 8000 and Vite proxy is active |
| Ollama connection refused | Run `ollama serve` or open the Ollama desktop app |
