"use client";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "./ui/button";
import axios from "axios";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const CHAR_INTERVAL_MS = 1;

export default function ChatComponent({
  conversationId,
}: {
  conversationId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const streamBufferRef = useRef("");
  const displayedLengthRef = useRef(0);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamDoneRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const loadMessages = async () => {
      try {
        const { data } = await axios.get(
          `/api/conversation/${conversationId}`
        );
        const formatted: Message[] = data.messages.map(
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

  useEffect(() => {
    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, []);

  const startTypewriter = () => {
    if (typewriterRef.current) return;

    typewriterRef.current = setInterval(() => {
      const bufLen = streamBufferRef.current.length;
      const curLen = displayedLengthRef.current;

      if (curLen < bufLen) {
        displayedLengthRef.current = curLen + 1;
        const text = streamBufferRef.current.slice(
          0,
          displayedLengthRef.current
        );
        setMessages((prev) => {
          const rest = prev.slice(0, -1);
          return [...rest, { role: "assistant" as const, content: text }];
        });
      } else if (streamDoneRef.current) {
        clearInterval(typewriterRef.current!);
        typewriterRef.current = null;
        setIsLoading(false);
      }
    }, CHAR_INTERVAL_MS);
  };

  const streamResponse = async (body: object) => {
    streamBufferRef.current = "";
    displayedLengthRef.current = 0;
    streamDoneRef.current = false;

    let lineBuf = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.body) {
        setIsLoading(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        lineBuf += decoder.decode(value, { stream: true });

        const lines = lineBuf.split("\n");
        lineBuf = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === "status") {
              setStatusMessage(event.message);
            } else if (event.type === "text") {
              setStatusMessage(null);
              startTypewriter();
              streamBufferRef.current += event.content;
            }
          } catch {
            console.log("Error")
          }
        }
      }
    } catch (error) {
      console.error("Error streaming:", error);
    } finally {
      streamDoneRef.current = true;
      setStatusMessage(null);
      if (!typewriterRef.current) {
        setIsLoading(false);
      }
    }
  };

  const triggerAIResponse = async (_currentMessages?: Message[]) => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    await streamResponse({ conversationId });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    await streamResponse({ conversationId, message: input });
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
                ? "text-white ml-auto border rounded-2xl bg-secondary/20"
                : "mr-auto"
            }`}
          >
            <pre
              className={`text-wrap ${
                m.role == "user" && "justify-self-end"
              }`}
            >
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </pre>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.content === "" && (
          <div className="text-gray-400 italic flex items-center gap-2">
            {statusMessage ? (
              <>
                <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                {statusMessage}
              </>
            ) : (
              "Agent is thinking..."
            )}
          </div>
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
