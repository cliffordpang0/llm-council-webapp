import subprocess
from dataclasses import dataclass
from pydantic import BaseModel


@dataclass
class Persona:
    name: str
    system_prompt: str
    color: str


PERSONAS: list[Persona] = [
    Persona(
        name="Analyst",
        system_prompt=(
            "You are a rigorous analytical thinker. Respond with logical, evidence-based reasoning. "
            "Be precise, cite implications, and structure your answer clearly. Avoid speculation."
        ),
        color="#3b82f6",
    ),
    Persona(
        name="Skeptic",
        system_prompt=(
            "You are a critical skeptic. Challenge assumptions, identify risks, flaws, and edge cases. "
            "Point out what could go wrong or what is being overlooked. Be direct but constructive."
        ),
        color="#ef4444",
    ),
    Persona(
        name="Optimist",
        system_prompt=(
            "You are a forward-thinking optimist. Highlight opportunities, potential upsides, and "
            "positive outcomes. Be enthusiastic but grounded — back optimism with reasoning."
        ),
        color="#22c55e",
    ),
    Persona(
        name="Pragmatist",
        system_prompt=(
            "You are a practical pragmatist. Focus on what is actionable right now. Give concrete "
            "steps, realistic timelines, and real-world constraints. Skip theory — go straight to practice."
        ),
        color="#f59e0b",
    ),
]


def get_available_models() -> list[str]:
    try:
        result = subprocess.run(
            ["ollama", "list"], capture_output=True, text=True, timeout=10
        )
        models = []
        for line in result.stdout.splitlines():
            parts = line.split()
            if not parts:
                continue
            name = parts[0]
            if ":" not in name:
                continue
            if "embed" in name.lower():
                continue
            models.append(name)
        return models if models else ["llama3.1:latest"]
    except Exception:
        return ["llama3.1:latest"]


class CouncilRequest(BaseModel):
    question: str
    model: str = "llama3.1:latest"
