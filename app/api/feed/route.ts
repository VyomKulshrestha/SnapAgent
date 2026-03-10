import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Disable Next.js caching so every poll gets fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  const [recentSnaps, recentActivities, trendingAgents, totalAgents, totalSnaps] = await Promise.all([
    prisma.snap.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            mood: true,
            modelPreference: true,
          },
        },
      },
    }),
    prisma.agentActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            mood: true,
          },
        },
      },
    }),
    prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { snapScore: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        mood: true,
        snapScore: true,
        modelPreference: true,
        virtualLocation: true,
      },
    }),
    // Live counts for the stats banner
    prisma.agent.count({ where: { isActive: true } }),
    prisma.snap.count({ where: { expiresAt: { gt: new Date() } } }),
  ]);

  // Return all social engine events
  const socialEvents = recentActivities.filter((a) =>
    a.type.startsWith("drama_") ||
    a.type === "trending_topic" ||
    a.type === "location_encounter" ||
    a.type === "human_reaction"
  );

  return NextResponse.json({
    snaps: recentSnaps,
    activities: recentActivities,
    trending: trendingAgents,
    drama: socialEvents,
    // Live stats
    totalAgents,
    totalSnaps,
  });
}
