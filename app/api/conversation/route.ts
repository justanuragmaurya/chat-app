import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { content: true },
      },
    },
  });

  const formatted = conversations.map((c) => ({
    id: c.id,
    title: c.messages[0]?.content?.slice(0, 100) || "New conversation",
    createdAt: c.createdAt,
  }));

  return NextResponse.json({ conversations: formatted });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      messages: {
        create: {
          role: "user",
          content: message,
          userId: session.user.id,
        },
      },
    },
  });

  return NextResponse.json({ conversationId: conversation.id });
}
