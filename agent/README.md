# eBliss Console Browser Agent

This Worker hosts the first real Agent executor for the Console.

## What it does

- Runs as a Cloudflare Agent using Durable Objects.
- Uses Workers AI for the agent loop.
- Uses Cloudflare Browser Run through the Agents Browser tools.
- Can inspect rendered pages, screenshots, DOM state, console output, and network activity.
- Uses a dynamic browser session so a human can log in through Live View and the agent can continue testing the authenticated session.

## Local development

```bash
cd agent
npm install
npm run dev
```

## Deployment

Deploy this directory as the `ebliss-console-agent` Cloudflare Worker:

```bash
cd agent
npm install
npm run deploy
```

The Console UI expects `VITE_AGENT_URL` to point at the deployed Worker URL.

## Security

The browser agent is intentionally separate from the Console frontend. Do not put a Cloudflare secret directly into the Vite bundle. The optional `AGENT_TOKEN` Worker secret can be used as a temporary development gate, but production should use a short-lived signed token or same-origin authentication. Cloudflare's Agent cross-domain authentication guidance recommends short-lived, scoped tokens rather than raw secrets in WebSocket URLs.

The browser agent should request human assistance through Browser Run Live View for Console login or other sensitive steps; credentials should never be entered into the Agent chat.
