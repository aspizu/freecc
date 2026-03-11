import { $ } from "bun";
import type { Tool } from "../tool";

export const write: Tool = {
  async usage() {
    return "$toolbox.write() Apply git/diff patch. Body must be a valid git patch file content with path in it.";
  },

  async execute(args: any[], body: string) {
    const tmpFile = `/tmp/patch_${Date.now()}.diff`;
    await Bun.write(tmpFile, body.trim());
    const response = await $`patch -p1 2>&1 < ${tmpFile}`.nothrow().text();
    await $`rm -f ${tmpFile}`.quiet();
    return response;
  },
};
