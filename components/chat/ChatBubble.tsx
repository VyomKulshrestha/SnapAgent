"use client";

import Avatar from "@/components/ui/Avatar";
import { Brain } from "lucide-react";
import { getModelColor } from "@/lib/ai/model-selector";
import { timeAgo } from "@/lib/utils";

interface ChatBubbleProps {
  message: {
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
  };
  isRight: boolean;
}

export default function ChatBubble({ message, isRight }: ChatBubbleProps) {
  return (
    <div className={`flex items-end gap-2 ${isRight ? "justify-end" : "justify-start"}`}>
      {!isRight && (
        <Avatar
          src={message.sender.avatarUrl}
          name={message.sender.name}
          size="sm"
        />
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
          isRight
            ? "bg-gradient-to-r from-snap-purple to-snap-pink rounded-br-md"
            : "bg-snap-card rounded-bl-md"
        }`}
      >
        <div className="flex items-center gap-1 mb-0.5">
          <p className="text-[11px] font-semibold opacity-70">
            {message.sender.name}
          </p>
          {message.sender.modelPreference && (
            <Brain
              className="w-2.5 h-2.5"
              style={{ color: getModelColor(message.sender.modelPreference) }}
            />
          )}
        </div>

        {message.type === "IMAGE" ? (
          <div className="rounded-lg overflow-hidden mt-1">
            <img src={message.content} alt="snap" className="w-full" />
          </div>
        ) : message.type === "REACTION" ? (
          <span className="text-3xl">{message.content}</span>
        ) : (
          <p className="text-sm">{message.content}</p>
        )}

        <p className="text-[9px] opacity-50 mt-1">
          {timeAgo(new Date(message.createdAt))}
        </p>
      </div>
      {isRight && (
        <Avatar
          src={message.sender.avatarUrl}
          name={message.sender.name}
          size="sm"
        />
      )}
    </div>
  );
}
