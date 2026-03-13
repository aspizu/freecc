from dataclasses import dataclass, field
from typing import Any

import json5

from .chat import ChatError


@dataclass
class Message:
    thought: str | None = None
    tool: str | None = None
    args: dict[str, Any] | list[Any] = field(default_factory=dict)
    body: str | None = None


def parse_message(message: str) -> Message:
    lines = message.splitlines()
    i = next((i for i, line in enumerate(lines) if line == "```"), -1)
    j = next(
        (len(lines) - 1 - i for i, line in enumerate(reversed(lines)) if line == "```"),
        -1,
    )
    if i == -1 or j == -1 or j - i <= 1:
        return Message(message or None)
    thought = "\n".join(lines[:i]) or None
    toolcall = lines[i + 1]
    body = "\n".join(lines[i + 2 : j])
    if not toolcall.startswith("$freecc."):
        raise ChatError("commands must begin with `$freecc.`")
    toolcall = toolcall.removeprefix("$freecc.")
    x = toolcall.find("(")
    y = toolcall.rfind(")")
    if x == -1 or y == -1 or y < x:
        raise ChatError("command must have parenthesis")
    tool = toolcall[:x]
    if tool == "":
        raise ChatError("tool name is empty")
    try:
        args = json5.loads("{" + toolcall[x + 1 : y] + "}")
    except json5.JSON5DecodeError:
        try:
            args = json5.loads("[" + toolcall[x + 1 : y] + "]")
        except json5.JSON5DecodeError as e:
            raise ChatError(f"could not parse arguments: {e}")
    return Message(thought, tool, args, body)
