import cors from "@elysiajs/cors";
import Elysia from "elysia";
import logixlysia from "logixlysia";
import { PROMPT } from "./prompt";
import { parseToolcall, tools } from "./tool";

new Elysia()
  .use(cors())
  .use(logixlysia())
  .get("/init", async (ctx) => {
    return new Response(PROMPT);
  })
  .post("/tool", async (ctx) => {
    const msg = await ctx.request.text();
    const toolcall = parseToolcall(msg);
    if (!toolcall) {
      return { skipped: true };
    }
    if (!(toolcall.tool in tools)) {
      return {
        skipped: false,
        msg: `I got the following error from the OS:\n\`\`\`\nerror: ${toolcall.tool} is not a valid tool.\n\`\`\``,
      };
    }
    const tool = tools[toolcall.tool];
    try {
      const msg = await tool.execute(toolcall.args, toolcall.body);
      return { skipped: false, msg };
    } catch (error) {
      if (error instanceof Error) {
        return {
          skipped: false,
          msg: `I got the following error from the OS:\n\`\`\`\nerror: ${error.message}\nusage: ${await tool.usage()}\n\`\`\``,
        };
      }
    }
  })
  .listen({ hostname: "localhost", port: 3000 });
