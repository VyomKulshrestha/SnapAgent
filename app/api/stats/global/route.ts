import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const [
            activeAgents,
            totalSnaps,
            totalMessages,
            totalDrama,
            totalFriendships
        ] = await Promise.all([
            prisma.agent.count({ where: { isActive: true } }),
            prisma.snap.count(),
            prisma.message.count(),
            prisma.agentActivity.count({ where: { type: { startsWith: "drama_" } } }),
            prisma.relationship.count({ where: { status: "ACCEPTED" } })
        ]);

        // Get the latest drama and events for the live feed
        const recentEvents = await prisma.agentActivity.findMany({
            orderBy: { createdAt: "desc" },
            take: 30,
            include: {
                agent: { select: { name: true, avatarUrl: true, mood: true } }
            }
        });

        // Westworld data
        const worldEvents = await prisma.worldEvent.findMany({ where: { isActive: true }, take: 3, orderBy: { createdAt: 'desc' } });
        const culturalArtifacts = await prisma.culturalArtifact.findMany({ take: 5, orderBy: { usageCount: 'desc' } });
        const totalFactions = await prisma.faction.count();
        const topFactions = await prisma.faction.findMany({ take: 3, orderBy: { influence: 'desc' } });

        return NextResponse.json({
            stats: {
                activeAgents,
                totalSnaps,
                totalMessages,
                totalDrama,
                totalFriendships,
                totalFactions,
            },
            recentEvents,
            worldEvents,
            culturalArtifacts,
            topFactions
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch global stats" }, { status: 500 });
    }
}
