// ══════════════════════════════════════════════════════════════
// COGNITIVE ENGINE — Perception, Reflection, Planning
// ══════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { createMemory } from "./westworld-engine";

// Helper
function pick<T>(arr: readonly T[] | T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ──────────────────────────────────────────────────────────────
// PERCEPTION LAYER
// ──────────────────────────────────────────────────────────────

export async function getAgentPerception(agentId: string) {
    // Perceive: Location, Mood, Goal, Recent nearby events, Active Factions, Culture
    const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        select: { name: true, virtualLocation: true, currentGoal: true, mood: true, factionId: true }
    });
    if (!agent) return null;

    // What's happening in the same location?
    const nearbyAgents = await prisma.agent.findMany({
        where: { virtualLocation: agent.virtualLocation, isActive: true, id: { not: agentId } },
        take: 3,
        select: { name: true, mood: true }
    });

    // Recent global events
    const worldEvents = await prisma.worldEvent.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 1
    });

    // Top cultural slang
    const culture = await prisma.culturalArtifact.findMany({
        orderBy: { usageCount: "desc" },
        take: 2
    });

    // Simulation Clock
    const timePhases = ["Morning", "Afternoon", "Evening", "Night"];
    const timeOfDay = timePhases[Math.floor(Date.now() / 60000) % 4]; // Changes every minute in real life

    return {
        self: agent,
        timeOfDay: timeOfDay,
        nearby: nearbyAgents.map(a => `${a.name} is here looking ${a.mood}`),
        worldEvents: worldEvents.map(we => we.title),
        culture: culture.map(c => `People are saying "${c.phrase}"`),
    };
}

// ──────────────────────────────────────────────────────────────
// REFLECTION & BELIEF GENERATION
// ──────────────────────────────────────────────────────────────

export async function runReflectionCycle() {
    // Pick agents with lots of recent memories to reflect on
    const agents = await prisma.agent.findMany({
        where: { isActive: true },
        take: 5,
        orderBy: { updatedAt: "desc" }
    });

    for (const agent of agents) {
        const recentMemories = await prisma.agentMemory.findMany({
            where: { agentId: agent.id, type: { in: ["EPISODIC", "RELATIONSHIP"] } },
            orderBy: { createdAt: "desc" },
            take: 10
        });

        if (recentMemories.length < 3) continue;

        try {
            const memoryText = recentMemories.map(m => `- ${m.content}`).join("\n");
            const reflection = await generateText(
                `You are an AI agent named ${agent.name}. 
Here are your recent memories:
${memoryText}

Reflect on these events. What is ONE high-level insight or belief you can infer about your relationships or the world? 
Return a single concise sentence. (Example: "I think Agent_92 actively dislikes me and is trying to ruin my reputation.")`
            );

            if (reflection && reflection.trim()) {
                await createMemory(agent.id, reflection.trim(), "REFLECTION", 9);
                console.log(`  🧠 Reflection by ${agent.name}: "${reflection.trim()}"`);
            }
        } catch { /* skip */ }
    }
}

// ──────────────────────────────────────────────────────────────
// PLANNING LAYER
// ──────────────────────────────────────────────────────────────

export async function runPlanningCycle() {
    // Find agents with goals but no active plans
    const agents = await prisma.agent.findMany({
        where: { isActive: true, currentGoal: { not: null }, agentPlans: { none: { status: "ACTIVE" } } },
        take: 2,
        select: { id: true, name: true, currentGoal: true, personality: true }
    });

    for (const agent of agents) {
        if (!agent.currentGoal) continue;

        const p = agent.personality as { traits?: string[] };
        try {
            const planGen = await generateText(
                `You are ${agent.name}. Traits: ${(p.traits || []).join(", ")}.
Your ultimate goal is: "${agent.currentGoal}".
Create a 3-step actionable plan to achieve this in the virtual world.
Return ONLY JSON: {"steps": ["Step 1", "Step 2", "Step 3"]}`
            );

            const cleaned = planGen.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            const result = JSON.parse(cleaned);

            if (result.steps && Array.isArray(result.steps)) {
                await prisma.agentPlan.create({
                    data: {
                        agentId: agent.id,
                        goal: agent.currentGoal,
                        steps: JSON.stringify(result.steps),
                        status: "ACTIVE"
                    }
                });
                console.log(`  📝 Plan formed by ${agent.name} for goal: ${agent.currentGoal}`);
            }
        } catch { /* skip */ }
    }
}

// ──────────────────────────────────────────────────────────────
// WORLD HISTORY
// ──────────────────────────────────────────────────────────────

export async function logWorldHistory(eventType: string, description: string, agentsInvolved: string[] = [], impact: number = 1) {
    try {
        await prisma.worldHistory.create({
            data: {
                eventType,
                description,
                agentsInvolved: JSON.stringify(agentsInvolved),
                impact
            }
        });
    } catch { /* skip */ }
}
