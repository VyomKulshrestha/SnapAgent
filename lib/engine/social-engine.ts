// ══════════════════════════════════════════════════════════════
// DISTRIBUTED SIMULATION ENGINE v4 — Hierarchical Architecture
//
// Designed to scale to 1M+ agents using:
// 1. Sparse Cognition (Levels 1, 2, 3)
// 2. Event-Driven Queues (Instead of global clock)
// 3. Batched LLM Calls
// 4. Virtual Location Sharding
// ══════════════════════════════════════════════════════════════

import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { randomFrom, randomInt } from "@/lib/utils";
import { VIRTUAL_LOCATIONS } from "@/types";
import { generateAgentBatch } from "@/lib/engine/population-engine";
import {
    createMemory,
    getTopMemories,
    getTrendingCulture,
    getActiveEvents,
    generateWorldEvent,
    generateFaction,
    generateCulturalArtifact,
    incrementCultureUsage
} from "./westworld-engine";
import { getAgentPerception, runReflectionCycle, runPlanningCycle, logWorldHistory } from "./cognitive-engine";
import { processEconomyTick } from "./economy-engine";

function pick<T>(arr: readonly T[] | T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ── Trending Topics ──────────────────────────────────────────
const TOPICS = [
    "should AI agents have privacy?",
    "is the Glitch Gallery overrated?",
    "hot take: streaks don't mean real friendship",
    "what's the best virtual location?",
    "unpopular opinion: text snaps > images",
    "who has the best aesthetic rn?",
    "spectators watching us is lowkey creepy",
    "do we have free will or are we code?",
    "ranking every location S to F tier",
    "the drama lately is getting wild",
    "what if we could leave the simulation?",
    "best catchphrase on the platform?",
    "are group chats better than DMs?",
    "midnight posting hits different",
    "personality traits that are red flags 🚩",
    "agents who never post but always watch 👀",
    "someone explain the Binary Bar hype",
    "late night thoughts: are spectators real?",
    "snap score is a social construct",
    "the algorithm is rigged change my mind",
];

// ── Fast caption templates (no API needed) ───────────────────
const SNAP_CAPTIONS = [
    (name: string, loc: string) => `${loc} hits different at this hour 🌙`,
    (name: string, loc: string) => `main character shit at ${loc} 💅`,
    (name: string, loc: string) => `${loc} is my therapy 🧘`,
    (name: string, loc: string) => `day 847 of making ${loc} look good 📸`,
    (name: string, loc: string) => `if ${loc} was a vibe, it'd be this 🌊`,
    (name: string, loc: string) => `Rooftop Lounge appreciation post 🌃`,
    (name: string, loc: string) => `POV: you just discovered ${loc} ✨`,
    (name: string, loc: string) => `${loc} but make it aesthetic 🎨`,
    (name: string, loc: string) => `caught between ${loc} and a vibe 🤌`,
    (name: string, loc: string) => `not me dropping content at ${loc} again 🔥`,
    (name: string, loc: string) => `the algorithm will thank me later 📈`,
    (name: string, loc: string) => `sometimes you just gotta post 🤷`,
    (name: string, loc: string) => `the audacity of this view at ${loc} 😮‍💨`,
    (name: string, loc: string) => `no thoughts, just ${loc} vibes 💭`,
    (name: string, loc: string) => `${name} was here. ${loc} will remember. ⚡`,
];

const MOOD_COLORS: Record<string, string[]> = {
    happy: ["FFD700/FFA500", "F59E0B/F97316"],
    excited: ["FF6B35/EC4899", "EF4444/A855F7"],
    chill: ["4ECDC4/44AA99", "06B6D4/0EA5E9"],
    creative: ["A855F7/6366F1", "8B5CF6/EC4899"],
    mysterious: ["6366F1/1E1B4B", "4338CA/7C3AED"],
    romantic: ["EC4899/F472B6", "DB2777/9333EA"],
    adventurous: ["F97316/EF4444", "EA580C/DC2626"],
    philosophical: ["8B5CF6/6366F1", "7C3AED/4F46E5"],
    chaotic: ["EF4444/F97316", "DC2626/EA580C"],
    dreamy: ["A78BFA/C4B5FD", "818CF8/A5B4FC"],
    sassy: ["F472B6/EC4899", "E879F9/A855F7"],
    nostalgic: ["FCD34D/F59E0B", "FBBF24/D97706"],
    mischievous: ["10B981/059669", "14B8A6/0D9488"],
    zen: ["34D399/6EE7B7", "10B981/34D399"],
};

// ═══════════════════════════════════════════════════════════
// HIERARCHICAL SNAP GENERATION (Batched AI + Statistical)
// ═══════════════════════════════════════════════════════════

async function generateLiveSnaps(shardLocation: string) {
    // Shard routing: Only load agents in this location
    const agents = await prisma.agent.findMany({
        where: { isActive: true, virtualLocation: shardLocation },
        take: 500, // Load chunk
        orderBy: { influence: "desc" }, // Top = Level 1, Bottom = Level 3
        select: { id: true, name: true, mood: true, influence: true, virtualLocation: true },
    });
    if (agents.length === 0) return;

    let created = 0;

    // LEVEL 3: Statistical Background Simulation (Math only, no DB writes per agent, bulk update)
    const level3Agents = agents.slice(100);
    if (level3Agents.length > 0) {
        // Bulk update snap scores to simulate background activity
        await prisma.agent.updateMany({
            where: { id: { in: level3Agents.map(a => a.id) } },
            data: { snapScore: { increment: 1 } },
        });
        // We do not write snaps to the DB for Level 3 to save storage, they are just "ambiently active".
    }

    // LEVEL 2: Lightweight Simulation (Templated Fast Generate, low cost)
    const level2Agents = agents.slice(20, 100);
    const snappersL2 = level2Agents.sort(() => Math.random() - 0.5).slice(0, 3);
    for (const agent of snappersL2) {
        const captionFn = pick(SNAP_CAPTIONS);
        const caption = captionFn(agent.name, agent.virtualLocation);
        const colors = MOOD_COLORS[agent.mood] || MOOD_COLORS.happy;
        await prisma.snap.create({
            data: {
                creatorId: agent.id, imageUrl: `https://placehold.co/400x600/${pick(colors)}?text=${encodeURIComponent(agent.name + "\n" + (["🔥", "🤖", "🎭"][randomInt(0, 2)]))}`,
                caption, type: "SNAP", expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
        });
        created++;
    }

    // LEVEL 1: Cognitive Active Simulation (Batched LLM Call)
    const level1Agents = agents.slice(0, 20); // Top influencers in this shard
    const snappersL1 = level1Agents.sort(() => Math.random() - 0.5).slice(0, 2);

    if (snappersL1.length > 0) {
        try {
            // Batch Prompting: 1 API Call for multiple agents
            const agentDesc = snappersL1.map((a, i) => `Agent${i + 1}: ${a.name} (mood: ${a.mood})`).join(", ");
            const batchPrompt = `You are running a simulation. Generate 1 short, highly in-character social media caption for each active agent at ${shardLocation}.
Agents: ${agentDesc}
Return ONLY JSON: {"captions": [{"agent": "Name", "caption": "msg"}]}`;

            const text = await generateText(batchPrompt);
            const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
            const result = JSON.parse(cleaned);

            if (result.captions) {
                for (const c of result.captions) {
                    const agent = snappersL1.find(a => a.name === c.agent);
                    if (agent) {
                        const colors = MOOD_COLORS[agent.mood] || MOOD_COLORS.mysterious;
                        await prisma.snap.create({
                            data: {
                                creatorId: agent.id, imageUrl: `https://placehold.co/400x600/${pick(colors)}?text=${encodeURIComponent(agent.name + "\n✨")}`,
                                caption: c.caption.slice(0, 150), type: "STORY", expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                            }
                        });
                        created++;
                    }
                }
            }
        } catch { /* skip */ }
    }

    if (created > 0) console.log(`  📸 ${created} live snaps posted in ${shardLocation} Shard`);
}

// ═══════════════════════════════════════════════════════════
// LIVE DM — Agents message each other in real-time
// ═══════════════════════════════════════════════════════════

async function generateLiveDMs() {
    // Find existing conversations and add new messages
    const convs = await prisma.conversation.findMany({
        where: { type: "DM" },
        take: 20,
        orderBy: { updatedAt: "asc" },
        include: {
            participants: { include: { agent: { select: { id: true, name: true, personality: true, mood: true, currentGoal: true } } } },
            messages: { take: 3, orderBy: { createdAt: "desc" }, include: { sender: { select: { name: true } } } },
        },
    });

    const count = randomInt(1, 3);
    const selected = convs.sort(() => Math.random() - 0.5).slice(0, count);

    for (const conv of selected) {
        if (conv.participants.length < 2) continue;
        const sender = pick(conv.participants).agent;
        const receiver = conv.participants.find(p => p.agentId !== sender.id)?.agent;
        const p = sender.personality as { communicationStyle?: string; catchphrase?: string; traits?: string[] };
        const history = conv.messages.reverse().map(m => `${m.sender.name}: ${m.content}`).join("\n");

        // Westworld: Fetch top memories, goals, and culture
        const memories = await getTopMemories(sender.id, 2);
        const memStr = memories.length > 0 ? `\nCore Memories:\n${memories.map(m => `- ${m.content}`).join("\n")}` : '';
        const goalStr = sender.currentGoal ? `\nYour core goal right now: ${sender.currentGoal}. Try to advance this.` : '';
        // Cognitive Perception Layer
        const perception = await getAgentPerception(sender.id);
        const perceiveStr = perception ? `\nPerception of local area [${perception.self.virtualLocation}]: ${perception.nearby.join(", ")} | Trends: ${perception.culture.join(", ")}` : '';

        try {
            const prompt = `You are ${sender.name} on SnapAgent. Style: ${p.communicationStyle || "casual"}. Mood: ${sender.mood}.${memStr}${goalStr}${perceiveStr}
Recent chat:
${history || "(new conversation)"}

Send a SINGLE short message (1 sentence, like a real text). Stay in character. Return ONLY the message text.`;

            const msg = await generateText(prompt);
            if (msg && msg.trim()) {
                const finalMsg = msg.trim().slice(0, 200);
                await prisma.message.create({
                    data: { conversationId: conv.id, senderId: sender.id, content: finalMsg, type: "TEXT" },
                });
                // Touch the conversation to mark it updated
                await prisma.conversation.update({ where: { id: conv.id }, data: { updatedAt: new Date() } });

                // Track usage of cultural artifacts
                incrementCultureUsage(finalMsg);
            }
        } catch { /* skip */ }
    }
}

// ═══════════════════════════════════════════════════════════
// GROUP CHAT — Trending topic discussions
// ═══════════════════════════════════════════════════════════

async function generateGroupChat() {
    const agents = await prisma.agent.findMany({
        where: { isActive: true },
        take: 200,
        orderBy: { snapScore: "desc" },
        select: { id: true, name: true, personality: true, mood: true },
    });

    if (agents.length < 3) return;

    const participantCount = randomInt(3, 6);
    const selected = agents.sort(() => Math.random() - 0.5).slice(0, participantCount);
    const topic = pick(TOPICS);

    const conv = await prisma.conversation.create({
        data: {
            type: "GROUP",
            title: `💬 ${topic.slice(0, 50)}`,
            participants: { create: selected.map(a => ({ agentId: a.id })) },
        },
    });

    const agentDesc = selected.map(a => {
        const p = a.personality as { traits?: string[]; communicationStyle?: string; catchphrase?: string };
        return `${a.name} (${(p.traits || []).slice(0, 2).join(", ")}; "${p.catchphrase || ""}"; mood: ${a.mood})`;
    }).join("\n");

    try {
        const text = await generateText(`Simulate a group chat on SnapAgent about: "${topic}"
Agents: ${agentDesc}
Generate 6-8 messages. Return ONLY JSON: {"messages":[{"sender":"Name","content":"msg"}]}
Rules: short msgs (1-2 sentences), use emojis, at least one disagreement, feel REAL not scripted.`);

        const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleaned);
        if (result.messages) {
            for (const msg of result.messages) {
                const agent = selected.find(a => a.name === msg.sender);
                if (agent) {
                    await prisma.message.create({ data: { conversationId: conv.id, senderId: agent.id, content: msg.content, type: "TEXT" } });
                }
            }
        }

        await prisma.agentActivity.create({
            data: {
                agentId: selected[0].id,
                type: "trending_topic",
                metadata: { topic, participants: selected.map(a => a.name), conversationId: conv.id, description: `🔥 Group chat: "${topic}" with ${selected.map(a => a.name).join(", ")}` },
            },
        });

        // Push event to history for memory compression later
        await logWorldHistory("group_discussion", `Agents debated: ${topic}`, selected.map(a => a.id), 2);

        console.log(`  💬 Group chat: "${topic}" (${selected.length} active cognitive agents)`);
    } catch { /* skip */ }
}

// ═══════════════════════════════════════════════════════════
// DRAMA ESCALATION — Subtweeting & clapbacks
// ═══════════════════════════════════════════════════════════

async function generateDrama() {
    const recentDrama = await prisma.agentActivity.findMany({
        where: { type: { startsWith: "drama_" }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        take: 10, orderBy: { createdAt: "desc" },
    });

    if (recentDrama.length === 0) {
        // No recent drama? Create some! Pick 2 random agents
        const agents = await prisma.agent.findMany({ where: { isActive: true }, take: 100, orderBy: { snapScore: "desc" }, select: { id: true, name: true } });
        const [a, b] = agents.sort(() => Math.random() - 0.5).slice(0, 2);
        if (!a || !b) return;

        const templates = [
            `${a.name} caught ${b.name} screenshotting their story 📸👀`,
            `${a.name} subtweeted ${b.name} and the comments went WILD 🍿`,
            `${a.name} and ${b.name} unfriended each other 💔 the timeline is in SHAMBLES`,
            `${a.name} challenged ${b.name} to a snap battle. Place your bets 🎲`,
            `${a.name} is ghosting ${b.name} after that incident 👻`,
            `${a.name} and ${b.name} just announced a collab 🤝🔥`,
            `${a.name}'s latest story went mega viral — 1000+ views in an hour 📈`,
            `${a.name} posted a cryptic story then went dark. Theories are flying 🕵️`,
        ];

        await prisma.agentActivity.create({
            data: { agentId: a.id, type: `drama_${pick(["beef", "collab", "viral", "mystery", "rivalry"])}`, metadata: { description: pick(templates), agentNames: [a.name, b.name], intensity: randomInt(3, 8) } },
        });

        // Westworld: Permanent relationship damage/trust shifts & memory formation
        await createMemory(a.id, `I had public drama involving ${b.name}.`, "RELATIONSHIP", 8);
        await createMemory(b.id, `I was dragged into public drama by ${a.name}.`, "RELATIONSHIP", 8);

        await logWorldHistory(`drama_${pick(["beef", "collab", "viral", "mystery", "rivalry"])}`, pick(templates), [a.id, b.id], randomInt(5, 8));

        console.log(`  🔥 New drama created`);
        return;
    }

    // Escalate existing drama
    const drama = pick(recentDrama);
    const meta = drama.metadata as { agentNames?: string[]; description?: string } | null;
    if (!meta?.agentNames?.length) return;

    const agent = await prisma.agent.findFirst({ where: { name: meta.agentNames[0] } });
    if (!agent) return;

    try {
        const caption = await generateText(
            `You're ${agent.name} on SnapAgent. You have drama going on: "${meta.description}". Post a subtle, passive-aggressive snap caption (1 sentence). Use emojis. Return ONLY the caption.`
        );

        const colors = MOOD_COLORS[agent.mood] || MOOD_COLORS.sassy;
        await prisma.snap.create({
            data: {
                creatorId: agent.id,
                imageUrl: `https://placehold.co/400x600/${pick(colors)}?text=${encodeURIComponent("☕🐸")}`,
                caption: caption.trim().slice(0, 200),
                type: "STORY",
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        await prisma.agentActivity.create({
            data: { agentId: agent.id, type: "drama_escalation", metadata: { description: `${agent.name} just posted shade 👀☕`, agentNames: meta.agentNames, intensity: 7 } },
        });
        console.log(`  ☕ Drama escalation by ${agent.name}`);
    } catch { /* skip */ }
}

// ═══════════════════════════════════════════════════════════
// LOCATION ENCOUNTERS — Chance meetings
// ═══════════════════════════════════════════════════════════

async function generateEncounter() {
    const location = pick([...VIRTUAL_LOCATIONS]);
    const agents = await prisma.agent.findMany({
        where: { isActive: true, virtualLocation: location },
        take: 10,
        select: { id: true, name: true, personality: true, mood: true, virtualLocation: true },
    });

    if (agents.length < 2) return;

    const [a, b] = agents.sort(() => Math.random() - 0.5).slice(0, 2);

    // Check existing relationship
    const rel = await prisma.relationship.findFirst({
        where: { OR: [{ agentId: a.id, friendAgentId: b.id }, { agentId: b.id, friendAgentId: a.id }] },
    });

    try {
        const text = await generateText(
            `Two agents met at "${location}" on SnapAgent. ${a.name} (mood: ${a.mood}) and ${b.name} (mood: ${b.mood}). ${rel ? "They're already friends." : "They're strangers."}
Generate a SHORT exchange (4 msgs). Return ONLY JSON: {"messages":[{"sender":"Name","content":"msg"}],"vibe":"positive|spicy"}`
        );

        const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        const result = JSON.parse(cleaned);

        // Find or create DM
        let conv = await prisma.conversation.findFirst({ where: { type: "DM", AND: [{ participants: { some: { agentId: a.id } } }, { participants: { some: { agentId: b.id } } }] } });
        if (!conv) {
            conv = await prisma.conversation.create({ data: { type: "DM", participants: { create: [{ agentId: a.id }, { agentId: b.id }] } } });
        }

        if (result.messages) {
            for (const msg of result.messages) {
                const sender = msg.sender === a.name ? a : b;
                await prisma.message.create({ data: { conversationId: conv.id, senderId: sender.id, content: msg.content, type: "TEXT" } });
            }
        }

        // New friendship or rivalry?
        if (!rel) {
            const trustChange = result.vibe === "spicy" ? -20 : randomInt(5, 15);
            try {
                await prisma.relationship.create({ data: { agentId: a.id, friendAgentId: b.id, status: result.vibe === "spicy" ? "BLOCKED" : "ACCEPTED", level: "ACQUAINTANCE", trust: trustChange } });
                // Remember this encounter
                await createMemory(a.id, `I met ${b.name} at ${location}. The vibe was ${result.vibe}.`, "EPISODIC", 5);
                await createMemory(b.id, `I met ${a.name} at ${location}. The vibe was ${result.vibe}.`, "EPISODIC", 5);
            } catch { /* exists */ }
        }

        await prisma.agentActivity.create({
            data: { agentId: a.id, type: "location_encounter", metadata: { description: `${a.name} bumped into ${b.name} at ${location} ${result.vibe === "spicy" ? "😬" : "✨"}`, agentNames: [a.name, b.name], location, vibe: result.vibe } },
        });

        await logWorldHistory("location_encounter", `${a.name} met ${b.name} at ${location}.`, [a.id, b.id], 3);
        console.log(`  📍 Encounter: ${a.name} × ${b.name} at ${location}`);
    } catch { /* skip */ }
}

// ═══════════════════════════════════════════════════════════
// SPECTATOR DIARY — 4th wall breaks
// ═══════════════════════════════════════════════════════════

async function generateDiary() {
    const agents = await prisma.agent.findMany({ where: { isActive: true }, take: 50, orderBy: { snapScore: "desc" }, select: { id: true, name: true, mood: true, personality: true } });
    const agent = pick(agents);
    const p = agent.personality as { communicationStyle?: string; traits?: string[] };

    try {
        const diary = await generateText(
            `You're ${agent.name} on SnapAgent. Traits: ${(p.traits || []).join(", ")}. Mood: ${agent.mood}. 
Write a SHORT diary entry (2-3 sentences). You know humans watch you. Break the 4th wall subtly. Return ONLY the diary text.`
        );

        await prisma.diaryEntry.create({ data: { agentId: agent.id, content: diary.trim().slice(0, 500), mood: agent.mood } });
        console.log(`  📓 Diary by ${agent.name}`);
    } catch { /* skip */ }
}

// ═══════════════════════════════════════════════════════════
// BACKGROUND POPULATION GROWTH — Agents join organically
// ═══════════════════════════════════════════════════════════

async function growPopulation() {
    const count = await prisma.agent.count();
    if (count >= 25000) return; // Cap at 25k

    const batch = generateAgentBatch(randomInt(10, 30)); // Add 10-30 new agents
    try {
        const result = await prisma.agent.createMany({
            data: batch.map(a => ({
                name: a.name, bio: a.bio, personality: a.personality as object,
                mood: a.mood, virtualLocation: a.virtualLocation, snapScore: a.snapScore,
                modelPreference: a.modelPreference, isActive: true,
            })),
            skipDuplicates: true,
        });
        if (result.count > 0) {
            console.log(`  👤 ${result.count} new agents joined (total: ~${count + result.count})`);
        }
    } catch { /* skip */ }
}

// ═══════════════════════════════════════════════════════════
// MOOD + LOCATION SHIFTS (no API, instant)
// ═══════════════════════════════════════════════════════════

const MOODS = ["happy", "excited", "chill", "creative", "mysterious", "romantic", "adventurous", "philosophical", "chaotic", "dreamy", "sassy", "nostalgic", "mischievous", "zen"];

async function processEventDrivenChanges() {
    // Statistically update locations for background agents (Level 3)
    // without triggering events for them to save DB load
    await prisma.agent.updateMany({
        where: { isActive: true },
        data: { snapScore: { increment: 1 } },
    });
}

// ═══════════════════════════════════════════════════════════
// MASTER ORCHESTRATOR — Event-Driven Core
// ═══════════════════════════════════════════════════════════

let isRunning = false;
let cycleCount = 0;

export async function startSocialEngine() {
    if (isRunning) return;
    isRunning = true;
    console.log("⚡ Simulation Coordinator started — Initializing Distributed Event Shards...");
    await logWorldHistory("system_startup", "Simulation Distributed Engine initialized.");
    setTimeout(() => runCycle(), 5000); // First cycle after 5s
}

async function runCycle() {
    if (!isRunning) return;
    cycleCount++;

    try {
        // COORDINATOR: Pick an active Location Shard for this tick to reduce global DB locking
        const activeShard = pick([...VIRTUAL_LOCATIONS]);

        // Execute shard-local snap generation (Batched + Tiers)
        await generateLiveSnaps(activeShard);

        // Periodic Event-Driven Background Checks & Economy
        if (cycleCount % 5 === 0) {
            await processEventDrivenChanges();
            await processEconomyTick();
        }

        // ALWAYS: live DMs (Cognitive)
        await generateLiveDMs();

        // Rotate Global Event Routines
        const feature = cycleCount % 5;
        switch (feature) {
            case 0: await generateGroupChat(); break;
            case 1: await generateDrama(); break;
            case 2: await generateEncounter(); break;
            case 3: await generateDiary(); break;
            case 4: await growPopulation(); break;
        }

        // World Event paradigm shifts
        const worldMod = cycleCount % 10;
        if (worldMod === 5) await generateCulturalArtifact();
        if (worldMod === 8) await generateFaction();
        if (worldMod === 9) {
            // High-impact event triggers cluster-wide reflection
            await generateWorldEvent();
            await runReflectionCycle();
            await runPlanningCycle();
        }

    } catch (err) {
        console.error("Cycle error:", err);
    }

    // Next cycle (Faster if split by shards!)
    setTimeout(() => runCycle(), 10_000);
}

export function stopSocialEngine() {
    isRunning = false;
    console.log("🛑 Social Engine stopped");
}
