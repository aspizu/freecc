import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from .agent import agent
from .chat import ChatError
from .prompt import SYSTEM_PROMPT

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,  # ty:ignore[invalid-argument-type]
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/receive-message")
async def receive_message(req: Request) -> str | None:
    body = await req.body()
    try:
        return await agent(body.decode())
    except ChatError as err:
        return str(err)


@app.get("/system-prompt")
async def system_prompt() -> str:
    return SYSTEM_PROMPT


def main() -> int:
    uvicorn.run(app, host="localhost", port=3000)
    return 0
