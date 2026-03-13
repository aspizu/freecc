from pathlib import Path

from ..chat import Chat, ChatError
from ..tool import Tool


class Write(Tool):
    """(path: string) -- Overwrite the entire contents of path with body. Prefer `$freecc.patch` instead."""

    path: str

    async def run(self) -> Chat | None:
        cwd = Path.cwd()
        path = Path(self.path).resolve()
        if not path.is_relative_to(cwd):
            raise ChatError("not allowed to write outside of current workspace")
        path.write_text(self.body or "")
        return Chat(thought="Done.")
