from pathlib import Path

from ..chat import Chat, ChatError
from ..tool import Tool


class Read(Tool):
    """(path: string, start: number = 1, limit: number = 200) -- Read a file."""

    path: str
    start: int = 1
    limit: int = 200

    async def run(self) -> Chat | None:
        if not self.path:
            raise ChatError("path is empty")
        cwd = Path.cwd()
        path = Path(self.path).resolve()
        if not path.is_relative_to(cwd):
            raise ChatError("not allowed to read outside of current workspace")
        try:
            lines = path.read_text().splitlines()
        except FileNotFoundError:
            raise ChatError("file not found")
        except PermissionError:
            raise ChatError("permission denied")

        start_idx = self.start - 1
        end_idx = start_idx + self.limit
        return Chat(
            thought=f"Lines {self.start}..{min(end_idx, len(lines))} of {len(lines)}:",
            code="\n".join(lines[start_idx:end_idx]),
        )
