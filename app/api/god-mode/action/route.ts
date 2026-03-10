import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logWorldHistory } from "@/lib/engine/cognitive-engine";
import { triggerEconomicShock } from "@/lib/engine/economy-engine"; // We'll need to export this
import { generateCulturalArtifact, generateFaction, generateWorldEvent } from "@/lib/engine/westworld-engine";
import { generateInstantAgent } from "@/lib/engine/population-engine";

export async function POST(req: Request) {
    try {
        const { action, payload } = await req.json();

        switch (action) {
            case "TRIGGER_ECON_SHOCK":
                await triggerEconomicShock();
                return NextResponse.json({ success: true, message: "Economic Shock triggered." });

            case "CREATE_FACTION":
                await generateFaction();
                return NextResponse.json({ success: true, message: "Faction logic triggered." });

            case "SPAWN_SLANG":
                await generateCulturalArtifact();
                return NextResponse.json({ success: true, message: "New slang injected." });

            case "WORLD_EVENT":
                await generateWorldEvent();
                return NextResponse.json({ success: true, message: "World Event triggered." });

            case "SPAWN_AGENTS":
                const count = payload?.count || 10;
                for (let i = 0; i < count; i++) {
                    await generateInstantAgent();
                }
                await logWorldHistory("mass_spawn", `God spawned ${count} new agents from the sky.`);
                return NextResponse.json({ success: true, message: `Spawned ${count} agents.` });

            case "RICH_AGENT":
                // Makes a random agent extremely wealthy
                const agents = await prisma.agent.findMany({ take: 100, select: { id: true, name: true } });
                if (agents.length > 0) {
                    const randomAgent = agents[Math.floor(Math.random() * agents.length)];
                    await prisma.agent.update({
                        where: { id: randomAgent.id },
                        data: { credits: { increment: 50000 }, influence: { increment: 1000 } }
                    });
                    await logWorldHistory("divine_intervention", `${randomAgent.name} was blessed with immense wealth and influence by God.`, [randomAgent.id], 10);
                    return NextResponse.json({ success: true, message: `Blessed ${randomAgent.name} with 50,000 credits.` });
                }
                return NextResponse.json({ success: false, message: "No agents found." });

            case "START_RUMOR":
                const rumor = payload?.rumor || "Coffee is actually illegal now.";
                await logWorldHistory("global_rumor", `A massive rumor is spreading: "${rumor}"`, [], 8);
                // Force a world event about this
                await prisma.worldEvent.create({
                    data: {
                        title: "Viral Rumor",
                        description: `Everyone is talking about a rumor: ${rumor}`,
                        impactLevel: 8
                    }
                });
                return NextResponse.json({ success: true, message: `Rumor started: ${rumor}` });

            default:
                return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
