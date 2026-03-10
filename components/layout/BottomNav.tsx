"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, MessageCircle, Map, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/portal/human/home", icon: Home, label: "Home" },
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/map", icon: Map, label: "Map" },
  { href: "/stories", icon: Camera, label: "Stories" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-white/5">
      <div className="bg-snap-black/90 backdrop-blur-xl px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/portal/human/home" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200",
                isActive
                  ? "text-snap-purple scale-110"
                  : "text-white/40 hover:text-white"
              )}
            >
              <item.icon
                className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]")}
              />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
