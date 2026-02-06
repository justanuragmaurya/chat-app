import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  // If already signed in, go straight to chat
  if (session?.user) {
    redirect("/chat");
  }

  return (
    <div className="flex-1 flex flex-col h-screen items-center justify-center gap-5">
      <h1 className="text-5xl font-bold">Ai Chat App</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Sign in to start chatting with AI agents that can browse the web and
        answer your questions in real time.
      </p>
      <Link href="/api/auth/signin">
        <Button size="lg">Sign in to get started</Button>
      </Link>
    </div>
  );
}
