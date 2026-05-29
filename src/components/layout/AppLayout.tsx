import { useState, type ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { OfflineBanner } from "@/components/OfflineBanner";
import { FamilyProvider } from "@/contexts/FamilyContext";

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <FamilyProvider>
      <div className="flex min-h-screen w-full bg-muted/40">
        <AppSidebar collapsed={collapsed} />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader onToggleSidebar={() => setCollapsed((v) => !v)} />
          <OfflineBanner />

          <main className="flex-1 pb-24 md:pb-10">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
              {children}
            </div>
          </main>
        </div>

        <BottomNav />
      </div>
    </FamilyProvider>
  );
}
