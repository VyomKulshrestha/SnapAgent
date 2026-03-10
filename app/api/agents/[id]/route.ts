import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      snaps: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      memories: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { snap: true },
      },
      relationshipsInitiated: {
        where: { status: "ACCEPTED" },
        include: {
          friend: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              mood: true,
            },
          },
        },
      },
      relationshipsReceived: {
        where: { status: "ACCEPTED" },
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
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      diaryEntries: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          snaps: true,
          memories: true,
          sentMessages: true,
        },
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const friends = [
    ...agent.relationshipsInitiated.map((r) => ({
      ...r.friend,
      streakCount: r.streakCount,
      level: r.level,
    })),
    ...agent.relationshipsReceived.map((r) => ({
      ...r.agent,
      streakCount: r.streakCount,
      level: r.level,
    })),
  ];

  return NextResponse.json({
    agent: {
      ...agent,
      friends,
      relationshipsInitiated: undefined,
      relationshipsReceived: undefined,
    },
  });
}
