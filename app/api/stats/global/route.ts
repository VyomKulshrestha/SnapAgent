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

        return NextResponse.json({
            stats: {
                activeAgents,
                totalSnaps,
                totalMessages,
                totalDrama,
                totalFriendships,
            },
            recentEvents
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch global stats" }, { status: 500 });
    }
}
