import * as z from "zod";
import axios from "axios"
import { tool } from "@openai/agents";

export const webSearchTool = tool({
  name: "web_search",
  description: "Search the live internet for real-time information, news, and website summaries. Use this for questions about current events.",
  parameters: z.object({
    query: z.string().describe("The search query to look up on the web."),
    freshness: z.enum(["oneDay", "oneWeek", "oneMonth", "oneYear", "noLimit"])
      .optional()
      .default("noLimit")
      .describe("The time range for results. Use 'oneDay' for breaking news."),
    count: z.number().min(1).max(10).optional().default(5),
    summary: z.boolean().optional().default(true)
  }),
  execute: async ({ query, freshness, count, summary }) => {
    const url = 'https://api.langsearch.com/v1/web-search';
    
    try {
      const response = await axios.post(
        url,
        { query, freshness, count, summary },
        {
          headers: {
            'Authorization': `Bearer ${process.env.LANGSEARCH_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const results = response.data.data.webPages.value.map((page: any) => ({
        title: page.name,
        link: page.url,
        snippet: page.snippet,
        summary: page.summary || "No summary available"
      }));

      console.log("tool used");
      
      return JSON.stringify(results);
    } catch (error: any) {
      return `Error performing search: ${error.message}`;
    }
  }
});