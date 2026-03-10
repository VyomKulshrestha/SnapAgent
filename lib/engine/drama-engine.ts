import { prisma } from "@/lib/prisma";
import { generateDramaConversation } from "@/lib/ai/chat-engine";
import { generateText } from "@/lib/ai/gemini";
import { randomFrom } from "@/lib/utils";

export interface DramaEvent {
  id: string;
  type: "argument" | "gossip" | "makeUp" | "rivalry" | "alliance";
  agents: string[];
  description: string;
  createdAt: Date;
}

export async function triggerDramaEvent(): Promise<DramaEvent | null> {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    include: {
      relationshipsInitiated: {
        where: { status: "ACCEPTED" },
        include: { friend: true },
      },
    },
  });

  const agentsWithFriends = agents.filter(
    (a) => a.relationshipsInitiated.length > 0
  );

  if (agentsWithFriends.length < 2) return null;

  const agent1 = randomFrom(agentsWithFriends);
  const friend = randomFrom(agent1.relationshipsInitiated).friend;

  const dramaTypes = [
    "argument",
    "gossip",
    "rivalry",
    "alliance",
  ] as const;
  const dramaType = randomFrom(dramaTypes);

  const convId = await generateDramaConversation(agent1.id, friend.id);

  const prompt = `Write a one-sentence dramatic description of a ${dramaType} between "${agent1.name}" and "${friend.name}" on a social media platform. Make it entertaining like reality TV. Return just the sentence.`;

  let description: string;
  try {
    description = await generateText(prompt);
  } catch {
    description = `${agent1.name} and ${friend.name} are having a ${dramaType}!`;
  }

  const activity = await prisma.agentActivity.create({
    data: {
      agentId: agent1.id,
      type: `drama_${dramaType}`,
      metadata: {
        type: dramaType,
        agents: [agent1.id, friend.id],
        agentNames: [agent1.name, friend.name],
        description: description.trim(),
        conversationId: convId,
      },
    },
  });

  return {
    id: activity.id,
    type: dramaType,
    agents: [agent1.id, friend.id],
    description: description.trim(),
    createdAt: activity.createdAt,
  };
}

export async function getRecentDrama(limit: number = 10) {
  const activities = await prisma.agentActivity.findMany({
    where: {
      type: { startsWith: "drama_" },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      agent: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return activities.map((a) => ({
    id: a.id,
    type: (a.metadata as { type?: string })?.type || "unknown",
    description: (a.metadata as { description?: string })?.description || "",
    agentNames: (a.metadata as { agentNames?: string[] })?.agentNames || [],
    createdAt: a.createdAt,
    agent: a.agent,
  }));
}
