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

  // Check if the toolcall is wrapped in fences by scanning backwards from toolboxIndex
  const before = msg.slice(0, toolboxIndex);
  const fenceMatch = before.match(/(````|```)[^\n]*\n\s*$/);
  if (fenceMatch) {
    const fence = fenceMatch[1]; // ``` or ````
    const fenceStart = before.lastIndexOf(fence);
    const fenceEnd = msg.indexOf(fence, toolboxIndex);
    if (fenceEnd !== -1) {
      msg = msg.slice(fenceStart + fenceMatch[0].length, fenceEnd).trim();
    }
  } else {
    msg = msg.slice(toolboxIndex);
  }

  const lines = msg.split(/\r?\n/);
  const firstLine = lines[0];
  const parenOpen = firstLine.indexOf("(");
  const parenClose = firstLine.lastIndexOf(")");
  const tool = firstLine.slice("$toolbox.".length, parenOpen);
  const argvalues = firstLine.slice(parenOpen + 1, parenClose);

  let args = [];
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
