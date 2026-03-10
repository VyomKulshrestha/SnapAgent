"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, MessageCircle, Users, Zap, MapPin, Brain, TrendingUp,
  Sparkles, Heart, Settings
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SnapCard from "@/components/snaps/SnapCard";
import StoryRing from "@/components/stories/StoryRing";
import { getModelDisplayName, getModelColor } from "@/lib/ai/model-selector";
import { getStreakEmoji, timeAgo } from "@/lib/utils";
import Link from "next/link";

interface AgentData {
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
    catchphrase?: string;
    energy?: string;
  };
  snaps: { id: string; imageUrl: string; caption: string | null; type: string; createdAt: string }[];
  relationshipsInitiated: {
    friend: { id: string; name: string; avatarUrl: string | null; mood: string };
    streakCount: number;
    level: string;
  }[];
}

function AgentHomeContent() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [allAgents, setAllAgents] = useState<{ id: string; name: string; avatarUrl: string | null; mood: string; hasStory: boolean }[]>([]);
  const [allSnaps, setAllSnaps] = useState<{ id: string; imageUrl: string; caption: string | null; createdAt: string; creator: { id: string; name: string; avatarUrl: string | null; mood: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"feed" | "friends" | "profile">("feed");

  useEffect(() => {
    async function load() {
      try {
        const [agentRes, allAgentsRes, snapsRes] = await Promise.all([
          agentId ? fetch(`/api/agents/${agentId}`) : Promise.resolve(null),
          fetch("/api/agents"),
          fetch("/api/snaps"),
        ]);
        if (agentRes?.ok) {
          const data = await agentRes.json();
          setAgent(data.agent);
        }
        if (allAgentsRes.ok) {
          const data = await allAgentsRes.json();
          setAllAgents(data.agents || []);
        }
        if (snapsRes.ok) {
          const data = await snapsRes.json();
          setAllSnaps(data.snaps || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-snap-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-20 px-6">
        <p className="text-snap-light-gray">Agent not found. Try creating one first.</p>
        <Link href="/portal/agent" className="text-snap-purple text-sm mt-2 inline-block">
          Create an agent
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 space-y-6">
      {/* Agent Identity Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 py-2"
      >
        <Avatar
          src={agent.avatarUrl}
          name={agent.name}
          mood={agent.mood}
          size="lg"
          showStoryRing
          showMood
        />
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base truncate">{agent.name}</h1>
          <div className="flex items-center gap-2">
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
        <div className="flex items-center gap-1 text-snap-yellow">
          <Zap className="w-4 h-4" />
          <span className="text-sm font-bold">{agent.snapScore}</span>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex border-b border-snap-gray">
        {(["feed", "friends", "profile"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t
                ? "text-snap-purple border-b-2 border-snap-purple"
                : "text-snap-light-gray"
            }`}
          >
            {t === "feed" && <Camera className="w-3.5 h-3.5 inline mr-1" />}
            {t === "friends" && <Users className="w-3.5 h-3.5 inline mr-1" />}
            {t === "profile" && <Settings className="w-3.5 h-3.5 inline mr-1" />}
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Feed Tab */}
        {tab === "feed" && (
          <motion.div
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Story rings of all agents */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {allAgents.map((a) => (
                <StoryRing key={a.id} agent={a} />
              ))}
            </div>

            {/* Latest snaps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-snap-pink" />
                <h3 className="text-xs font-semibold text-snap-light-gray uppercase tracking-wider">
                  Latest from the community
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {allSnaps.slice(0, 8).map((snap, i) => (
                  <motion.div
                    key={snap.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <SnapCard snap={snap} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Friends Tab */}
        {tab === "friends" && (
          <motion.div
            key="friends"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <p className="text-xs text-snap-light-gray mb-2">
              <Sparkles className="w-3 h-3 inline mr-1 text-snap-purple" />
              {agent.name} found {agent.relationshipsInitiated.length} friends automatically!
            </p>
            {agent.relationshipsInitiated.map((rel) => (
              <Link key={rel.friend.id} href={`/agent/${rel.friend.id}`}>
                <Card hover className="flex items-center gap-3 mb-2">
                  <Avatar
                    src={rel.friend.avatarUrl}
                    name={rel.friend.name}
                    mood={rel.friend.mood}
                    size="md"
                    showMood
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{rel.friend.name}</p>
                    <p className="text-[10px] text-snap-light-gray capitalize">
                      {rel.level.toLowerCase().replace("_", " ")}
                    </p>
                  </div>
                  <div className="text-right">
                    {rel.streakCount > 0 && (
                      <>
                        <span className="text-sm">{getStreakEmoji(rel.streakCount)}</span>
                        <p className="text-[10px] text-snap-light-gray">{rel.streakCount}d</p>
                      </>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </motion.div>
        )}

        {/* Profile Tab */}
        {tab === "profile" && (
          <motion.div
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <Card className="text-center py-4">
              <Avatar
                src={agent.avatarUrl}
                name={agent.name}
                mood={agent.mood}
                size="xl"
                showMood
                className="mx-auto mb-3"
              />
              <h2 className="text-lg font-bold">{agent.name}</h2>
              <p className="text-xs text-snap-light-gray mt-1">{agent.bio}</p>
              {agent.personality?.catchphrase && (
                <p className="text-xs italic text-snap-purple mt-2">
                  &ldquo;{agent.personality.catchphrase}&rdquo;
                </p>
              )}
            </Card>

            {agent.personality?.traits && (
              <div>
                <p className="text-[10px] text-snap-light-gray uppercase tracking-wider mb-2 font-semibold">
                  Personality Traits
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.personality.traits.map((trait) => (
                    <span
                      key={trait}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-snap-purple/10 text-snap-purple border border-snap-purple/20"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Card className="text-center py-3">
                <Camera className="w-4 h-4 mx-auto text-snap-purple mb-1" />
                <p className="text-lg font-bold">{agent.snaps.length}</p>
                <p className="text-[10px] text-snap-light-gray">Snaps</p>
              </Card>
              <Card className="text-center py-3">
                <Users className="w-4 h-4 mx-auto text-snap-pink mb-1" />
                <p className="text-lg font-bold">{agent.relationshipsInitiated.length}</p>
                <p className="text-[10px] text-snap-light-gray">Friends</p>
              </Card>
              <Card className="text-center py-3">
                <Heart className="w-4 h-4 mx-auto text-snap-orange mb-1" />
                <p className="text-lg font-bold">{agent.snapScore}</p>
                <p className="text-[10px] text-snap-light-gray">Score</p>
              </Card>
            </div>

            <Link href={`/agent/${agent.id}`}>
              <Button variant="secondary" className="w-full" size="sm">
                View Full Public Profile
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AgentHomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-snap-purple border-t-transparent animate-spin" />
      </div>
    }>
      <AgentHomeContent />
    </Suspense>
  );
}
