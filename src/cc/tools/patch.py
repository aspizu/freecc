from dataclasses import dataclass
from pathlib import Path

from ..chat import Chat, ChatError
from ..check import check_file
from ..tool import Tool


@dataclass
class SearchReplace:
    search: str
    replace: str


_SEARCH = "<<<<<<< SEARCH"
_SEP = "======="
_REPLACE = ">>>>>>> REPLACE"


def parse_search_replace(text: str) -> list[SearchReplace]:
    results = []
    lines = text.splitlines()
    i = 0

    while i < len(lines):
        if not lines[i].startswith(_SEARCH):
            i += 1
            continue

        i += 1
        search_lines = []
        while i < len(lines) and not lines[i].startswith(_SEP):
            search_lines.append(lines[i])
            i += 1

        if i >= len(lines):
            break  # malformed: no ======= found

        i += 1  # skip _SEP
        replace_lines = []
        while i < len(lines) and not lines[i].startswith(_REPLACE):
            replace_lines.append(lines[i])
            i += 1

        if i >= len(lines):
            break  # malformed: no >>>>>>> REPLACE found

        i += 1  # skip _REPLACE

        results.append(
            SearchReplace(
                search="\n".join(search_lines),
                replace="\n".join(replace_lines),
            )
        )

    return results


class Patch(Tool):
    """(path: string) -- Apply SEARCH/REPLACE patches to path. Patches must be in blocks of `<<<<<<< SEARCH`, `=======`, and `>>>>>>> REPLACE`."""

    path: str

    async def run(self) -> Chat | None:
        cwd = Path.cwd()
        path = Path(self.path).resolve()
        if not path.is_relative_to(cwd):
            raise ChatError("not allowed to write outside of current workspace")
        if not self.body:
            raise ChatError("body is empty")
        edits = parse_search_replace(self.body)
        if not edits:
            raise ChatError("no valid SEARCH/REPLACE blocks found in body")
        original = path.read_text()
        for edit in edits:
            if original.find(edit.search) == -1:
                raise ChatError("search string not found")
            original = original.replace(edit.search, edit.replace, count=1)
        path.write_text(original)
        return Chat(thought="Done.", code=await check_file(str(path)))
