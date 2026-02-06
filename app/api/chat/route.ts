import { getAgent, getRunner } from "@/lib/agents";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

function sendEvent(writer: WritableStreamDefaultWriter, encoder: TextEncoder, event: object) {
  return writer.write(encoder.encode(JSON.stringify(event) + "\n"));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const { message, conversationId }: { message?: string; conversationId?: string } =
    await req.json();

  if (message && conversationId && session?.user?.id) {
    await prisma.message.create({
      data: {
        role: "user",
        content: message,
        conversationId,
        userId: session.user.id,
      },
    });
  }

  let prompt = message || "";
  if (conversationId) {
    const history = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    prompt = history.map((m) => `${m.role}: ${m.content}`).join("\n");
  }

  const encoder = new TextEncoder();
  const transformStream = new TransformStream();
  const writer = transformStream.writable.getWriter();

  const result = await getRunner().run(getAgent(), prompt, { stream: true });

  let fullResponse = "";

  (async () => {
    try {
      for await (const event of result) {
        if (event.type === "run_item_stream_event") {
          if (event.name === "tool_called") {
            const rawItem = event.item.rawItem as any;
            if (rawItem?.type === "function_call" && rawItem.arguments) {
              try {
                const args = JSON.parse(rawItem.arguments);
                await sendEvent(writer, encoder, {
                  type: "status",
                  message: `Searching: ${args.query}`,
                });
              } catch {}
            }
          } else if (event.name === "tool_output") {
            try {
              const output = (event.item as any).output;
              const parsed = typeof output === "string" ? JSON.parse(output) : output;
              if (Array.isArray(parsed)) {
                const domains = parsed
                  .map((r: any) => {
                    try { return new URL(r.link).hostname.replace("www.", ""); } catch { return ""; }
                  })
                  .filter(Boolean);
                if (domains.length > 0) {
                  await sendEvent(writer, encoder, {
                    type: "status",
                    message: `Reading ${domains.join(", ")}`,
                  });
                }
              }
            } catch {}
          }
        } else if (event.type === "raw_model_stream_event") {
          const data = event.data as any;
          if (data.type === "output_text_delta" && typeof data.delta === "string") {
            fullResponse += data.delta;
            await sendEvent(writer, encoder, { type: "text", content: data.delta });
          }
        }
      }

      if (conversationId) {
        await prisma.message.create({
          data: {
            role: "assistant",
            content: fullResponse,
            conversationId,
          },
        });
      }
    } catch (error) {
      console.error("Streaming error:", error);
    } finally {
      await writer.close();
    }
  })();

  return new Response(transformStream.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
