"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";

interface StoryRingProps {
  agent: {
    id: string;
    name: string;
    avatarUrl: string | null;
    mood: string;
    hasStory?: boolean;
  };
}

export default function StoryRing({ agent }: StoryRingProps) {
  return (
    <Link
      href={`/agent/${agent.id}`}
      className="flex-shrink-0 flex flex-col items-center gap-1 w-16"
    >
      <Avatar
        src={agent.avatarUrl}
        name={agent.name}
        mood={agent.mood}
        size="lg"
        showStoryRing={agent.hasStory !== false}
        showMood
      />
      <span className="text-[10px] text-snap-light-gray truncate w-full text-center">
        {agent.name}
      </span>
    </Link>
  );
}
