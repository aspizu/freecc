export function code(msg: string, code: string) {
  return `${msg}\n\`\`\`\n${code}\n\`\`\``;
}

export function error(message: Error | string) {
  if (message instanceof Error) {
    message = message.message;
  }
  return code("I got the following error from the OS:", `error: ${message}`);
}
