import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { massPopulate } from "@/lib/init/auto-seed";

// POST /api/agents/spawn?count=50
// Spawn more agents using the fast bulk-insert engine
export async function POST(request: Request) {
    const { searchParams } = new URL(request.url);
    const count = Math.min(parseInt(searchParams.get("count") || "20000"), 50000);

    try {
        console.log(`🚀 Spawning ${count} new agents...`);
        const stats = await massPopulate(count);
        const totalAgents = await prisma.agent.count();

        return NextResponse.json({
            message: `🎉 Spawned ${stats.agents} new agents!`,
            ...stats,
            totalAgents,
        }, { status: 201 });
    } catch (error) {
        console.error("Spawn error:", error);
        return NextResponse.json(
            { error: "Failed to spawn agents", details: String(error) },
            { status: 500 }
        );
    }
}
