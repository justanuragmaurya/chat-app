"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

type Conversation = {
  id: string;
  title: string;
};

export default function Sidebar() {
  const { data: session } = useSession();
  const [collapse, setCollapse] = useState<boolean>(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const activeConversationId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  const fetchConversations = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/conversation");
      if (!res.ok) return;
      const { conversations: data } = await res.json();
      setConversations(data);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, pathname]);

  return (
    <div
      className={`${
        collapse ? "w-14" : "w-64"
      } border-r hidden md:flex flex-col justify-between transition-all duration-200 h-screen`}
    >
      <div className="p-2 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapse((e) => !e)}
          className="shrink-0"
        >
          {collapse ? (
            <i className="fa-solid fa-arrow-right" />
          ) : (
            <i className="fa-solid fa-arrow-left" />
          )}
        </Button>

        {!collapse ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/chat")}
          >
            <i className="fa-solid fa-plus mr-2" />
            New Chat
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/chat")}
            title="New Chat"
            className="mx-auto"
          >
            <i className="fa-solid fa-plus" />
          </Button>
        )}
      </div>

      {!collapse && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-2">
          {session?.user ? (
            conversations.length > 0 ? (
              conversations.map((convo) => (
                <button
                  key={convo.id}
                  onClick={() => router.push(`/chat/${convo.id}`)}
                  className={`w-full text-left px-2 py-2 rounded-lg text-sm truncate transition-colors ${
                    activeConversationId === convo.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                  title={convo.title}
                >
                  {convo.title}
                </button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                No conversations yet
              </p>
            )
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center">
              Sign in to see your chats
            </p>
          )}
        </div>
      )}

      <div className="p-2 border-t">
        {session?.user ? (
          <div className={`flex ${collapse ? "flex-col items-center gap-2" : "items-center gap-2"}`}>
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            {!collapse && (
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate font-medium">
                  {session.user.name}
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              title="Sign out"
              className="shrink-0"
            >
              <i className="fa-solid fa-right-from-bracket" />
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={() => signIn("google")}
          >
            {collapse ? (
              <i className="fa-solid fa-right-to-bracket" />
            ) : (
              "Sign in with Google"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
