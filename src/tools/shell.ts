import { $ } from "bun";
import { code } from "../prompt";
import type { Tool } from "../tool";

export const shell: Tool = {
  async usage() {
    return "$toolbox.shell() Executes the bash command in body and return stdout+stderr.";
  },

  async execute(args: string[], body: string) {
    const out = await $`bash -c ${body} 2>&1`.nothrow().text();
    const lines = out.split("\n");
    if (lines.length > 100) {
      return code(
        "I got the following output from the OS (last 100 lines):",
        lines.slice(-100).join("\n"),
      );
    }
    return code("I got the following output from the OS:", out);
  },
};
