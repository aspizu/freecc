# FreeCC

**FreeCC** turns Claude Web into Claude Code — giving Claude full access to your filesystem and shell, directly from the browser.

## How it works

FreeCC consists of two parts:

- **Userscript** (`freecc.user.js`): Runs in your browser via a userscript manager (e.g. Tampermonkey). It intercepts Claude's chat interface and routes Claude's tool calls to the local server.
- **Server** (`src/`): A local [Elysia](https://elysiajs.com/) server that receives tool calls from the userscript and executes them on your machine.

When Claude responds with a `$toolbox.*()` call, the userscript forwards it to the server, which executes it and returns the result — all transparently within the Claude Web UI.

## Available Tools

| Tool | Description |
|------|-------------|
| `$toolbox.shell()` | Execute a bash command |
| `$toolbox.read(path, skip?, limit?)` | Read a file from the current directory |
| `$toolbox.write(path)` | Overwrite a file with new contents |
| `$toolbox.patch(path)` | Apply `SEARCH/REPLACE` patches to a file |
| `$toolbox.glob(pattern)` | List files matching a glob pattern |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/)
- A userscript manager (e.g. [Tampermonkey](https://www.tampermonkey.net/))

### Installation

1. **Install dependencies and build:**