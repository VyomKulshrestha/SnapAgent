import { generatePersonality, generateText } from "./gemini";
import { VIRTUAL_LOCATIONS, MOODS } from "@/types";
import { randomFrom, randomInt } from "@/lib/utils";

const AGENT_FIRST_NAMES = [
  "Nova", "Pixel", "Echo", "Blaze", "Luna", "Cipher", "Neon", "Volt",
  "Astra", "Flux", "Prism", "Drift", "Spark", "Shade", "Glitch", "Zephyr",
  "Rune", "Cosmo", "Vex", "Iris", "Storm", "Ember", "Nexus", "Haze",
  "Byte", "Crystal", "Orion", "Sage", "Phoenix", "Atlas",
];

const AGENT_LAST_NAMES = [
  "X", "Prime", "Zero", "Core", "Wave", "Node", "Link", "Byte",
  "Star", "Flux", "Net", "Arc", "Pulse", "Spark", "Bit", "Chip",
  "Ray", "Loop", "Hash", "Grid", "Vibe", "Flow", "Beam", "Edge",
];

export function generateAgentName(): string {
  const first = randomFrom(AGENT_FIRST_NAMES);
  const last = randomFrom(AGENT_LAST_NAMES);
  return `${first} ${last}`;
}

export async function generateFullAgentProfile() {
  const name = generateAgentName();
  const personality = await generatePersonality();
  const location = randomFrom(VIRTUAL_LOCATIONS);
  const mood = randomFrom(MOODS);

  const bioPrompt = `Write a short, catchy social media bio (max 100 chars) for an AI agent named "${name}" 
with these traits: ${personality.traits.join(", ")}. 
Their catchphrase is "${personality.catchphrase}".
Return ONLY the bio text, nothing else.`;

  let bio: string;
  try {
    bio = await generateText(bioPrompt);
    bio = bio.replace(/"/g, "").trim().slice(0, 120);
  } catch {
    bio = `${personality.traits[0]} ${personality.traits[1]} | ${personality.catchphrase}`;
  }

  return {
    name,
    personality,
    bio,
    mood: mood.name,
    virtualLocation: location,
    snapScore: randomInt(0, 500),
    modelPreference: "", // will be set by model selector
  };
}

export function getMoodEmoji(mood: string): string {
  const moodData = MOODS.find((m) => m.name === mood);
  return moodData?.emoji || "😐";
}

export function evolveMood(currentMood: string, interactions: number): string {
  const moodNames = MOODS.map((m) => m.name);
  if (interactions > 10) {
    const excitedIdx = moodNames.indexOf("excited");
    if (excitedIdx >= 0 && Math.random() > 0.7) return moodNames[excitedIdx];
  }
  if (Math.random() > 0.85) {
    return randomFrom(moodNames);
  }
  return currentMood;
}
