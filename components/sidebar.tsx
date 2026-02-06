"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/workspace-context";
import axios from "axios";

type Workspace = {
  id: string;
  name: string;
};

type Conversation = {
  id: string;
  title: string;
};

export default function Sidebar() {
  const { data: session } = useSession();
  const [collapse, setCollapse] = useState<boolean>(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const { activeWorkspaceId, setActiveWorkspaceId } = useWorkspace();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showNewWorkspace, setShowNewWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const newWorkspaceInputRef = useRef<HTMLInputElement>(null);
  const hasInitializedWorkspace = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  const activeConversationId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  const fetchWorkspaces = useCallback(async () => {
    if (!session?.user) return;
    try {
      const { data } = await axios.get("/api/workspace");
      setWorkspaces(data.workspaces);
      if (!hasInitializedWorkspace.current && data.workspaces.length > 0) {
        hasInitializedWorkspace.current = true;
        setActiveWorkspaceId(data.workspaces[0].id);
      }
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    }
  }, [session?.user]);

  const fetchConversations = useCallback(async () => {
    if (!session?.user) return;
    try {
      const params = activeWorkspaceId
        ? `?workspaceId=${activeWorkspaceId}`
        : "";
      const { data } = await axios.get(`/api/conversation${params}`);
      setConversations(data.conversations);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    }
  }, [session?.user, activeWorkspaceId]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations, pathname]);

  useEffect(() => {
    if (showNewWorkspace && newWorkspaceInputRef.current) {
      newWorkspaceInputRef.current.focus();
    }
  }, [showNewWorkspace]);

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      const { data } = await axios.post("/api/workspace", {
        name: newWorkspaceName.trim(),
      });
      setWorkspaces((prev) => [...prev, data.workspace]);
      setActiveWorkspaceId(data.workspace.id);
      setNewWorkspaceName("");
      setShowNewWorkspace(false);
    } catch (error) {
      console.error("Failed to create workspace:", error);
    }
  };

  const selectWorkspace = (id: string | null) => {
    setActiveWorkspaceId(id);
  };

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

        {!collapse && session?.user && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workspaces
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setShowNewWorkspace((v) => !v)}
                title="New Workspace"
              >
                <i className="fa-solid fa-plus text-xs" />
              </Button>
            </div>

            {showNewWorkspace && (
              <div className="flex gap-1">
                <input
                  ref={newWorkspaceInputRef}
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createWorkspace();
                    if (e.key === "Escape") {
                      setShowNewWorkspace(false);
                      setNewWorkspaceName("");
                    }
                  }}
                  placeholder="Workspace name"
                  className="flex-1 text-sm px-2 py-1 rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={createWorkspace}
                >
                  <i className="fa-solid fa-check text-xs" />
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-0.5 max-h-32 overflow-y-auto no-scrollbar">
              <button
                onClick={() => selectWorkspace(null)}
                className={`w-full text-left px-2 py-1.5 rounded-md text-sm truncate transition-colors flex items-center gap-2 ${
                  activeWorkspaceId === null
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <i className="fa-solid fa-layer-group text-xs opacity-60" />
                All Chats
              </button>
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => selectWorkspace(ws.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-sm truncate transition-colors flex items-center gap-2 ${
                    activeWorkspaceId === ws.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  }`}
                  title={ws.name}
                >
                  <i className="fa-solid fa-folder text-xs opacity-60" />
                  {ws.name}
                </button>
              ))}
            </div>

            <div className="border-b my-1" />
          </div>
        )}

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
              onClick={() => signOut({ callbackUrl: "/" })}
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
