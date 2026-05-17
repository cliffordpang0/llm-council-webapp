from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from council.models import CouncilRequest, get_available_models
from council.parallel import stream_parallel
from council.sequential import stream_sequential
from council.debate import stream_debate
from council.router import stream_router

app = FastAPI(title="LLM Council")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/models")
def list_models():
    return {"models": get_available_models()}


@app.post("/api/council/parallel")
async def council_parallel(req: CouncilRequest):
    return StreamingResponse(stream_parallel(req), media_type="text/event-stream")


@app.post("/api/council/sequential")
async def council_sequential(req: CouncilRequest):
    return StreamingResponse(stream_sequential(req), media_type="text/event-stream")


@app.post("/api/council/debate")
async def council_debate(req: CouncilRequest):
    return StreamingResponse(stream_debate(req), media_type="text/event-stream")


@app.post("/api/council/router")
async def council_router(req: CouncilRequest):
    return StreamingResponse(stream_router(req), media_type="text/event-stream")
