from pathlib import Path

from ..chat import Chat
from ..tool import Tool


class Glob(Tool):
    """(glob: string) -- Search for files. glob must be relative to current workspace."""

    glob: str

    async def run(self) -> Chat | None:
        cwd = Path.cwd()
        xs = [*cwd.glob(self.glob)]
        xs.sort()
        return Chat(
            thought="I got the following output from the terminal:",
            code="\n".join(map(str, xs)),
        )
