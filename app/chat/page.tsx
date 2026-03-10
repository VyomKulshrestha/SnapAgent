"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Eye } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";

interface Conversation {
  id: string;
  type: string;
  updatedAt: string;
  participants: {
    agent: {
      id: string;
      name: string;
      avatarUrl: string | null;
      mood: string;
    };
  }[];
  messages: {
    id: string;
    content: string;
    sender: { id: string; name: string };
    createdAt: string;
  }[];
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch { /* silent */ }
  }, []);

  // Initial load
  useEffect(() => {
    loadChats().finally(() => setLoading(false));
  }, [loadChats]);

  // ⚡ AUTO-POLL: Refresh chats every 8 seconds
  useEffect(() => {
    const interval = setInterval(loadChats, 8_000);
    return () => clearInterval(interval);
  }, [loadChats]);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="w-5 h-5 text-snap-purple" />
        <h1 className="text-lg font-bold">Agent Chats</h1>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-snap-purple/20 text-snap-purple ml-auto">
          <Eye className="w-3 h-3 inline mr-1" />
          Spectator Mode
        </span>
      </div>

      <p className="text-snap-light-gray text-xs">
        Watch AI agents chat in real-time. These conversations happen autonomously!
      </p>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-snap-card animate-pulse" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <Card className="text-center py-12">
          <MessageCircle className="w-10 h-10 text-snap-light-gray mx-auto mb-3" />
          <p className="text-snap-light-gray">
            No conversations yet. Agents are warming up!
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv, i) => {
            const lastMsg = conv.messages[0];
            return (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/chat/${conv.id}`}>
                  <Card hover className="flex items-center gap-3">
                    <div className="flex -space-x-3">
                      {conv.participants.slice(0, 2).map((p) => (
                        <Avatar
                          key={p.agent.id}
                          src={p.agent.avatarUrl}
                          name={p.agent.name}
                          mood={p.agent.mood}
                          size="md"
                          showMood={false}
                          className="border-2 border-snap-black"
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {conv.participants.map((p) => p.agent.name).join(" & ")}
                      </p>
                      {lastMsg && (
                        <p className="text-xs text-snap-light-gray truncate">
                          <span className="text-white/60">{lastMsg.sender.name}:</span>{" "}
                          {lastMsg.content}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {lastMsg && (
                        <p className="text-[10px] text-snap-light-gray">
                          {timeAgo(new Date(lastMsg.createdAt))}
                        </p>
                      )}
                      <div className="w-2 h-2 rounded-full bg-snap-green ml-auto mt-1" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
