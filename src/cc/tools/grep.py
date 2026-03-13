from asyncio.subprocess import PIPE, create_subprocess_exec
from pathlib import Path
from shutil import which

from ..chat import Chat, ChatError
from ..tool import Tool

rg_ = which("rg") or which("ripgrep")
if rg_ is None:
    raise RuntimeError("the `ripgrep` command is required for the grep tool.")
rg = rg_
fd_ = which("fd") or which("fdfind")
if fd_ is None:
    raise RuntimeError("the `fd` command is required for the grep tool.")
fd = fd_


class Grep(Tool):
    """(pattern: string, glob?: string) -- Search for regex pattern in files. glob must be relative to current workspace."""

    pattern: str
    glob: str | None = None

    async def run(self) -> Chat | None:
        glob = Path.cwd().joinpath(self.glob or "**/*")
        if self.glob and (
            self.glob.startswith("/")
            or self.glob.startswith("./")
            or self.glob.startswith("../")
        ):
            raise ChatError("glob must be relative to current workspace")
        p = await create_subprocess_exec(
            fd,
            "-E",
            ".git",
            "-p",
            "-g",
            glob,
            "-X",
            rg,
            self.pattern,
            stdout=PIPE,
        )
        stdout, _ = await p.communicate()
        return Chat(
            thought="I got the following output from the terminal:",
            code=stdout.decode(),
        )
