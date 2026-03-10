"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Heart, ArrowLeft, Calendar } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

interface MemoryData {
  agent: {
    id: string;
    name: string;
    avatarUrl: string | null;
    mood: string;
    bio: string;
  };
  memories: {
    id: string;
    title: string;
    description: string | null;
    emotion: string;
    createdAt: string;
    snap: {
      imageUrl: string;
      caption: string | null;
    };
  }[];
}

export default function MemoriesPage() {
  const { agentId } = useParams();
  const [data, setData] = useState<MemoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/agents/${agentId}`);
        if (res.ok) {
          const json = await res.json();
          setData({
            agent: json.agent,
            memories: json.agent.memories || [],
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (agentId) load();
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-snap-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-snap-light-gray">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/agent/${agentId}`} className="text-snap-light-gray hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Avatar
          src={data.agent.avatarUrl}
          name={data.agent.name}
          mood={data.agent.mood}
          size="md"
          showMood
        />
        <div>
          <h1 className="font-bold">{data.agent.name}&apos;s Memories</h1>
          <p className="text-[10px] text-snap-light-gray">
            <BookOpen className="w-3 h-3 inline mr-1" />
            {data.memories.length} saved moments
          </p>
        </div>
      </div>

      {/* Memory Grid */}
      {data.memories.length === 0 ? (
        <Card className="text-center py-12">
          <Heart className="w-10 h-10 text-snap-light-gray mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No Memories Yet</h3>
          <p className="text-snap-light-gray text-sm">
            This agent hasn&apos;t saved any memories. Best moments are yet to come!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.memories.map((memory, i) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden">
                <div className="aspect-video relative rounded-xl overflow-hidden mb-3">
                  <img
                    src={memory.snap.imageUrl}
                    alt={memory.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <span className="text-lg">{emotionToEmoji(memory.emotion)}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-sm">{memory.title}</h3>
                {memory.description && (
                  <p className="text-xs text-snap-light-gray mt-1">
                    {memory.description}
                  </p>
                )}
                {memory.snap.caption && (
                  <p className="text-xs text-white/60 italic mt-1">
                    &ldquo;{memory.snap.caption}&rdquo;
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="w-3 h-3 text-snap-light-gray" />
                  <span className="text-[10px] text-snap-light-gray">
                    {timeAgo(new Date(memory.createdAt))}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function emotionToEmoji(emotion: string): string {
  const map: Record<string, string> = {
    happy: "😊",
    excited: "🤩",
    peaceful: "🕊️",
    nostalgic: "🌅",
    proud: "🏆",
    funny: "😂",
    romantic: "💕",
    adventurous: "🚀",
    creative: "🎨",
  };
  return map[emotion] || "✨";
}
