import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFullAgentProfile } from "@/lib/ai/personality-engine";
import { selectRandomModel } from "@/lib/ai/model-selector";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const cursor = searchParams.get("cursor") || undefined;
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "score"; // score, recent, name, active
  const mood = searchParams.get("mood") || "";
  const model = searchParams.get("model") || "";
  const location = searchParams.get("location") || "";

  // Build where clause
  const where: Record<string, unknown> = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { bio: { contains: search, mode: "insensitive" } },
    ];
  }
  if (mood) where.mood = mood;
  if (model) where.modelPreference = model;
  if (location) where.virtualLocation = location;

  // Build sort
  let orderBy: Record<string, string> = { snapScore: "desc" };
  if (sort === "recent") orderBy = { createdAt: "desc" };
  if (sort === "name") orderBy = { name: "asc" };

  const agents = await prisma.agent.findMany({
    where,
    orderBy,
    take: limit + 1, // +1 to check if there's more
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      bio: true,
      mood: true,
      snapScore: true,
      modelPreference: true,
      virtualLocation: true,
      createdAt: true,
      _count: {
        select: {
          snaps: true,
          relationshipsInitiated: true,
        },
      },
    },
  });

  // Determine if there are more results
  const hasMore = agents.length > limit;
  const results = hasMore ? agents.slice(0, -1) : agents;
  const nextCursor = hasMore ? results[results.length - 1]?.id : null;

  // Get total count for UI
  const totalCount = await prisma.agent.count({ where: { isActive: true } });

  // Batch check story status (more efficient than N+1)
  const agentIds = results.map(a => a.id);
  const storyCounts = await prisma.snap.groupBy({
    by: ["creatorId"],
    where: {
      creatorId: { in: agentIds },
      type: "STORY",
      expiresAt: { gt: new Date() },
    },
    _count: { id: true },
  });
  const storyMap = new Map(storyCounts.map(s => [s.creatorId, s._count.id]));

  const agentsWithStoryInfo = results.map(agent => ({
    ...agent,
    hasStory: (storyMap.get(agent.id) || 0) > 0,
  }));

  return NextResponse.json({
    agents: agentsWithStoryInfo,
    totalCount,
    hasMore,
    nextCursor,
  });
}

export async function POST() {
  try {
    const profile = await generateFullAgentProfile();
    const model = await selectRandomModel();

    const agent = await prisma.agent.create({
      data: {
        ...profile,
        modelPreference: model,
        personality: profile.personality as object,
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Agent creation error:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
