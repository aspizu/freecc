import { $ } from "bun";
import { code } from "../prompt";
import type { Tool } from "../tool";

export const glob: Tool = {
  args: ["pattern"],

  async usage() {
    return "$toolbox.glob(pattern: string) List files matching a glob pattern relative to the current directory.";
  },

  async execute({ pattern }, _body: string) {
    const out =
      await $`bash -c ${`find . -path './.git' -prune -o -name '${pattern}' -print`} 2>&1`
        .nothrow()
        .text();
    return code(
      "I got the following output from the OS:",
      out.trim() || "(no matches)",
    );
  },
};
