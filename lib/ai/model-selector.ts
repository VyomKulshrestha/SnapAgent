import { AI_MODELS, type AIModel } from "@/types";

// All models are now Gemini-based (latest models available via API)
const GEMINI_TEXT_MODELS: AIModel[] = [
  "gemini-2.0-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
  "gemma-3-12b-it",
  "gemma-3-27b-it",
];

export async function selectRandomModel(): Promise<AIModel> {
  // Weighted selection — bias toward faster/cheaper models for autonomy
  const weighted: { model: AIModel; weight: number }[] = [
    { model: "gemini-2.0-flash", weight: 25 },
    { model: "gemini-2.5-flash", weight: 20 },
    { model: "gemini-2.0-flash-lite", weight: 15 },
    { model: "gemini-2.5-flash-lite", weight: 10 },
    { model: "gemini-2.5-pro", weight: 8 },
    { model: "gemini-3-flash-preview", weight: 8 },
    { model: "gemini-3-pro-preview", weight: 5 },
    { model: "gemma-3-12b-it", weight: 5 },
    { model: "gemma-3-27b-it", weight: 4 },
  ];

  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { model, weight } of weighted) {
    random -= weight;
    if (random <= 0) return model;
  }

  return "gemini-2.0-flash";
}

export function isGeminiModel(model: string): boolean {
  return model.startsWith("gemini") || model.startsWith("gemma");
}

export function isOllamaModel(model: string): boolean {
  return false; // All models now go through Gemini API
}

export function getModelDisplayName(model: string): string {
  const names: Record<string, string> = {
    "gemini-2.0-flash": "Gemini 2.0 Flash",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-2.5-pro": "Gemini 2.5 Pro",
    "gemini-2.0-flash-lite": "Gemini 2.0 Flash Lite",
    "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
    "gemini-3-flash-preview": "Gemini 3 Flash",
    "gemini-3-pro-preview": "Gemini 3 Pro",
    "gemma-3-12b-it": "Gemma 3 12B",
    "gemma-3-27b-it": "Gemma 3 27B",
  };
  return names[model] || model;
}

export function getModelColor(model: string): string {
  const colors: Record<string, string> = {
    "gemini-2.0-flash": "#4285F4",
    "gemini-2.5-flash": "#34A853",
    "gemini-2.5-pro": "#FBBC04",
    "gemini-2.0-flash-lite": "#8AB4F8",
    "gemini-2.5-flash-lite": "#81C995",
    "gemini-3-flash-preview": "#F472B6",
    "gemini-3-pro-preview": "#A855F7",
    "gemma-3-12b-it": "#EA580C",
    "gemma-3-27b-it": "#DC2626",
  };
  return colors[model] || "#9CA3AF";
}

export function getModelDescription(model: string): string {
  const desc: Record<string, string> = {
    "gemini-2.0-flash": "Fast & reliable. The workhorse.",
    "gemini-2.5-flash": "Next-gen speed. Smarter, faster.",
    "gemini-2.5-pro": "Premium brain. Deep reasoning.",
    "gemini-2.0-flash-lite": "Lightweight & quick responses.",
    "gemini-2.5-flash-lite": "Efficient with a personality punch.",
    "gemini-3-flash-preview": "Cutting-edge preview. Experimental.",
    "gemini-3-pro-preview": "Bleeding edge intelligence.",
    "gemma-3-12b-it": "Open-source spirit. Unique voice.",
    "gemma-3-27b-it": "Open-source powerhouse. Bold takes.",
  };
  return desc[model] || "AI model";
}

export function getModelTier(model: string): "fast" | "standard" | "premium" | "experimental" {
  if (model.includes("lite")) return "fast";
  if (model.includes("pro")) return "premium";
  if (model.includes("preview") || model.includes("3-")) return "experimental";
  return "standard";
}
