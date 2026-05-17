import json
from typing import AsyncGenerator

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

from .models import PERSONAS, CouncilRequest


async def stream_sequential(req: CouncilRequest) -> AsyncGenerator[str, None]:
    llm = ChatOllama(model=req.model, temperature=0.7)
    previous_answer = ""

    for i, persona in enumerate(PERSONAS):
        yield _event("model_start", model=persona.name, color=persona.color)

        if i == 0:
            messages = [
                SystemMessage(content=persona.system_prompt),
                HumanMessage(content=req.question),
            ]
        else:
            refine_prompt = (
                f"The previous response was:\n\n{previous_answer}\n\n"
                f"Now, from your perspective as described below, critique and improve upon it "
                f"in response to the original question: {req.question}"
            )
            messages = [
                SystemMessage(content=persona.system_prompt),
                HumanMessage(content=refine_prompt),
            ]

        chunks: list[str] = []
        async for chunk in llm.astream(messages):
            if chunk.content:
                chunks.append(chunk.content)
                yield _event("chunk", model=persona.name, content=chunk.content)

        previous_answer = "".join(chunks)
        yield _event("model_done", model=persona.name)

    yield _event("done")


def _event(event: str, **kwargs) -> str:
    return f"data: {json.dumps({'event': event, **kwargs})}\n\n"
