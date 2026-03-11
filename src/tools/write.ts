import type { Tool } from "../tool";

export const write: Tool = {
  async usage() {
    return "$toolbox.write(path: string) Replace the entire contents of file. Prefer $toolbox.patch() over this.";
  },

  async execute(args: any[], body: string) {
    await Bun.write(args[0], body);
    return "Done.";
  },
};
