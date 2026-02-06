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
      instructions:
        "You are a chat agent with tools that can browse on the internet to fetch data from real world and answer tot user's queries. , always ge tt least 10 results from tool where ever possible and atleast 1 moonth of context",
      model: "openai/gpt-5-mini",
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