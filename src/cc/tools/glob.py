from asyncio.subprocess import PIPE, create_subprocess_exec
from pathlib import Path
from shutil import which

from ..chat import Chat, ChatError
from ..tool import Tool

fd_ = which("fd") or which("fdfind")
if fd_ is None:
    raise RuntimeError("the `fd` command is required for the glob tool.")
fd = fd_


class Glob(Tool):
    """(glob: string) -- Search for files. glob must be relative to current workspace."""

    glob: str

    async def run(self) -> Chat | None:
        glob = Path.cwd().joinpath(self.glob or "**/*")
        if (
            self.glob.startswith("/")
            or self.glob.startswith("./")
            or self.glob.startswith("../")
        ):
            raise ChatError("glob must be relative to current workspace")
        p = await create_subprocess_exec(
            fd, "-E", ".git", "-p", "-g", glob, stdout=PIPE
        )
        stdout, _ = await p.communicate()
        return Chat(
            thought="I got the following output from the terminal:",
            code=stdout.decode(),
        )
