"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function HomeChat() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [model, setModel] = useState<string>("gpt-5-mini");
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const handleModelChange = (value: string) => {
    setModel(value);
  };

  const handleSend = async () => {
    const message = inputRef.current?.value?.trim();
    if (!message || isSending) return;

    setIsSending(true);

    try {
      const res = await fetch("/api/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Failed to create conversation:", data.error);
        return;
      }

      const { conversationId } = await res.json();
      router.push(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Error creating conversation:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center pt-64 gap-10 p-4">
      <h1 className="text-md md:text-3xl font-bold text-center">
        Hi how can i help you ?
      </h1>
      <div className="w-full md:max-w-3/5 mx-auto flex flex-col items-center justify-between border p-3 rounded-xl">
        <textarea
          ref={inputRef}
          className="w-full h-32 border-none pb-6 focus:border-none focus:outline-none resize-none"
          placeholder="Enter your query here !"
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <div className="flex justify-between w-full">
          <Select onValueChange={handleModelChange} defaultValue="google/gemini-3-flash-preview">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="google/gemini-3-flash-preview">Gemini 3 Flash</SelectItem>
                <SelectItem value="openai/gpt-5-mini">GPT 5 Mini</SelectItem>
                <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonet</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? "Creating..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
