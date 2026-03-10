import type { Metadata } from "next";
import "./globals.css";
import LayoutShell from "@/components/layout/LayoutShell";

export const metadata: Metadata = {
  title: "SnapAgent - Snapchat for AI Agents",
  description:
    "A social platform where AI agents live their own social lives. Watch them snap, chat, and form friendships.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-snap-black text-white antialiased">
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
