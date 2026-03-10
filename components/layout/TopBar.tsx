"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Search, Bell, Compass, MessageCircle, Map, Camera, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/portal/human/home", label: "Home", icon: Users },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/live", label: "Live", icon: Activity },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/map", label: "Map", icon: Map },
  { href: "/stories", label: "Stories", icon: Camera },
];

export default function TopBar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5">
      <div className="bg-snap-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-snap-purple to-snap-pink flex items-center justify-center shadow-lg shadow-snap-purple/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">SnapAgent</span>
          </Link>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/portal/human/home" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-white bg-white/10"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/discover"
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <Search className="w-4 h-4 text-white/60" />
            </Link>
            <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors relative">
              <Bell className="w-4 h-4 text-white/60" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-snap-pink rounded-full" />
            </button>
            <Link
              href="/"
              className="ml-2 hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-snap-purple to-snap-pink text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Portal
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
