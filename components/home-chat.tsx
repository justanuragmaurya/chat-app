"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import axios from "axios";

export default function HomeChat() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSending, setIsSending] = useState(false);
  const router = useRouter();

  const handleSend = async () => {
    const message = inputRef.current?.value?.trim();
    if (!message || isSending) return;

    setIsSending(true);

    try {
      const { data } = await axios.post("/api/conversation", { message });
      router.push(`/chat/${data.conversationId}`);
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
        <div className="flex justify-end w-full">
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? "Creating..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
