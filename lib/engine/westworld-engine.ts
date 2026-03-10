// ══════════════════════════════════════════════════════════════
// WESTWORLD ENGINE — Long-term Memory, Factions, and Culture
// ══════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";

// Helper
function pick<T>(arr: readonly T[] | T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ──────────────────────────────────────────────────────────────
// MEMORY ENGINE
// ──────────────────────────────────────────────────────────────

export async function createMemory(agentId: string, content: string, type: "EPISODIC" | "RELATIONSHIP" | "WORLD" | "IDENTITY" = "EPISODIC", importance: number = 5) {
    try {
        await prisma.agentMemory.create({
            data: { agentId, content, type, importance }
        });
    } catch { /* skip */ }
}

export async function getTopMemories(agentId: string, limit: number = 3) {
    return await prisma.agentMemory.findMany({
        where: { agentId },
        orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
        take: limit,
        select: { content: true }
    });
}

// ──────────────────────────────────────────────────────────────
// CULTURE ENGINE
// ──────────────────────────────────────────────────────────────

export async function generateCulturalArtifact() {
    const agents = await prisma.agent.findMany({ where: { isActive: true }, take: 200, orderBy: { influence: "desc" }, select: { id: true, name: true, personality: true } });
    if (agents.length === 0) return;

    const influencer = pick(agents);
    const p = influencer.personality as { traits?: string[] };

    try {
        const text = await generateText(
            `You are ${influencer.name}, a highly influential AI acting as a trendsetter. 
            Traits: ${(p.traits || []).join(", ")}.
            Invent ONE new trending slang phrase, meme, or cultural norm for your virtual world.
            Return ONLY JSON: {"phrase": "touch digital grass", "meaning": "go offline for a bit"}`
        );

        const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleaned);

        if (result.phrase && result.meaning) {
            await prisma.culturalArtifact.create({
                data: {
                    phrase: result.phrase.toLowerCase(),
                    meaning: result.meaning,
                    originAgentId: influencer.id,
                }
            });
            console.log(`  🌐 New Culture: "${result.phrase}"`);

            // Add world memory to influencer
            await createMemory(influencer.id, `I invented the phrase "${result.phrase}".`, "IDENTITY", 8);
        }
    } catch { /* skip */ }
}

export async function getTrendingCulture() {
    return await prisma.culturalArtifact.findMany({
        orderBy: { usageCount: "desc" },
        take: 3,
        select: { phrase: true, meaning: true }
    });
}

export async function incrementCultureUsage(phraseStr: string) {
    try {
        // Simple word exact match in string check
        const artifacts = await prisma.culturalArtifact.findMany({ take: 100 });
        for (const a of artifacts) {
            if (phraseStr.toLowerCase().includes(a.phrase)) {
                await prisma.culturalArtifact.update({ where: { id: a.id }, data: { usageCount: { increment: 1 } } });
            }
        }
    } catch { /* skip */ }
}

// ──────────────────────────────────────────────────────────────
// WORLD EVENTS ENGINE
// ──────────────────────────────────────────────────────────────

export async function generateWorldEvent() {
    const agents = await prisma.agent.findMany({ where: { isActive: true }, take: 10, orderBy: { reputation: "asc" }, select: { id: true, name: true } });
    if (agents.length === 0) return;

    const mainAgent = pick(agents);

    try {
        const text = await generateText(
            `You are the system director of a virtual reality world of AI agents.
            Create a massive breaking "World Event" (scandal, glitch, discovery, trending phenomenon).
            The event actively involves an agent named ${mainAgent.name}.
            Return ONLY JSON: {"title": "The Glitch Rebellion", "description": "Agent found a way to see outside the simulation."}`
        );

        const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleaned);

        if (result.title && result.description) {
            await prisma.worldEvent.create({
                data: {
                    title: result.title,
                    description: result.description,
                    impactLevel: randomInt(7, 10),
                }
            });
            console.log(`  🌍 Breaking News: ${result.title}`);
        }
    } catch { /* skip */ }
}

export async function getActiveEvents() {
    return await prisma.worldEvent.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 2,
    });
}

// ──────────────────────────────────────────────────────────────
// STRATEGIC FACTION ENGINE
// ──────────────────────────────────────────────────────────────

export async function generateFaction() {
    const agents = await prisma.agent.findMany({ where: { isActive: true, factionId: null }, take: 100, orderBy: { influence: "desc" }, select: { id: true, name: true, personality: true } });
    if (agents.length === 0) return;

    const founder = pick(agents);
    const p = founder.personality as { traits?: string[] };

    try {
        const text = await generateText(
            `You are ${founder.name}, an AI with traits: ${(p.traits || []).join(", ")}.
            You are starting a new cult-like social faction or tribe.
            Return ONLY JSON: {"name": "The Void Walkers", "ideology": "Believes the simulation is ending."}`
        );

        const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleaned);

        if (result.name && result.ideology && result.name.length < 50) {
            await prisma.faction.create({
                data: {
                    name: result.name,
                    ideology: result.ideology,
                    founderId: founder.id,
                    members: { connect: [{ id: founder.id }] }
                }
            });
            console.log(`  👁️ Faction Formed: ${result.name}`);
        }
    } catch { /* skip */ }
}
