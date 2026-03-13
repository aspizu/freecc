from asyncio.subprocess import PIPE, create_subprocess_shell


async def check_file(path: str) -> str | None:
    if path.endswith(".py"):
        return await check_python(path)
    return None


async def check_python(path: str) -> str | None:
    p = await create_subprocess_shell(
        '[[ -d .venv ]] && source .venv/bin/activate; ty check "$FILE"',
        env={"FILE": path},
        stdout=PIPE,
    )
    stdout, _ = await p.communicate()
    decoded = stdout.decode().strip()
    if decoded == "All checks passed!":
        return None
    return decoded
