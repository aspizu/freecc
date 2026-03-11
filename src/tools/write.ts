import { $ } from "bun";
import type { Tool } from "../tool";

export const write: Tool = {
  async usage() {
    return "$toolbox.write() Apply git/diff patch. Body must be a valid git patch file content with path in it.";
  },

  async execute(args: any[], body: string) {
    // Write the diff to a temp file
    const tmpFile = `/tmp/patch_${Date.now()}.diff`;
    await Bun.write(tmpFile, body.trim());

    try {
      await $`patch -p1 < ${tmpFile}`;
      return "Ran it.";
    } catch (err: any) {
      throw new Error(err.stderr?.toString());
    } finally {
      await $`rm -f ${tmpFile}`.quiet();
    }
  },
};
