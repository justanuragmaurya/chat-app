import { getAgent, getRunner } from "@/lib/agents";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

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
      const textStream = result.toTextStream();
      for await (const chunk of textStream) {
        fullResponse += chunk;
        await writer.write(encoder.encode(chunk));
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
