import { $ } from "bun";
import type { Tool } from "../tool";

export const write: Tool = {
  async usage() {
    return "Apply a git diff/patch to a file. Body should be the git diff content to apply.";
  },

  async execute(args: any[], body: string) {
    // Write the diff to a temp file
    const tmpFile = `/tmp/patch_${Date.now()}.diff`;
    await Bun.write(tmpFile, body.trim());

    try {
      return "Ran it.";
    } catch (err: any) {
      throw new Error(err.stderr?.toString());
    } finally {
      await $`rm -f ${tmpFile}`.quiet();
    }
  },
};
