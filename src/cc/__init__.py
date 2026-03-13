import uvicorn
from fastapi import FastAPI, Request

from .agent import agent
from .chat import ChatError

app = FastAPI()


@app.post("/receive-message")
async def receive_message(req: Request) -> str | None:
    body = await req.body()
    try:
        return await agent(body.decode())
    except ChatError as err:
        return str(err)


@app.get("/system-prompt")
async def system_prompt() -> str:
    return "You are a helpful assistant."


def main() -> int:
    uvicorn.run(app, host="localhost", port=3000)
    return 0
