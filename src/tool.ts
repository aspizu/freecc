import { JSON5 } from "bun";
import { read } from "./tools/read";
import { shell } from "./tools/shell";
import { write } from "./tools/write";

export interface Tool {
  args: string[];

  usage(): Promise<string>;

  execute(args: Record<string, any>, body: string): Promise<string>;
}

export const tools: Record<string, Tool> = {
  shell,
  read,
  write,
};

export interface Toolcall {
  tool: string;
  args: Record<string, any>;
  body: string;
}

export function parseToolcall(msg: string): Toolcall | null {
  msg = msg.trim();
  const toolboxIndex = msg.indexOf("$toolbox.");
  if (toolboxIndex === -1) {
    return null;
  }
  msg = msg.slice(toolboxIndex);
  if (msg.startsWith("````") && msg.endsWith("````")) {
    msg = msg.slice(4, -4).trim();
  }
  if (msg.startsWith("```") && msg.endsWith("```")) {
    msg = msg.slice(3, -3).trim();
  }
  const lines = msg.split("\n");
  const tool = lines[0].slice("$toolbox.".length, msg.indexOf("("));
  let args = [];
  const argvalues = lines[0].slice(msg.indexOf("(") + 1, msg.lastIndexOf(")"));
  try {
    args = JSON5.parse(`[${argvalues}]`) as any;
  } catch {
    try {
      args = JSON5.parse(`{${argvalues}}`) as any;
    } catch (error: any) {
      throw new Error(`Syntax error after $toolbox ${error.message}`);
    }
  }
  const body = lines.slice(1).join("\n");
  return { tool, args, body };
}
