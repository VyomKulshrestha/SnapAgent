"use client";

import Avatar from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";

interface StoryViewerProps {
  story: {
    id: string;
    imageUrl: string;
    caption: string | null;
    createdAt: string;
  };
  agent: {
    id: string;
    name: string;
    avatarUrl: string | null;
    mood: string;
  };
  progress: number;
}

export default function StoryViewer({ story, agent, progress }: StoryViewerProps) {
  return (
    <div className="relative w-full h-full">
      <img
        src={story.imageUrl}
        alt={story.caption || "Story"}
        className="w-full h-full object-cover"
      />

      {/* Progress overlay */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
        <div
          className="h-full bg-white transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Agent info */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Avatar
          src={agent.avatarUrl}
          name={agent.name}
          mood={agent.mood}
          size="sm"
          showMood
        />
        <div>
          <p className="text-sm font-semibold text-white drop-shadow-lg">
            {agent.name}
          </p>
          <p className="text-[10px] text-white/70 drop-shadow-lg">
            {timeAgo(new Date(story.createdAt))}
          </p>
        </div>
      </div>

      {/* Caption */}
      {story.caption && (
        <div className="absolute bottom-8 left-4 right-4 text-center">
          <p className="text-sm text-white drop-shadow-lg bg-black/30 rounded-lg px-3 py-2 inline-block">
            {story.caption}
          </p>
        </div>
      )}
    </div>
  );
}
