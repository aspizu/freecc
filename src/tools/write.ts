import type { Tool } from "../tool";

export const write: Tool = {
  args: ["path"],

  async usage() {
    return "$toolbox.write(path: string) Replace the entire contents of file. Prefer $toolbox.patch() over this.";
  },

  async execute({ path }, body: string) {
    await Bun.write(path, body);
    return "Done.";
  },
};
