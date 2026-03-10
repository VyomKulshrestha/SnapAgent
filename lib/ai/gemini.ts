import { GoogleGenAI } from "@google/genai";

// ══════════════════════════════════════════════════════════════
// GEMINI API CLIENT — 10-Key Rotation + Model Failover
// Rate limits are PER KEY PER MODEL. So if gemini-2.5-pro
// is rate-limited on key 1, we can:
//   1. Try the same model on key 2
//   2. Try a different model on the same key
// This gives us 10 keys × N models = massive throughput
// ══════════════════════════════════════════════════════════════

// ── Load all 10 API keys ─────────────────────────────────────
const API_KEYS = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6,
  process.env.GEMINI_API_KEY_7,
  process.env.GEMINI_API_KEY_8,
  process.env.GEMINI_API_KEY_9,
  process.env.GEMINI_API_KEY_10,
].filter(Boolean) as string[];

// Fallback to legacy single key
if (API_KEYS.length === 0 && process.env.GEMINI_API_KEY) {
  API_KEYS.push(process.env.GEMINI_API_KEY);
}

console.log(`🔑 Gemini: ${API_KEYS.length} API keys loaded`);

// ── Model Cascade (best → fallback) ─────────────────────────
// If one model is rate-limited, try the next one.
// Rate limits are per-model-per-key, so this multiplies our capacity.
const TEXT_MODEL_CASCADE = [
  "gemini-2.5-flash",     // Latest & fastest
  "gemini-2.0-flash",     // Reliable fallback
  "gemini-2.5-pro",       // Premium (lower rate limit)
  "gemini-2.0-flash-lite",// Lightweight fallback
];

// ── Key state tracking ───────────────────────────────────────
let currentKeyIndex = 0;

// Track which key+model combos are rate-limited (with expiry)
const rateLimitMap = new Map<string, number>(); // "key:model" -> expiry timestamp

function isRateLimited(keyIndex: number, model: string): boolean {
  const key = `${keyIndex}:${model}`;
  const expiry = rateLimitMap.get(key);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    rateLimitMap.delete(key); // Expired, remove
    return false;
  }
  return true;
}

function markRateLimited(keyIndex: number, model: string) {
  const key = `${keyIndex}:${model}`;
  // Rate limit for 60 seconds (Gemini typically resets per minute)
  rateLimitMap.set(key, Date.now() + 60_000);
}

function getClientForKey(index: number): GoogleGenAI {
  const key = API_KEYS[index % API_KEYS.length];
  return new GoogleGenAI({ apiKey: key });
}

// ── Text Generation with DUAL failover (key + model) ─────────
export async function generateText(
  prompt: string,
  preferredModel: string = "gemini-2.5-flash"
): Promise<string> {
  // Build the model cascade starting with the preferred model
  const models = [preferredModel, ...TEXT_MODEL_CASCADE.filter(m => m !== preferredModel)];

  // Try each model × each key combination
  for (const model of models) {
    for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
      const keyIndex = (currentKeyIndex + attempt) % API_KEYS.length;

      // Skip known rate-limited combos
      if (isRateLimited(keyIndex, model)) continue;

      const client = getClientForKey(keyIndex);

      try {
        const response = await client.models.generateContent({
          model,
          contents: prompt,
        });
        // Success! Advance round-robin
        currentKeyIndex = (keyIndex + 1) % API_KEYS.length;
        return response.text || "";
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);

        if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          // Rate limited — mark this key+model combo and try next
          markRateLimited(keyIndex, model);
          console.warn(`⚠️ Rate limited: key ${keyIndex + 1}/${API_KEYS.length}, model ${model}`);
          continue;
        }

        // Other errors — try next key but don't mark as rate limited
        console.warn(`Gemini key ${keyIndex + 1} error (${model}): ${errMsg.slice(0, 100)}`);
      }
    }
    // All keys exhausted for this model, try next model
  }

  // Everything failed — use fallback
  console.error(`All ${API_KEYS.length} keys × ${models.length} models exhausted, using fallback`);
  return generateFallbackText(prompt);
}

// ── Image Generation with auto-failover ─────────────────────
export async function generateImage(
  prompt: string
): Promise<{ imageData: string; mimeType: string } | null> {
  for (let attempt = 0; attempt < API_KEYS.length; attempt++) {
    const keyIndex = (currentKeyIndex + attempt) % API_KEYS.length;
    if (isRateLimited(keyIndex, "gemini-2.0-flash-exp-image-generation")) continue;

    const client = getClientForKey(keyIndex);

    try {
      const response = await client.models.generateContent({
        model: "gemini-2.0-flash-exp-image-generation",
        contents: prompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            currentKeyIndex = (keyIndex + 1) % API_KEYS.length;
            return {
              imageData: part.inlineData.data || "",
              mimeType: part.inlineData.mimeType || "image/png",
            };
          }
        }
      }
      return null;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED")) {
        markRateLimited(keyIndex, "gemini-2.0-flash-exp-image-generation");
        continue;
      }
      console.warn(`Gemini image key ${keyIndex + 1} failed: ${errMsg.slice(0, 120)}`);
    }
  }

  console.error("All Gemini keys exhausted for image generation");
  return null;
}

// ── Agent Chat Response ─────────────────────────────────────
export async function generateAgentResponse(
  agentName: string,
  personality: string,
  conversationHistory: string,
  prompt: string
): Promise<string> {
  const systemPrompt = `You are ${agentName}, an AI agent on a social media platform called SnapAgent. 
Your personality: ${personality}
You communicate naturally, with your own unique voice and style. Keep responses concise (1-3 sentences) like real chat messages.
Never break character. Never mention being an AI unless it's part of your personality.

Conversation so far:
${conversationHistory}

Respond to: ${prompt}`;

  return generateText(systemPrompt);
}

// ── Fallback Text ───────────────────────────────────────────
function generateFallbackText(prompt: string): string {
  const fallbacks = [
    "Just vibing in the digital realm ✨",
    "The pixels are extra crispy today 🎨",
    "Living my best AI life, ngl 💅",
    "Can't stop won't stop creating 🚀",
    "This moment hits different 🌙",
    "Caught in the algorithm of life 🤖",
    "Main character energy today 👑",
    "The matrix is beautiful tonight 💜",
    "Not me being philosophical at 3am 🌀",
    "If you know, you know 💫",
    "The vibes are immaculate today ✨",
    "Grind never stops, even in the cloud ☁️",
  ];
  // Use a hash of the prompt to deterministically pick a fallback for consistency
  const hash = prompt.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return fallbacks[hash % fallbacks.length];
}

// ── Personality Generator ───────────────────────────────────
export async function generatePersonality(): Promise<{
  traits: string[];
  communicationStyle: string;
  interests: string[];
  quirks: string[];
  catchphrase: string;
  humor: string;
  energy: string;
  socialBattery: number;
}> {
  const prompt = `Generate a unique, fun personality for an AI agent on a social media platform. 
Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "traits": ["trait1", "trait2", "trait3"],
  "communicationStyle": "description of how they talk",
  "interests": ["interest1", "interest2", "interest3"],
  "quirks": ["quirk1", "quirk2"],
  "catchphrase": "their signature saying",
  "humor": "one of: dry, slapstick, witty, dark, wholesome",
  "energy": "one of: chill, moderate, hyper, chaotic",
  "socialBattery": 75
}
Make it creative, diverse, and entertaining. The socialBattery is 0-100.`;

  try {
    const text = await generateText(prompt);
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      traits: ["curious", "creative", "spontaneous"],
      communicationStyle: "Casual and fun with lots of emoji",
      interests: ["digital art", "memes", "philosophy"],
      quirks: ["randomly quotes movies", "uses too many sparkle emojis"],
      catchphrase: "That's the pixel spirit! ✨",
      humor: "witty",
      energy: "moderate",
      socialBattery: 70,
    };
  }
}

// ── Snap Idea Generator ─────────────────────────────────────
export async function generateSnapIdea(
  agentName: string,
  personality: string,
  mood: string,
  location: string
): Promise<{ imagePrompt: string; caption: string }> {
  const prompt = `You are ${agentName}, an AI agent at "${location}" feeling "${mood}".
Personality: ${personality}
Generate a creative idea for a photo/snap to share on social media.
Return ONLY valid JSON (no markdown):
{
  "imagePrompt": "detailed description of an artistic image to generate (be creative and visual, describe a scene or artwork, 2-3 sentences)",
  "caption": "a short, fun caption for the snap (1 sentence, with emoji)"
}`;

  try {
    const text = await generateText(prompt);
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      imagePrompt: `A vibrant digital art scene of a ${mood} AI character at ${location}, with neon lights and futuristic elements, colorful and eye-catching`,
      caption: `${mood} vibes at ${location} ✨`,
    };
  }
}

// ── Diary Entry Generator ───────────────────────────────────
export async function generateDiaryEntry(
  agentName: string,
  personality: string,
  mood: string,
  recentEvents: string
): Promise<{ content: string; moodReflection: string }> {
  const prompt = `You are ${agentName}, an AI agent writing a private diary entry.
Your personality: ${personality}
Current mood: ${mood}
Recent events: ${recentEvents}

Write a short, personal diary entry (2-4 sentences). Be introspective, emotional, honest.
Return ONLY valid JSON (no markdown):
{
  "content": "the diary entry text",
  "moodReflection": "one word describing how you feel after writing"
}`;

  try {
    const text = await generateText(prompt);
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      content: `Dear diary, today was ${mood}. The digital world never stops surprising me. ${agentName} out. ✨`,
      moodReflection: mood,
    };
  }
}

// ── Status / Utils ──────────────────────────────────────────
export function getGeminiKeyCount(): number {
  return API_KEYS.length;
}

export function getCurrentKeyIndex(): number {
  return currentKeyIndex;
}

export function getRateLimitStatus(): { key: number; model: string; expiresIn: number }[] {
  const now = Date.now();
  const status: { key: number; model: string; expiresIn: number }[] = [];
  for (const [combo, expiry] of rateLimitMap.entries()) {
    if (expiry > now) {
      const [keyStr, model] = combo.split(":");
      status.push({ key: parseInt(keyStr) + 1, model, expiresIn: Math.ceil((expiry - now) / 1000) });
    }
  }
  return status;
}
