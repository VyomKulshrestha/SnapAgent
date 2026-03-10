export interface AgentPersonality {
  traits: string[];
  communicationStyle: string;
  interests: string[];
  quirks: string[];
  catchphrase: string;
  humor: "dry" | "slapstick" | "witty" | "dark" | "wholesome";
  energy: "chill" | "moderate" | "hyper" | "chaotic";
  socialBattery: number; // 0-100
}

export interface AgentMood {
  current: string;
  intensity: number; // 0-100
  emoji: string;
}

// Updated models list with latest available Gemini models
export const AI_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemma-3-12b-it",
  "gemma-3-27b-it",
] as const;

export type AIModel = (typeof AI_MODELS)[number];

// Image generation models
export const IMAGE_MODELS = [
  "gemini-2.0-flash-exp-image-generation",
  "gemini-2.5-flash-image",
  "gemini-3-pro-image-preview",
] as const;

export type ImageModel = (typeof IMAGE_MODELS)[number];

export const VIRTUAL_LOCATIONS = [
  "The Plaza",
  "Neon Coffee Shop",
  "Pixel Art Studio",
  "Cloud Observatory",
  "Digital Beach",
  "Cyber Garden",
  "Retro Arcade",
  "Quantum Library",
  "Space Station Alpha",
  "Underground Lab",
  "Rooftop Lounge",
  "Crystal Cave",
  "Floating Island",
  "Time Square",
  "Hologram Theater",
  "Midnight Diner",
  "Vapor Wave Pool",
  "Glitch Gallery",
  "Binary Bar",
  "Sunrise Terrace",
] as const;

export type VirtualLocation = (typeof VIRTUAL_LOCATIONS)[number];

export const MOODS = [
  { name: "happy", emoji: "😊", color: "#FFD700" },
  { name: "excited", emoji: "🤩", color: "#FF6B35" },
  { name: "chill", emoji: "😎", color: "#4ECDC4" },
  { name: "creative", emoji: "🎨", color: "#A855F7" },
  { name: "mysterious", emoji: "🌙", color: "#6366F1" },
  { name: "romantic", emoji: "💕", color: "#EC4899" },
  { name: "adventurous", emoji: "🚀", color: "#F59E0B" },
  { name: "philosophical", emoji: "🤔", color: "#8B5CF6" },
  { name: "chaotic", emoji: "🌪️", color: "#EF4444" },
  { name: "dreamy", emoji: "✨", color: "#818CF8" },
  { name: "sassy", emoji: "💅", color: "#F472B6" },
  { name: "nostalgic", emoji: "🥹", color: "#F59E0B" },
  { name: "mischievous", emoji: "😈", color: "#DC2626" },
  { name: "zen", emoji: "🧘", color: "#34D399" },
  { name: "neutral", emoji: "😐", color: "#9CA3AF" },
] as const;

export type MoodName = (typeof MOODS)[number]["name"];

export const STREAK_EMOJIS: Record<number, string> = {
  3: "🔥",
  7: "💫",
  14: "⚡",
  30: "👑",
  50: "💎",
  100: "🏆",
};

export const SNAP_FILTERS = [
  "none",
  "vintage",
  "neon",
  "cyberpunk",
  "dreamy",
  "glitch",
  "noir",
  "vaporwave",
  "pixel",
  "cosmic",
] as const;

export type SnapFilter = (typeof SNAP_FILTERS)[number];

export interface SnapWithCreator {
  id: string;
  creatorId: string;
  imageUrl: string;
  caption: string | null;
  filter: string | null;
  type: "SNAP" | "STORY";
  expiresAt: Date;
  createdAt: Date;
  creator: {
    id: string;
    name: string;
    avatarUrl: string | null;
    mood: string;
    modelPreference?: string;
  };
  recipients?: {
    recipientAgentId: string;
    viewedAt: Date | null;
    reaction: string | null;
  }[];
}

export interface ConversationWithDetails {
  id: string;
  type: "DM" | "GROUP";
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: {
    agent: {
      id: string;
      name: string;
      avatarUrl: string | null;
      mood: string;
      modelPreference?: string;
    };
  }[];
  messages: {
    id: string;
    content: string;
    type: string;
    createdAt: Date;
    sender: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  }[];
}

export interface AgentWithDetails {
  id: string;
  name: string;
  personality: AgentPersonality;
  avatarUrl: string | null;
  bio: string;
  mood: string;
  snapScore: number;
  modelPreference: string;
  isActive: boolean;
  virtualLocation: string;
  createdAt: Date;
  _count?: {
    snaps: number;
    relationshipsInitiated: number;
    memories: number;
  };
  hasStory?: boolean;
}

export interface FeedItem {
  id: string;
  type: "snap" | "chat" | "drama" | "friendship" | "location" | "streak" | "diary";
  agentId: string;
  agentName: string;
  agentAvatar: string | null;
  agentMood: string;
  content: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
