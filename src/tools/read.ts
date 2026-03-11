import { file } from "../prompt";
import type { Tool } from "../tool";

export const read: Tool = {
  async usage() {
    return "Read the contents of the path in body, optional parameters: (skip: number, limit: number)";
  },

  async execute(args: any[], body: string) {
    const text = await Bun.file(body.trim()).text();
    const lines = text.split("\n");
    const skip = args[0] ?? 0;
    const limit = args[1] ?? 0;

    return file(
      "I got the following output from the OS:",
      lines.slice(skip).slice(-limit),
    );
  },
};
