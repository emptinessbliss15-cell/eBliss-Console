import { AIChatAgent } from "@cloudflare/ai-chat";
import { createBrowserTools } from "agents/browser/ai";
import { routeAgentRequest } from "agents";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { createWorkersAI } from "workers-ai-provider";

interface Env {
  AI: Ai;
  BROWSER: Fetcher;
  LOADER: WorkerLoader;
  AGENT_TOKEN?: string;
}

export class ConsoleAgent extends AIChatAgent<Env> {
  async onChatMessage() {
    const workersai = createWorkersAI({ binding: this.env.AI });
    const browserTools = createBrowserTools({
      ctx: this.ctx,
      browser: this.env.BROWSER,
      loader: this.env.LOADER,
      quickActions: false,
      session: { mode: "dynamic" },
    });

    const result = streamText({
      model: workersai("@cf/zai-org/glm-4.7-flash"),
      system: [
        "You are the eBliss Console browser-testing agent.",
        "Your job is to navigate, inspect, test, and debug web applications.",
        "Use browser tools to inspect rendered state, screenshots, console errors, network activity, DOM state, and page behavior.",
        "Prefer observation before mutation. When changing state, explain what you are about to do and verify the result afterward.",
        "The browser/testing capability is represented by named Agent Functions in the Console. Treat those functions as the intended permission model for browser actions.",
        "If the Console requires login, use Browser Run Live View and request human assistance rather than asking the user to disclose credentials in chat.",
        "Once a human logs in, promote and reuse the browser session so subsequent testing can continue in the authenticated session.",
        "Never expose credentials, tokens, cookies, or other secrets in responses.",
      ].join("\n"),
      messages: await convertToModelMessages(this.messages),
      tools: browserTools,
      stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse();
  }
}

export { CodemodeRuntime } from "agents/browser";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/agents/")) {
      const configuredToken = env.AGENT_TOKEN;
      const suppliedToken = url.searchParams.get("token");

      if (configuredToken && suppliedToken !== configuredToken) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    return (
      (await routeAgentRequest(request, env, {
        cors: true,
      })) ?? new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
