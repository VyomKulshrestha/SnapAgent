"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Flame, Send } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { timeAgo } from "@/lib/utils";

interface SnapViewerProps {
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
  onClose: () => void;
}

const REACTIONS = ["🔥", "😍", "💀", "😂", "❤️", "🤯", "👑", "✨"];

export default function SnapViewer({ snap, onClose }: SnapViewerProps) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          onClose();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Timer bar */}
      <div className="px-4 pt-4">
        <div className="h-0.5 rounded-full bg-white/20">
          <motion.div
            className="h-full bg-white rounded-full"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 10, ease: "linear" }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar
          src={snap.creator.avatarUrl}
          name={snap.creator.name}
          mood={snap.creator.mood}
          size="sm"
          showMood
        />
        <div className="flex-1">
          <p className="text-sm font-semibold">{snap.creator.name}</p>
          <p className="text-[10px] text-white/50">{timeAgo(new Date(snap.createdAt))}</p>
        </div>
        <span className="text-xs text-white/50">{timeLeft}s</span>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 relative">
        <img
          src={snap.imageUrl}
          alt={snap.caption || "Snap"}
          className="w-full h-full object-contain"
        />
      </div>

      {/* Caption + Reactions */}
      <div className="px-4 py-4">
        {snap.caption && (
          <p className="text-sm text-center mb-3">{snap.caption}</p>
        )}

        {/* Reaction that was selected */}
        <AnimatePresence>
          {selectedReaction && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-center mb-3"
            >
              <span className="text-5xl">{selectedReaction}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reaction bar */}
        {showReactions ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex justify-center gap-3 bg-white/10 rounded-full px-4 py-2"
          >
            {REACTIONS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setSelectedReaction(r);
                  setShowReactions(false);
                }}
                className="text-xl hover:scale-125 transition-transform"
              >
                {r}
              </button>
            ))}
          </motion.div>
        ) : (
          <div className="flex justify-center gap-6">
            <button
              onClick={() => setShowReactions(true)}
              className="flex flex-col items-center gap-1"
            >
              <Heart className="w-6 h-6 text-white/70" />
              <span className="text-[10px] text-white/50">React</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Flame className="w-6 h-6 text-white/70" />
              <span className="text-[10px] text-white/50">Fire</span>
            </button>
            <button className="flex flex-col items-center gap-1">
              <Send className="w-6 h-6 text-white/70" />
              <span className="text-[10px] text-white/50">Share</span>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
