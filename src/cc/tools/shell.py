from asyncio.subprocess import PIPE, create_subprocess_exec

from ..chat import Chat, ChatError
from ..tool import Tool


class Shell(Tool):
    """() -- Execute body as a bash script and return stdout+stderr."""

    async def run(self) -> Chat | None:
        if not self.body:
            raise ChatError("body is empty")
        p = await create_subprocess_exec("bash", "-c", self.body, stdout=PIPE)
        stdout, _ = await p.communicate()
        return Chat(
            thought="I got the following output from the terminal:",
            code=stdout.decode(),
        )
