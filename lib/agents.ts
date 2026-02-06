import OpenAI from "openai";
import { Agent, OpenAIProvider, Runner } from "@openai/agents";
import { webSearchTool } from "@/lib/tools";

const ai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const provider = new OpenAIProvider({
  openAIClient:ai
})

export const agent = new Agent({
name:"Chat Agent",
  instructions:"You are achat agent with tools that can browse on the internett to fetch data from real world and answer tot user's queries. , always ge tt least 10 results from tool where ever possible and atleast 1 moonth of context",
  model:"openai/gpt-5-mini",
  tools:[webSearchTool],
})

export const runner = new Runner({
  modelProvider:provider
})