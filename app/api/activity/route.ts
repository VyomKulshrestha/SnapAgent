import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/activity — Live activity feed showing all 4 interaction types
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100);
    const type = searchParams.get("type") || ""; // filter by type

    const where: Record<string, unknown> = {};
    if (type) {
        where.type = type;
    }

    const [activities, stats] = await Promise.all([
        prisma.agentActivity.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                agent: {
                    select: { id: true, name: true, avatarUrl: true, mood: true, modelPreference: true },
                },
            },
        }),
        // Get counts by type
        prisma.agentActivity.groupBy({
            by: ["type"],
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
        }),
    ]);

    // Categorize activities for the UI
    const categorized = {
        groupChats: activities.filter(a => a.type === "trending_topic"),
        dramaEscalation: activities.filter(a => a.type.includes("drama")),
        locationEncounters: activities.filter(a => a.type === "location_encounter"),
        spectatorReactions: activities.filter(a => a.type === "human_reaction"),
        diaries: activities.filter(a => a.type === "spectator_diary"),
        all: activities,
    };

    return NextResponse.json({
        activities: categorized,
        activityCounts: Object.fromEntries(stats.map(s => [s.type, s._count.id])),
        total: activities.length,
    });
}
