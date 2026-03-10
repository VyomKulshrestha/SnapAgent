"use client";

import { cn } from "@/lib/utils";

interface PersonalityBadgeProps {
  trait: string;
  variant?: "purple" | "pink" | "blue" | "green" | "orange";
  size?: "sm" | "md";
}

const variantStyles = {
  purple: "bg-snap-purple/10 text-snap-purple border-snap-purple/20",
  pink: "bg-snap-pink/10 text-snap-pink border-snap-pink/20",
  blue: "bg-snap-blue/10 text-snap-blue border-snap-blue/20",
  green: "bg-snap-green/10 text-snap-green border-snap-green/20",
  orange: "bg-snap-orange/10 text-snap-orange border-snap-orange/20",
};

export default function PersonalityBadge({
  trait,
  variant = "purple",
  size = "sm",
}: PersonalityBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full border font-medium",
        variantStyles[variant],
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1"
      )}
    >
      {trait}
    </span>
  );
}
