import asyncio
import json
from typing import AsyncGenerator

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

from .models import PERSONAS, CouncilRequest

DEBATE_SUFFIX = (
    "\n\nStructure your response as:\n"
    "STANCE: [one sentence summary of your position]\n"
    "REASONING: [your detailed argument]\n"
    "VERDICT: [SUPPORT / OPPOSE / NEUTRAL]"
)

SYNTHESIS_SYSTEM = (
    "You are a neutral council moderator. You receive multiple expert opinions on a topic "
    "and synthesize them into a single balanced, insightful final answer. "
    "Acknowledge where experts agree and where they differ. Be concise and fair."
)


async def stream_debate(req: CouncilRequest) -> AsyncGenerator[str, None]:
    opinions: dict[str, str] = {}
    queues: list[asyncio.Queue] = [asyncio.Queue() for _ in PERSONAS]
    sentinel = object()

    async def run_debate(persona, q: asyncio.Queue):
        llm = ChatOllama(model=req.model, temperature=0.8)
        messages = [
            SystemMessage(content=persona.system_prompt),
            HumanMessage(content=req.question + DEBATE_SUFFIX),
        ]
        await q.put(_event("model_start", model=persona.name, color=persona.color))
        chunks: list[str] = []
        async for chunk in llm.astream(messages):
            if chunk.content:
                chunks.append(chunk.content)
                await q.put(_event("chunk", model=persona.name, content=chunk.content))
        opinions[persona.name] = "".join(chunks)
        await q.put(_event("model_done", model=persona.name))
        await q.put(sentinel)

    tasks = [asyncio.create_task(run_debate(p, q)) for p, q in zip(PERSONAS, queues)]

    active = set(range(len(PERSONAS)))
    while active:
        for i in list(active):
            try:
                item = queues[i].get_nowait()
                if item is sentinel:
                    active.discard(i)
                else:
                    yield item
            except asyncio.QueueEmpty:
                pass
        if active:
            await asyncio.sleep(0.01)

    await asyncio.gather(*tasks, return_exceptions=True)

    debate_summary = "\n\n".join(f"**{name}**:\n{opinion}" for name, opinion in opinions.items())
    synthesis_prompt = (
        f"The council debated:\n\n{req.question}\n\nPositions:\n\n{debate_summary}\n\nSynthesize a final balanced answer."
    )

    yield _event("synthesis_start", model="Synthesis")
    synth_llm = ChatOllama(model=req.model, temperature=0.4)
    async for chunk in synth_llm.astream([
        SystemMessage(content=SYNTHESIS_SYSTEM),
        HumanMessage(content=synthesis_prompt),
    ]):
        if chunk.content:
            yield _event("chunk", model="Synthesis", content=chunk.content)
    yield _event("model_done", model="Synthesis")
    yield _event("done")


def _event(event: str, **kwargs) -> str:
    return f"data: {json.dumps({'event': event, **kwargs})}\n\n"
