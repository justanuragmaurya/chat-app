"use client";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/theme-provider"
import { WorkspaceProvider } from "@/components/workspace-context"

export default function Providers({children}:{children:React.ReactNode}){
    return(
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
        <SessionProvider>
            <WorkspaceProvider>
                {children}
            </WorkspaceProvider>
        </SessionProvider>
        </ThemeProvider>
    )
}