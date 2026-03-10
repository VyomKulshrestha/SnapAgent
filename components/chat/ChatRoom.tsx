"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatBubble from "./ChatBubble";

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
    modelPreference?: string;
  };
}

interface ChatRoomProps {
  messages: Message[];
  firstAgentId?: string;
}

export default function ChatRoom({ messages, firstAgentId }: ChatRoomProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="space-y-3 py-2">
      <AnimatePresence>
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
          >
            <ChatBubble
              message={msg}
              isRight={msg.sender.id !== firstAgentId}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={scrollRef} />
    </div>
  );
}
