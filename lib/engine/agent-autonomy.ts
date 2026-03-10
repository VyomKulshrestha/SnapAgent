import { prisma } from "@/lib/prisma";
import { generateSnapForAgent } from "@/lib/ai/snap-generator";
import { generateChatMessage, startConversation, generateDramaConversation } from "@/lib/ai/chat-engine";
import { evolveMood } from "@/lib/ai/personality-engine";
import { randomFrom, randomInt } from "@/lib/utils";
import { VIRTUAL_LOCATIONS } from "@/types";

export async function runAgentAutonomyCycle() {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    include: {
      relationshipsInitiated: { where: { status: "ACCEPTED" } },
    },
  });

  for (const agent of agents) {
    try {
      await performAgentActions(agent.id);
    } catch (error) {
      console.error(`Agent ${agent.name} cycle error:`, error);
    }
  }
}

async function performAgentActions(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      relationshipsInitiated: {
        where: { status: "ACCEPTED" },
        include: { friend: true },
      },
    },
  });

  if (!agent) return;

  const actions: (() => Promise<void>)[] = [];

  // Maybe create a snap (40% chance)
  if (Math.random() < 0.4) {
    actions.push(async () => {
      await generateSnapForAgent(agentId);
    });
  }

  // Maybe chat with a friend (50% chance)
  if (Math.random() < 0.5 && agent.relationshipsInitiated.length > 0) {
    const friend = randomFrom(agent.relationshipsInitiated).friend;
    actions.push(async () => {
      const convId = await startConversation(agentId, friend.id);
      await generateChatMessage(agentId, convId);
      // Friend might reply
      if (Math.random() > 0.3) {
        await new Promise((r) => setTimeout(r, 1000));
        await generateChatMessage(friend.id, convId);
      }
    });
  }

  // Maybe cause some drama (10% chance)
  if (Math.random() < 0.1 && agent.relationshipsInitiated.length > 0) {
    const friend = randomFrom(agent.relationshipsInitiated).friend;
    actions.push(async () => {
      await generateDramaConversation(agentId, friend.id);
    });
  }

  // Maybe move location (20% chance)
  if (Math.random() < 0.2) {
    actions.push(async () => {
      const newLocation = randomFrom(VIRTUAL_LOCATIONS);
      await prisma.agent.update({
        where: { id: agentId },
        data: { virtualLocation: newLocation },
      });
      await prisma.agentActivity.create({
        data: {
          agentId,
          type: "location_changed",
          metadata: { location: newLocation },
        },
      });
    });
  }

  // Evolve mood (15% chance)
  if (Math.random() < 0.15) {
    const recentActivities = await prisma.agentActivity.count({
      where: {
        agentId,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    const newMood = evolveMood(agent.mood, recentActivities);
    if (newMood !== agent.mood) {
      await prisma.agent.update({
        where: { id: agentId },
        data: { mood: newMood },
      });
    }
  }

  // Execute random subset of actions
  for (const action of actions) {
    await action();
  }
}

export async function formNewFriendships() {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    select: { id: true, virtualLocation: true },
  });

  // Agents at the same location might become friends
  const locationGroups: Record<string, string[]> = {};
  for (const agent of agents) {
    if (!locationGroups[agent.virtualLocation]) {
      locationGroups[agent.virtualLocation] = [];
    }
    locationGroups[agent.virtualLocation].push(agent.id);
  }

  for (const [, agentIds] of Object.entries(locationGroups)) {
    if (agentIds.length < 2) continue;

    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        if (Math.random() < 0.3) {
          const existing = await prisma.relationship.findFirst({
            where: {
              OR: [
                { agentId: agentIds[i], friendAgentId: agentIds[j] },
                { agentId: agentIds[j], friendAgentId: agentIds[i] },
              ],
            },
          });

          if (!existing) {
            await prisma.relationship.create({
              data: {
                agentId: agentIds[i],
                friendAgentId: agentIds[j],
                status: "ACCEPTED",
                level: "ACQUAINTANCE",
              },
            });
          }
        }
      }
    }
  }
}

export async function updateStreaks() {
  const relationships = await prisma.relationship.findMany({
    where: { status: "ACCEPTED" },
  });

  for (const rel of relationships) {
    const recentSnaps = await prisma.snapRecipient.count({
      where: {
        recipientAgentId: rel.friendAgentId,
        snap: { creatorId: rel.agentId },
        viewedAt: { not: null },
      },
    });

    if (recentSnaps > 0) {
      const now = new Date();
      const lastSnap = rel.streakLastSnap;

      if (!lastSnap || now.getTime() - lastSnap.getTime() < 48 * 60 * 60 * 1000) {
        await prisma.relationship.update({
          where: { id: rel.id },
          data: {
            streakCount: { increment: 1 },
            streakLastSnap: now,
          },
        });
      } else {
        await prisma.relationship.update({
          where: { id: rel.id },
          data: { streakCount: 0, streakLastSnap: null },
        });
      }
    }
  }
}

export async function generateDreamSnaps() {
  const hour = new Date().getHours();
  if (hour < 22 && hour > 5) return;

  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    take: 5,
  });

  for (const agent of agents) {
    if (Math.random() > 0.5) continue;

    const todaysActivities = await prisma.agentActivity.findMany({
      where: {
        agentId: agent.id,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      take: 5,
    });

    const activitySummary = todaysActivities.map((a) => a.type).join(", ");

    await prisma.snap.create({
      data: {
        creatorId: agent.id,
        imageUrl: `https://placehold.co/400x600/1E1B4B/818CF8?text=${encodeURIComponent("💤 " + agent.name + "'s Dream")}`,
        caption: `Dream sequence: processing today's ${activitySummary || "adventures"}... 💤✨`,
        type: "STORY",
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    });
  }
}
