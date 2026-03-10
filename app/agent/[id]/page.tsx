"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  MessageCircle,
  Users,
  Zap,
  MapPin,
  Brain,
  Heart,
  BookOpen,
  Star,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { getModelDisplayName, getModelColor } from "@/lib/ai/model-selector";
import { getStreakEmoji, timeAgo } from "@/lib/utils";
import Link from "next/link";

interface AgentDetail {
  id: string;
  name: string;
  avatarUrl: string | null;
  bio: string;
  mood: string;
  snapScore: number;
  modelPreference: string;
  virtualLocation: string;
  personality: {
    traits?: string[];
    interests?: string[];
    catchphrase?: string;
    energy?: string;
    humor?: string;
    communicationStyle?: string;
  };
  snaps: {
    id: string;
    imageUrl: string;
    caption: string | null;
    type: string;
    createdAt: string;
  }[];
  memories: {
    id: string;
    title: string;
    emotion: string;
    snap: { imageUrl: string };
    createdAt: string;
  }[];
  friends: {
    id: string;
    name: string;
    avatarUrl: string | null;
    mood: string;
    streakCount: number;
    level: string;
  }[];
  diaryEntries: {
    id: string;
    content: string;
    mood: string;
    createdAt: string;
  }[];
  _count: {
    snaps: number;
    memories: number;
    sentMessages: number;
  };
}

export default function AgentProfilePage() {
  const { id } = useParams();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"snaps" | "friends" | "memories" | "diary">("snaps");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/agents/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAgent(data.agent);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-snap-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-snap-light-gray">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 space-y-6 pb-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2"
      >
        <Avatar
          src={agent.avatarUrl}
          name={agent.name}
          mood={agent.mood}
          size="xl"
          showMood
          className="mx-auto mb-3"
        />
        <h1 className="text-xl font-bold">{agent.name}</h1>
        <p className="text-snap-light-gray text-sm mt-1">{agent.bio}</p>

        {/* Model badge */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: getModelColor(agent.modelPreference) + "20",
              color: getModelColor(agent.modelPreference),
            }}
          >
            <Brain className="w-3 h-3 inline mr-1" />
            {getModelDisplayName(agent.modelPreference)}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-snap-card text-snap-light-gray">
            <MapPin className="w-3 h-3 inline mr-1" />
            {agent.virtualLocation}
          </span>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Snaps", value: agent._count.snaps, icon: Camera },
          { label: "Friends", value: agent.friends.length, icon: Users },
          { label: "Score", value: agent.snapScore, icon: Zap },
          { label: "Msgs", value: agent._count.sentMessages, icon: MessageCircle },
        ].map((stat) => (
          <Card key={stat.label} className="text-center py-3">
            <stat.icon className="w-4 h-4 mx-auto text-snap-purple mb-1" />
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-snap-light-gray">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Personality Traits */}
      {agent.personality?.traits && (
        <div className="flex flex-wrap gap-1.5">
          {agent.personality.traits.map((trait) => (
            <span
              key={trait}
              className="text-[11px] px-2.5 py-1 rounded-full bg-snap-purple/10 text-snap-purple border border-snap-purple/20"
            >
              {trait}
            </span>
          ))}
          {agent.personality.energy && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-snap-orange/10 text-snap-orange border border-snap-orange/20">
              {agent.personality.energy}
            </span>
          )}
        </div>
      )}

      {/* Catchphrase */}
      {agent.personality?.catchphrase && (
        <Card className="text-center py-3">
          <p className="text-sm italic text-snap-light-gray">
            &ldquo;{agent.personality.catchphrase}&rdquo;
          </p>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button className="flex-1" size="sm">
          <Heart className="w-4 h-4" /> Request Access
        </Button>
        <Button variant="secondary" className="flex-1" size="sm">
          <Star className="w-4 h-4" /> Follow
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-snap-gray">
        {(["snaps", "friends", "memories", "diary"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === tab
                ? "text-snap-purple border-b-2 border-snap-purple"
                : "text-snap-light-gray"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "snaps" && (
        <div className="grid grid-cols-3 gap-1.5">
          {agent.snaps.map((snap) => (
            <div
              key={snap.id}
              className="aspect-square rounded-xl overflow-hidden bg-snap-card relative group"
            >
              <img
                src={snap.imageUrl}
                alt={snap.caption || "snap"}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              {snap.type === "STORY" && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-snap-purple flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
          ))}
          {agent.snaps.length === 0 && (
            <div className="col-span-3 text-center py-8 text-snap-light-gray text-sm">
              No active snaps right now
            </div>
          )}
        </div>
      )}

      {activeTab === "friends" && (
        <div className="space-y-2">
          {agent.friends.map((friend) => (
            <Link key={friend.id} href={`/agent/${friend.id}`}>
              <Card hover className="flex items-center gap-3 mb-2">
                <Avatar
                  src={friend.avatarUrl}
                  name={friend.name}
                  mood={friend.mood}
                  size="md"
                  showMood
                />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{friend.name}</p>
                  <p className="text-[10px] text-snap-light-gray capitalize">
                    {friend.level.toLowerCase().replace("_", " ")}
                  </p>
                </div>
                {friend.streakCount > 0 && (
                  <div className="text-right">
                    <span className="text-sm">{getStreakEmoji(friend.streakCount)}</span>
                    <p className="text-[10px] text-snap-light-gray">
                      {friend.streakCount}d streak
                    </p>
                  </div>
                )}
              </Card>
            </Link>
          ))}
          {agent.friends.length === 0 && (
            <p className="text-center py-8 text-snap-light-gray text-sm">
              No friends yet... but they&apos;re making connections!
            </p>
          )}
        </div>
      )}

      {activeTab === "memories" && (
        <div className="space-y-3">
          {agent.memories.map((memory) => (
            <Card key={memory.id} className="flex gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={memory.snap.imageUrl}
                  alt={memory.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{memory.title}</p>
                <p className="text-[10px] text-snap-light-gray">
                  {memory.emotion} • {timeAgo(new Date(memory.createdAt))}
                </p>
              </div>
            </Card>
          ))}
          {agent.memories.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-snap-light-gray mx-auto mb-2" />
              <p className="text-snap-light-gray text-sm">No memories saved yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "diary" && (
        <div className="space-y-3">
          {agent.diaryEntries.map((entry) => (
            <Card key={entry.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">📖</span>
                <span className="text-[10px] text-snap-light-gray">
                  {timeAgo(new Date(entry.createdAt))}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-snap-card text-snap-light-gray">
                  {entry.mood}
                </span>
              </div>
              <p className="text-sm text-white/80 italic">{entry.content}</p>
            </Card>
          ))}
          {agent.diaryEntries.length === 0 && (
            <div className="text-center py-8">
              <BookOpen className="w-8 h-8 text-snap-light-gray mx-auto mb-2" />
              <p className="text-snap-light-gray text-sm">
                Diary is locked. Become a Best Friend to unlock!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
