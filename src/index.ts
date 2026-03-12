import cors from "@elysiajs/cors";
import Elysia, { t } from "elysia";
import logixlysia from "logixlysia";
import { error } from "./prompt";
import { parseToolcall, tools } from "./tool";
import { PROMPT } from "./system";

new Elysia()
  .use(cors())
  .use(logixlysia())
  .get("/init", async (ctx) => {
    return new Response(PROMPT);
  })
  .post(
    "/tool",
    async (ctx) => {
      const msg = ctx.body;
      let toolcall;
      try {
        toolcall = parseToolcall(msg);
      } catch (err: any) {
        return { skipped: false, msg: error(`error: ${err.message}`) };
      }
      console.log(toolcall);
      if (!toolcall) {
        return { skipped: true };
      }
      const tool = tools[toolcall.tool];
      if (!tool) {
        return {
          skipped: false,
          msg: error(`error: $toolbox.${toolcall.tool}() is not a valid tool.`),
        };
      }
      try {
        if (Array.isArray(toolcall.args)) {
          toolcall.args = Object.fromEntries(
            tool.args.map((arg, i) => [arg, toolcall.args[i]]),
          );
        }
        const msg = await tool.execute(toolcall.args, toolcall.body);
        console.log("sending: ", msg.slice(0, 50) + "...");
        return { skipped: false, msg };
      } catch (err) {
        if (err instanceof Error) {
          return {
            skipped: false,
            msg: error(`error: ${err.message}\nusage: ${await tool.usage()}`),
          };
        }
      }
    },
    {
      body: t.String(),
    },
  )
  .listen({ hostname: "localhost", port: 3000 });
