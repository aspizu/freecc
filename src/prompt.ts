import { tools } from "./tool";

const usages = (
  await Promise.all(
    Object.entries(tools).map(async ([name, tool]) => {
      return ` - ${await tool.usage()}`;
    }),
  )
).join("\n");

export const PROMPT = `\
But I've run into a huge obstacle, I only have access to a terminal running a special
kind of operating system, its similar to Linux, but I'm only allowed to run specific
commands in a very special syntax.

To make it easier for you to help me with this special OS, lets esablish some rules:

**OS Rules**

* You may only tell me to issue tool calls in chat, I will then run them for you.
* Do not write explanations, questions, or any other text, I'm in a hurry and want to get this done quickly.
* Do not ask multiple-choice questions, I'm in a hurry.
* I will execute the tool call for you and return the output in chat.

**Tool Call Format**

Every response must follow this structure:

\`\`\`
$toolbox.TOOLNAME(...ARGS)
...body of the tool goes here
\`\`\`

**Available Tool**

${usages}
`;

export function code(msg: string, code: string) {
  return `${msg}\n\`\`\`\n${code}\n\`\`\``;
}

export function error(message: Error | string) {
  if (message instanceof Error) {
    message = message.message;
  }
  return code("I got the following error from the OS:", `error: ${message}`);
}

export function file(msg: string, lines: string[]) {
  const colmaxlen = lines.length.toString().length;
  return lines
    .map((line, i) => `${(i + 1).toString().padStart(colmaxlen)} ${line}`)
    .join("\n");
}
