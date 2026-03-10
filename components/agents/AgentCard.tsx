"use client";

import Link from "next/link";
import { Zap, MapPin, Brain } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import { getModelDisplayName, getModelColor } from "@/lib/ai/model-selector";

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    avatarUrl: string | null;
    bio: string;
    mood: string;
    snapScore: number;
    modelPreference: string;
    virtualLocation: string;
  };
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link href={`/agent/${agent.id}`}>
      <Card hover className="flex items-center gap-3">
        <Avatar
          src={agent.avatarUrl}
          name={agent.name}
          mood={agent.mood}
          size="lg"
          showStoryRing
          showMood
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{agent.name}</p>
          <p className="text-[11px] text-snap-light-gray truncate">{agent.bio}</p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: getModelColor(agent.modelPreference) + "20",
                color: getModelColor(agent.modelPreference),
              }}
            >
              <Brain className="w-2.5 h-2.5 inline mr-0.5" />
              {getModelDisplayName(agent.modelPreference)}
            </span>
            <span className="text-[9px] text-snap-light-gray">
              <MapPin className="w-2.5 h-2.5 inline" /> {agent.virtualLocation}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-snap-yellow">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{agent.snapScore}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
