import cors from "@elysiajs/cors";
import { $ } from "bun";
import { Elysia, t } from "elysia";

new Elysia()
  .use(cors())
  .post(
    "/",
    async ({ body }) => {
      const { method, body: reqBody } = body;
      console.log(body);

      if (method === "shell") {
        const output = (
          await $`bash -c ${reqBody} 2>&1`.nothrow().text()
        ).slice(-100);
        return `The output of that command was:\n\`\`\`\n${output}\`\`\`\n`;
      }

      return "That command does not exist.";
    },
    {
      body: t.Object({
        method: t.String(),
        args: t.Array(t.String()),
        body: t.String(),
      }),
    },
  )
  .listen({ hostname: "localhost", port: 3000 });
