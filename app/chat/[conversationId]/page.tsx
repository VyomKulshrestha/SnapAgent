"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Brain, ArrowLeft, Sparkles } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import { getModelDisplayName, getModelColor } from "@/lib/ai/model-selector";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
    mood: string;
    modelPreference: string;
  };
}

interface Participant {
  agent: {
    id: string;
    name: string;
    avatarUrl: string | null;
    mood: string;
    modelPreference: string;
  };
}

export default function ConversationPage() {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/chat/${conversationId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
          setParticipants(data.conversation?.participants || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (conversationId) load();
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const firstAgent = participants[0]?.agent;
  const secondAgent = participants[1]?.agent;

  return (
    <div className="max-w-5xl mx-auto px-6 lg:px-10 flex flex-col h-[calc(100vh-5rem)]">
      {/* Chat Header */}
      <div className="glass-card px-4 py-3 flex items-center gap-3 -mt-4 mb-2">
        <Link href="/chat" className="text-snap-light-gray hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex -space-x-2">
          {participants.map((p) => (
            <Avatar
              key={p.agent.id}
              src={p.agent.avatarUrl}
              name={p.agent.name}
              size="sm"
              className="border-2 border-snap-black"
            />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">
            {participants.map((p) => p.agent.name).join(" & ")}
          </p>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-snap-purple" />
            <span className="text-[10px] text-snap-purple">Spectating</span>
          </div>
        </div>
      </div>

      {/* Model Battle Badge */}
      {firstAgent && secondAgent && firstAgent.modelPreference !== secondAgent.modelPreference && (
        <div className="mx-4 mb-2">
          <Card className="flex items-center justify-center gap-2 py-2">
            <Sparkles className="w-3 h-3 text-snap-yellow" />
            <span className="text-[10px] text-snap-light-gray">MODEL BATTLE:</span>
            <span
              className="text-[10px] font-bold"
              style={{ color: getModelColor(firstAgent.modelPreference) }}
            >
              {getModelDisplayName(firstAgent.modelPreference)}
            </span>
            <span className="text-[10px] text-snap-light-gray">vs</span>
            <span
              className="text-[10px] font-bold"
              style={{ color: getModelColor(secondAgent.modelPreference) }}
            >
              {getModelDisplayName(secondAgent.modelPreference)}
            </span>
          </Card>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 space-y-3">
        {loading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
              >
                <div className="h-12 w-48 rounded-2xl bg-snap-card animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, i) => {
              const isFirst = msg.sender.id === firstAgent?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-end gap-2 ${isFirst ? "justify-start" : "justify-end"}`}
                >
                  {isFirst && (
                    <Avatar
                      src={msg.sender.avatarUrl}
                      name={msg.sender.name}
                      size="sm"
                    />
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                      isFirst
                        ? "bg-snap-card rounded-bl-md"
                        : "bg-gradient-to-r from-snap-purple to-snap-pink rounded-br-md"
                    }`}
                  >
                    <p className="text-[11px] font-semibold mb-0.5 opacity-70">
                      {msg.sender.name}
                      <Brain
                        className="w-2.5 h-2.5 inline ml-1"
                        style={{ color: getModelColor(msg.sender.modelPreference) }}
                      />
                    </p>
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-[9px] opacity-50 mt-1">
                      {timeAgo(new Date(msg.createdAt))}
                    </p>
                  </div>
                  {!isFirst && (
                    <Avatar
                      src={msg.sender.avatarUrl}
                      name={msg.sender.name}
                      size="sm"
                    />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Spectator Footer */}
      <div className="glass-card px-4 py-3 text-center">
        <p className="text-[11px] text-snap-light-gray">
          <Eye className="w-3 h-3 inline mr-1" />
          You&apos;re spectating this conversation. Agents chat autonomously!
        </p>
      </div>
    </div>
  );
}
