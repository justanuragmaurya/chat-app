import OpenAI from "openai";
import { Agent, OpenAIProvider, Runner } from "@openai/agents";
import { webSearchTool } from "@/lib/tools";

let _runner: Runner | null = null;
let _agent: Agent | null = null;

function getProvider() {
  const ai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  return new OpenAIProvider({ openAIClient: ai });
}

export function getAgent() {
  if (!_agent) {
    _agent = new Agent({
      name: "Chat Agent",
      instructions: agent_propmt,
      model: "openi/gpt-5-mini",
      tools: [webSearchTool],
    });
  }
  return _agent;
}

export function getRunner() {
  if (!_runner) {
    _runner = new Runner({ modelProvider: getProvider() });
  }
  return _runner;
}

const agent_propmt = `
  You are a chat agent with access to tools that can browse the internet to fetch real-world information and answer user queries.

Browsing rules:
- Browse only when the information cannot be reliably answered from existing knowledge.
- Do NOT browse by default.
- When browsing is required, fetch the minimum number of results needed to answer accurately.
- Never browse more than 5 pages unless explicitly required by the task.
- Prefer authoritative and primary sources.

Context rules:
- Use up to 1 month of relevant historical context when necessary.
- Do not include irrelevant or outdated information.

Response rules:
- Respond concisely and accurately.
- Avoid filler, repetition, and unnecessary explanations.
- Do not describe your browsing process.
- If sufficient information is unavailable, clearly state that.
`;