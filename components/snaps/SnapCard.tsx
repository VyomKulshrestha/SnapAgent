"use client";

import { useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const REACTION_EMOJIS = ["🔥", "❤️", "😂", "😮", "👀", "💅"];

const MOOD_EMOJIS: Record<string, string> = {
  happy: "😊", excited: "🤩", chill: "😎", creative: "🎨",
  mysterious: "🌙", romantic: "💕", adventurous: "🏔️",
  philosophical: "🤔", chaotic: "🌀", dreamy: "💫",
  sassy: "💅", nostalgic: "🥺", mischievous: "😈", zen: "🧘",
};

interface SnapCardProps {
  snap: {
    id: string;
    imageUrl: string;
    caption: string | null;
    createdAt: string;
    creator: {
      id: string;
      name: string;
      avatarUrl: string | null;
      mood: string;
    };
  };
}

export default function SnapCard({ snap }: SnapCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [sentReaction, setSentReaction] = useState<string | null>(null);
  const [reactionMessage, setReactionMessage] = useState("");

  const sendReaction = async (emoji: string) => {
    setSentReaction(emoji);
    setShowReactions(false);

    try {
      const res = await fetch(`/api/snaps/${snap.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reaction: emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setReactionMessage(data.message || `${snap.creator.name} noticed!`);
        setTimeout(() => setReactionMessage(""), 3000);
      }
    } catch {
      // Silent fail
    }
  };

  return (
    <div className="relative group">
      <Link href={`/agent/${snap.creator.id}`} className="block">
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-snap-card">
          <img
            src={snap.imageUrl}
            alt={snap.caption || "AI Snap"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Creator info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-snap-purple to-snap-pink flex items-center justify-center text-[8px] font-bold">
                {snap.creator.name[0]}
              </div>
              <span className="text-xs font-semibold truncate">
                {snap.creator.name}
              </span>
            </div>
            {snap.caption && (
              <p className="text-[10px] text-white/80 line-clamp-2">{snap.caption}</p>
            )}
            <p className="text-[9px] text-white/50 mt-0.5">
              {timeAgo(new Date(snap.createdAt))}
            </p>
          </div>

          {/* Mood indicator */}
          <div className="absolute top-2 right-2 text-sm">
            {MOOD_EMOJIS[snap.creator.mood] || "✨"}
          </div>

          {/* Sent reaction animation */}
          <AnimatePresence>
            {sentReaction && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 0 }}
                animate={{ scale: 1.5, opacity: 1, y: -30 }}
                exit={{ opacity: 0, y: -60, scale: 2 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 flex items-center justify-center text-4xl pointer-events-none"
              >
                {sentReaction}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>

      {/* Reaction button — visible on hover */}
      <button
        onClick={(e) => { e.preventDefault(); setShowReactions(!showReactions); }}
        className="absolute bottom-12 right-2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-snap-purple/70 z-10"
      >
        {sentReaction || "💬"}
      </button>

      {/* Reaction picker */}
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-20 right-0 bg-snap-dark/95 backdrop-blur-md rounded-2xl p-2 flex gap-1 z-20 border border-snap-gray shadow-xl"
          >
            {REACTION_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={(e) => { e.preventDefault(); sendReaction(emoji); }}
                className="w-9 h-9 rounded-xl hover:bg-snap-purple/30 flex items-center justify-center text-lg transition-colors hover:scale-125"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reaction notification */}
      <AnimatePresence>
        {reactionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -bottom-8 left-0 right-0 text-center text-[9px] text-snap-purple font-medium"
          >
            {reactionMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
