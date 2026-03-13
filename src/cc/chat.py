from dataclasses import dataclass


@dataclass
class Chat:
    thought: str | None = None
    code: str | None = None

    def __str__(self) -> str:
        out = ""
        if self.thought:
            out += f"{self.thought}\n"
        if self.code:
            out += f"```\n{self.code}```\n"
        return out


class ChatError(Chat, Exception):
    def __init__(self, message: str) -> None:
        self.thought = "I got the following error:"
        self.code = message
