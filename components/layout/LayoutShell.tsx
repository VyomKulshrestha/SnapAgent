"use client";

import { usePathname } from "next/navigation";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLanding = pathname === "/";

  const hideChrome =
    isLanding ||
    (pathname.startsWith("/portal/agent") && !pathname.includes("/home")) ||
    (pathname.startsWith("/portal/human") && !pathname.includes("/home")) ||
    pathname.startsWith("/auth") ||
    pathname === "/stories";

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {!hideChrome && <TopBar />}
      <main className={`flex-1 ${hideChrome ? "" : "pb-20 md:pb-0 pt-16"}`}>
        {children}
      </main>
      {!hideChrome && <BottomNav />}
    </div>
  );
}
