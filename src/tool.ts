import { read } from "./tools/read";
import { shell } from "./tools/shell";
import { write } from "./tools/write";

export interface Tool {
  usage(): Promise<string>;

  execute(args: any[], body: string): Promise<string>;
}

export const tools: Record<string, Tool> = {
  shell,
  read,
  write,
};

export interface Toolcall {
  tool: string;
  args: string[];
  body: string;
}

export function parseToolcall(msg: string): Toolcall | null {
  msg = msg.trim();
  if (msg.startsWith("````") && msg.endsWith("````")) {
    msg = msg.slice(4, -4).trim();
  }
  if (msg.startsWith("```") && msg.endsWith("```")) {
    msg = msg.slice(3, -3).trim();
  }
  if (!msg.startsWith("$toolbox.")) {
    return null;
  }
  const lines = msg.split("\n");
  const tool = lines[0].slice("$toolbox.".length, msg.indexOf("("));
  let args = [];
  try {
    args = JSON.parse(
      "[" + lines[0].slice(msg.indexOf("(") + 1, msg.lastIndexOf(")")) + "]",
    );
  } catch {}
  const body = lines.slice(1).join("\n");
  return { tool, args, body };
}
