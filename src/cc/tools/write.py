from pathlib import Path

from ..chat import Chat, ChatError
from ..tool import Tool


class Write(Tool):
    """(path: string, mkdir: boolean = false) -- Overwrite the entire contents of path with body. Prefer `$freecc.patch` instead."""

    path: str
    mkdir: bool = False

    async def run(self) -> Chat | None:
        cwd = Path.cwd()
        path = Path(self.path).resolve()
        if not path.is_relative_to(cwd):
            raise ChatError("not allowed to write outside of current workspace")
        if self.mkdir:
            path.parent.mkdir(parents=True, exist_ok=True)
        try:
            path.write_text(self.body or "")
        except FileNotFoundError:
            raise ChatError("file not found")
        except PermissionError:
            raise ChatError("permission denied")
        return Chat(thought="Done.")
