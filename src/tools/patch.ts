import type { Tool } from "../tool";

export async function applyPatch(patch: string) {
  const lines = patch.split("\n");
  const path = lines[0];
  if (!path) {
    throw new Error("The first line of diff must be the path.");
  }

  // Parse all SEARCH/REPLACE blocks
  type Block = { find: string[]; replace: string[] };
  const blocks: Block[] = [];
  let i = 1;

  while (i < lines.length) {
    if (lines[i] !== "<<<<<<< SEARCH") {
      throw new Error(
        `Expected <<<<<<< SEARCH at line ${i + 1}, got: ${lines[i]}`,
      );
    }

    const mid = lines.indexOf("=======", i);
    const end = lines.indexOf(">>>>>>> REPLACE", i);

    if (mid === -1)
      throw new Error(`Block starting at line ${i + 1} is missing =======`);
    if (end === -1)
      throw new Error(
        `Block starting at line ${i + 1} is missing >>>>>>> REPLACE`,
      );
    if (mid > end)
      throw new Error(
        `======= appears after >>>>>>> REPLACE in block at line ${i + 1}`,
      );

    const find = lines.slice(i + 1, mid);
    const replace = lines.slice(mid + 1, end);

    if (find.length < 1)
      throw new Error(`Find section is empty in block at line ${i + 1}`);

    blocks.push({ find, replace });
    i = end + 1;
  }

  if (blocks.length === 0) {
    throw new Error("No SEARCH/REPLACE blocks found in diff.");
  }

  // Apply all blocks sequentially to the file lines
  let file = (await Bun.file(path).text()).split("\n");

  for (const { find, replace } of blocks) {
    const out: string[] = [];
    let matched = false;
    for (let i = 0; i < file.length; i++) {
      if (
        !matched &&
        file.slice(i, i + find.length).every((line, j) => line === find[j])
      ) {
        out.push(...replace);
        i += find.length - 1;
        matched = true;
      } else {
        out.push(file[i]);
      }
    }
    if (!matched) {
      throw new Error(
        `Could not find search block in file:\n${find.join("\n")}`,
      );
    }
    file = out;
  }

  await Bun.write(path, file.join("\n"));
}

export const patch: Tool = {
  async usage() {
    return "$toolbox.patch() Apply find/replace patches to a file. First line is the path, followed by one or more blocks of: `<<<<<<< SEARCH`, lines to find, `=======`, lines to replace with, `>>>>>>> REPLACE`";
  },

  async execute(args: any[], body: string) {
    await applyPatch(`${args[0]}\n${body}`);
    return "Done.";
  },
};
