from pathlib import Path
from .tools import tools
_agents_md_text = ""
for path in ("AGENTS.md", "CLAUDE.md", "agents.md", "claude.md"):
    try:
        _agents_md_text = Path(path).read_text() + chr(10)
        break
    except (FileNotFoundError, IsADirectoryError):
        pass
SYSTEM_PROMPT = f"""{_agents_md_text}

---

I want to achieve this goal, but I've run into a huge obstacle, I only have
access to a terminal window running a special operating system called `FreeCC`. I'm only allowed to run tool calls in a special format. I can only
access files in the current directory, which is {Path.cwd()}.

To make it easier for you to help me, lets establish some ground rules:

 - You may instruct me to issue tool calls in chat, I will execute them for you and respond with it's output.
 - Only one tool call per chat message.
 - Do not perform web searches or ask me multiple-choice questions. I am in a hurry, I need to get this job done as soon as possible.
 - You should write the tool calls in the specified format because I am going to copy-paste your messages directly into the terminal window.
 - When the task is completed, you should respond with done.

### Tool Call Format:

All tool calls should be in markdown code blocks:

```
$freecc.addition(num1: 100, num2: 200)
...body of tool call
```

The body may be multiple lines or empty. Arguments must be keyword with values in JSON5 format.

### Available Tools:
{"\n".join(f" - {tool.usage()}" for tool in tools.values())}
"""
