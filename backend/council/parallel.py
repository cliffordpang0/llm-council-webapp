import asyncio
import json
from typing import AsyncGenerator

from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage

from .models import PERSONAS, CouncilRequest


async def stream_parallel(req: CouncilRequest) -> AsyncGenerator[str, None]:
    async def run_persona(persona, question: str) -> AsyncGenerator[str, None]:
        llm = ChatOllama(model=req.model, temperature=0.7)
        messages = [
            SystemMessage(content=persona.system_prompt),
            HumanMessage(content=question),
        ]
        yield _event("model_start", model=persona.name, color=persona.color)
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield _event("chunk", model=persona.name, content=chunk.content)
        yield _event("model_done", model=persona.name)

    queues: list[asyncio.Queue] = [asyncio.Queue() for _ in PERSONAS]
    sentinel = object()

    async def feed_queue(persona, q: asyncio.Queue):
        async for event in run_persona(persona, req.question):
            await q.put(event)
        await q.put(sentinel)

    tasks = [asyncio.create_task(feed_queue(p, q)) for p, q in zip(PERSONAS, queues)]

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
    yield _event("done")


def _event(event: str, **kwargs) -> str:
    return f"data: {json.dumps({'event': event, **kwargs})}\n\n"
