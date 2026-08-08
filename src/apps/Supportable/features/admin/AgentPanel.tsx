import { useState } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "@cloudflare/ai-chat/react";

const agentHost = (import.meta.env.VITE_AGENT_URL as string | undefined)?.replace(/\/$/, "");
const agentToken = import.meta.env.VITE_AGENT_TOKEN as string | undefined;

type AgentPanelProps = { enabled?: boolean };

export function AgentPanel({ enabled = Boolean(agentHost) }: AgentPanelProps) {
  const agent = useAgent({
    agent: "ConsoleAgent",
    name: "console",
    ...(agentHost ? { host: agentHost } : {}),
    ...(agentToken ? { query: { token: agentToken } } : {}),
  });
  const { messages, sendMessage, status } = useAgentChat({ agent });
  const [input, setInput] = useState("");

  if (!enabled) {
    return (
      <section className="supportable-admin">
        <div className="admin-heading">
          <div>
            <div className="app-kicker">Agent</div>
            <h2>Browser Testing Agent</h2>
            <p>The Agent UI is ready. Set <code>VITE_AGENT_URL</code> after the Cloudflare Agent Worker is deployed.</p>
          </div>
        </div>
      </section>
    );
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || status !== "ready") return;
    sendMessage({ text });
    setInput("");
  }

  return (
    <section className="supportable-admin">
      <div className="admin-heading">
        <div>
          <div className="app-kicker">Agent</div>
          <h2>Browser Testing Agent</h2>
          <p>Ask the agent to navigate, inspect, test, and diagnose the Console.</p>
        </div>
        <div className="admin-heading-actions"><span className="admin-summary">{status}</span></div>
      </div>
      <div className="agent-chat" aria-live="polite">
        {messages.length === 0 && <div className="agent-empty">Try: “Open the Console and inspect the Participants tab for errors.”</div>}
        {messages.map((message) => (
          <div className={`agent-message ${message.role}`} key={message.id}>
            <strong>{message.role === "user" ? "You" : "Agent"}</strong>
            <div>{message.parts.map((part, index) => part.type === "text" ? <span key={index}>{part.text}</span> : null)}</div>
          </div>
        ))}
      </div>
      <form className="agent-chat-form" onSubmit={submit}>
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask the agent to test something…" disabled={status !== "ready"} />
        <button className="primary-button" type="submit" disabled={status !== "ready" || !input.trim()}>Send</button>
      </form>
    </section>
  );
}
