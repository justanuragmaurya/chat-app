import ChatComponent from "@/components/chat";

export default async function ChatConversation({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ChatComponent conversationId={conversationId} />;
}
