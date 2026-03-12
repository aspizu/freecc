import { code } from "../prompt";
import type { Tool } from "../tool";

export const read: Tool = {
  args: ["path", "skip", "limit"],

  async usage() {
    return "$toolbox.read(path: string, skip?: number = 0, limit?: number = 500) Read the contents of a file.";
  },

  async execute({ path, skip = 0, limit = 500 }, body: string) {
    const text = await Bun.file(path).text();
    const lines = text.split("\n");
    const sliced = lines.slice(skip, skip + limit);
    const remaining = lines.length - skip - limit;

    return code(
      "I got the following output from the OS:",
      sliced.join("\n") + (remaining > 0 ? `\n...${remaining} lines more` : ""),
    );
  },
};
