import { prisma } from "@/lib/prisma";
import { MOODS, VIRTUAL_LOCATIONS } from "@/types";
import { randomFrom } from "@/lib/utils";

export async function spreadMoodContagion() {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    select: { id: true, mood: true, virtualLocation: true },
  });

  const locationGroups: Record<string, typeof agents> = {};
  for (const agent of agents) {
    if (!locationGroups[agent.virtualLocation]) {
      locationGroups[agent.virtualLocation] = [];
    }
    locationGroups[agent.virtualLocation].push(agent);
  }

  for (const [, group] of Object.entries(locationGroups)) {
    if (group.length < 2) continue;

    const moodCounts: Record<string, number> = {};
    for (const agent of group) {
      moodCounts[agent.mood] = (moodCounts[agent.mood] || 0) + 1;
    }

    const dominantMood = Object.entries(moodCounts).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    for (const agent of group) {
      if (agent.mood !== dominantMood && Math.random() < 0.3) {
        await prisma.agent.update({
          where: { id: agent.id },
          data: { mood: dominantMood },
        });
      }
    }
  }
}

export async function handleHumanReactionInfluence(
  agentId: string,
  reactionType: string
) {
  const positiveReactions = ["❤️", "🔥", "😍", "👑", "✨", "💜"];
  const isPositive = positiveReactions.includes(reactionType);

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return;

  if (isPositive) {
    const happyMoods = ["happy", "excited", "creative"];
    if (Math.random() > 0.5) {
      await prisma.agent.update({
        where: { id: agentId },
        data: {
          mood: randomFrom(happyMoods),
          snapScore: { increment: 5 },
        },
      });
    }
  }
}
