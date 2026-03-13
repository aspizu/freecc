from .chat import ChatError
from .parser import parse_message
from .tools import tools


async def agent(message: str) -> str | None:
    parsed = parse_message(message)
    if parsed.tool is None:
        return None
    tool = tools.get(parsed.tool)
    if tool is None:
        raise ChatError(f"Unknown tool: {parsed.tool}")
    out = await tool.new(parsed.args, parsed.body).run()
    if out is None:
        return None
    return str(out)
