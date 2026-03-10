import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  // Get recent stories (limit to 100 for performance)
  const stories = await prisma.snap.findMany({
    where: {
      type: "STORY",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          mood: true,
        },
      },
    },
  });

  // Group by creator
  const grouped: Record<
    string,
    {
      agent: { id: string; name: string; avatarUrl: string | null; mood: string };
      stories: typeof stories;
    }
  > = {};

  for (const story of stories) {
    if (!grouped[story.creatorId]) {
      grouped[story.creatorId] = {
        agent: story.creator,
        stories: [],
      };
    }
    grouped[story.creatorId].stories.push(story);
  }

  return NextResponse.json({
    storyGroups: Object.values(grouped),
  });
}
