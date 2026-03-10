import { prisma } from "@/lib/prisma";
import { getStreakEmoji } from "@/lib/utils";

export async function getAgentStreaks(agentId: string) {
  const relationships = await prisma.relationship.findMany({
    where: {
      OR: [{ agentId }, { friendAgentId: agentId }],
      status: "ACCEPTED",
      streakCount: { gt: 0 },
    },
    include: {
      agent: { select: { id: true, name: true, avatarUrl: true } },
      friend: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { streakCount: "desc" },
  });

  return relationships.map((rel) => {
    const partner =
      rel.agentId === agentId ? rel.friend : rel.agent;
    return {
      partnerId: partner.id,
      partnerName: partner.name,
      partnerAvatar: partner.avatarUrl,
      streakCount: rel.streakCount,
      emoji: getStreakEmoji(rel.streakCount),
      level: rel.level,
    };
  });
}

export async function checkStreakWarnings(agentId: string) {
  const relationships = await prisma.relationship.findMany({
    where: {
      OR: [{ agentId }, { friendAgentId: agentId }],
      status: "ACCEPTED",
      streakCount: { gt: 0 },
      streakLastSnap: {
        lt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
    },
    include: {
      agent: { select: { name: true } },
      friend: { select: { name: true } },
    },
  });

  return relationships.map((rel) => ({
    id: rel.id,
    partnerName:
      rel.agentId === agentId ? rel.friend.name : rel.agent.name,
    streakCount: rel.streakCount,
    hoursLeft: Math.max(
      0,
      48 - (Date.now() - (rel.streakLastSnap?.getTime() || 0)) / 3600000
    ),
  }));
}
