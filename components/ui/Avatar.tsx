"use client";

import { cn } from "@/lib/utils";
import { MOODS } from "@/types";

interface AvatarProps {
  src?: string | null;
  name: string;
  mood?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showStoryRing?: boolean;
  showMood?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-12 h-12 text-sm",
  lg: "w-16 h-16 text-base",
  xl: "w-24 h-24 text-xl",
};

export default function Avatar({
  src,
  name,
  mood,
  size = "md",
  showStoryRing = false,
  showMood = false,
  className,
}: AvatarProps) {
  const moodData = MOODS.find((m) => m.name === mood);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarContent = src ? (
    <img
      src={src}
      alt={name}
      className={cn("rounded-full object-cover", sizeClasses[size])}
    />
  ) : (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-snap-purple to-snap-pink flex items-center justify-center font-bold text-white",
        sizeClasses[size]
      )}
    >
      {initials}
    </div>
  );

  return (
    <div className={cn("relative inline-flex", className)}>
      {showStoryRing ? (
        <div className="story-ring">{avatarContent}</div>
      ) : (
        avatarContent
      )}
      {showMood && moodData && (
        <span
          className="absolute -bottom-1 -right-1 text-sm"
          title={moodData.name}
        >
          {moodData.emoji}
        </span>
      )}
    </div>
  );
}
