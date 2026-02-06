"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "./ui/button";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatComponent({
  conversationId,
}: {
  conversationId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const loadMessages = async () => {
      try {
        const res = await fetch(`/api/conversation/${conversationId}`);
        if (!res.ok) return;

        const { messages: existingMessages } = await res.json();
        const formatted: Message[] = existingMessages.map(
          (m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })
        );
        setMessages(formatted);

        if (
          formatted.length > 0 &&
          formatted[formatted.length - 1].role === "user"
        ) {
          triggerAIResponse(formatted);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      }
    };

    loadMessages();
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const triggerAIResponse = async (currentMessages?: Message[]) => {
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          const otherMessages = prev.slice(0, -1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + chunkValue },
          ];
        });
      }
    } catch (error) {
      console.error("Error streaming:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: input }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);

        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          const otherMessages = prev.slice(0, -1);
          return [
            ...otherMessages,
            { ...lastMessage, content: lastMessage.content + chunkValue },
          ];
        });
      }
    } catch (error) {
      console.error("Error streaming:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 max-w-4xl mx-auto gap-2 h-screen">
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-2 no-scrollbar space-y-4"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg max-w-[80%] ${
              m.role === "user"
                ? "text-white ml-auto border rounded-2xl bg-green-500"
                : "mr-auto"
            }`}
          >
            <pre className="text-wrap">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </pre>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="text-gray-400 italic">Agent is thinking...</div>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          className="p-2 flex-1 resize-none border no-scrollbar h-10 rounded-md"
          placeholder="Enter Message here"
        />
        <Button onClick={sendMessage} disabled={isLoading}>
          {isLoading ? "..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
