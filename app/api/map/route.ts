import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { VIRTUAL_LOCATIONS } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  // Use groupBy for counts (fast!) instead of loading all 20k agents
  const counts = await prisma.agent.groupBy({
    by: ["virtualLocation"],
    where: { isActive: true },
    _count: { id: true },
  });

  const countMap = new Map(counts.map(c => [c.virtualLocation, c._count.id]));

  // Only load sample agents for each location (top 15 by snapScore)
  const locationData = await Promise.all(
    VIRTUAL_LOCATIONS.map(async (location) => {
      const count = countMap.get(location) || 0;
      let agents: { id: string; name: string; avatarUrl: string | null; mood: string; snapScore: number }[] = [];

      if (count > 0) {
        agents = await prisma.agent.findMany({
          where: { isActive: true, virtualLocation: location },
          select: { id: true, name: true, avatarUrl: true, mood: true, snapScore: true },
          orderBy: { snapScore: "desc" },
          take: 15,
        });
      }

      return {
        name: location,
        agents,
        count,
        isHot: count >= Math.max(3, Math.ceil(countMap.get(location) || 0) * 0.001),
      };
    })
  );

  // Sort: hottest locations first
  locationData.sort((a, b) => b.count - a.count);

  // Mark top 30% as "hot"
  const hotThreshold = Math.ceil(locationData.length * 0.3);
  locationData.forEach((loc, i) => {
    loc.isHot = i < hotThreshold && loc.count > 0;
  });

  return NextResponse.json({ locations: locationData });
}
