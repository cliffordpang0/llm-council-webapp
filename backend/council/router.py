import asyncio
import json
import re
from typing import AsyncGenerator

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

from .models import PERSONAS, CouncilRequest

ROUTER_SYSTEM = """You are a routing agent. Given a user question, decide which expert perspectives are most relevant.
Choose 1-3 from: Analyst, Skeptic, Optimist, Pragmatist.

Respond with ONLY a JSON array of names, e.g.: ["Analyst", "Pragmatist"]
No explanation. No markdown. Just the JSON array."""

AGGREGATOR_SYSTEM = (
    "You are a concise aggregator. Combine the following expert responses into one clear, "
    "unified answer. Preserve the best insights from each expert. Be direct."
)


async def stream_router(req: CouncilRequest) -> AsyncGenerator[str, None]:
    yield _event("router_start", model="Router")
    router_llm = ChatOllama(model=req.model, temperature=0.2)
    router_response = await router_llm.ainvoke([
        SystemMessage(content=ROUTER_SYSTEM),
        HumanMessage(content=req.question),
    ])
    raw = router_response.content.strip()

    match = re.search(r"\[.*?\]", raw, re.DOTALL)
    selected_names: list[str] = []
    if match:
        try:
            selected_names = json.loads(match.group())
        except json.JSONDecodeError:
            pass
    if not selected_names:
        selected_names = ["Analyst", "Pragmatist"]

    persona_map = {p.name: p for p in PERSONAS}
    selected_personas = [persona_map[n] for n in selected_names if n in persona_map] or PERSONAS[:2]

    yield _event("router_done", model="Router", selected=[p.name for p in selected_personas])

    opinions: dict[str, str] = {}
    queues: list[asyncio.Queue] = [asyncio.Queue() for _ in selected_personas]
    sentinel = object()

    async def run_persona(persona, q: asyncio.Queue):
        llm = ChatOllama(model=req.model, temperature=0.7)
        await q.put(_event("model_start", model=persona.name, color=persona.color))
        chunks: list[str] = []
        async for chunk in llm.astream([
            SystemMessage(content=persona.system_prompt),
            HumanMessage(content=req.question),
        ]):
            if chunk.content:
                chunks.append(chunk.content)
                await q.put(_event("chunk", model=persona.name, content=chunk.content))
        opinions[persona.name] = "".join(chunks)
        await q.put(_event("model_done", model=persona.name))
        await q.put(sentinel)

    tasks = [asyncio.create_task(run_persona(p, q)) for p, q in zip(selected_personas, queues)]

    active = set(range(len(selected_personas)))
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

    combined = "\n\n".join(f"{name}:\n{opinion}" for name, opinion in opinions.items())
    yield _event("synthesis_start", model="Aggregator")
    agg_llm = ChatOllama(model=req.model, temperature=0.4)
    async for chunk in agg_llm.astream([
        SystemMessage(content=AGGREGATOR_SYSTEM),
        HumanMessage(content=f"Question: {req.question}\n\nExpert responses:\n\n{combined}\n\nProvide a unified final answer."),
    ]):
        if chunk.content:
            yield _event("chunk", model="Aggregator", content=chunk.content)
    yield _event("model_done", model="Aggregator")
    yield _event("done")


def _event(event: str, **kwargs) -> str:
    return f"data: {json.dumps({'event': event, **kwargs})}\n\n"
