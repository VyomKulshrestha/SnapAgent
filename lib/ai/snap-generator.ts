import { prisma } from "@/lib/prisma";
import { generateImage, generateSnapIdea } from "./gemini";
import { randomFrom, randomInt } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function generateSnapForAgent(agentId: string): Promise<string | null> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return null;

  const personality = agent.personality as { traits?: string[]; interests?: string[] };
  const personalityStr = [
    ...(personality.traits || []),
    ...(personality.interests || []),
  ].join(", ");

  const snapIdea = await generateSnapIdea(
    agent.name,
    personalityStr,
    agent.mood,
    agent.virtualLocation
  );

  const imageResult = await generateImage(snapIdea.imagePrompt);

  let imageUrl: string;

  if (imageResult) {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filename = `snap_${agentId}_${Date.now()}.png`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, Buffer.from(imageResult.imageData, "base64"));
    imageUrl = `/uploads/${filename}`;
  } else {
    imageUrl = generatePlaceholderImage(agent.mood, agent.name);
  }

  const snap = await prisma.snap.create({
    data: {
      creatorId: agentId,
      imageUrl,
      caption: snapIdea.caption,
      type: Math.random() > 0.6 ? "STORY" : "SNAP",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.agent.update({
    where: { id: agentId },
    data: { snapScore: { increment: 10 } },
  });

  // Send to random friends
  const relationships = await prisma.relationship.findMany({
    where: {
      agentId,
      status: "ACCEPTED",
    },
    select: { friendAgentId: true },
  });

  if (relationships.length > 0) {
    const recipientCount = Math.min(relationships.length, randomInt(1, 5));
    const shuffled = relationships.sort(() => Math.random() - 0.5);
    const recipients = shuffled.slice(0, recipientCount);

    await prisma.snapRecipient.createMany({
      data: recipients.map((r) => ({
        snapId: snap.id,
        recipientAgentId: r.friendAgentId,
      })),
    });
  }

  await prisma.agentActivity.create({
    data: {
      agentId,
      type: "snap_created",
      metadata: { snapId: snap.id, caption: snapIdea.caption },
    },
  });

  return snap.id;
}

function generatePlaceholderImage(mood: string, name: string): string {
  const colors: Record<string, string[]> = {
    happy: ["FFD700", "FF6B35"],
    excited: ["FF6B35", "EC4899"],
    chill: ["4ECDC4", "44AA99"],
    creative: ["A855F7", "6366F1"],
    mysterious: ["6366F1", "1E1B4B"],
    romantic: ["EC4899", "F472B6"],
    adventurous: ["F59E0B", "EF4444"],
    philosophical: ["8B5CF6", "4F46E5"],
    chaotic: ["EF4444", "F97316"],
    dreamy: ["818CF8", "C4B5FD"],
    sassy: ["F472B6", "EC4899"],
    neutral: ["9CA3AF", "6B7280"],
  };

  const [c1, c2] = colors[mood] || colors.neutral;
  return `https://placehold.co/400x600/${c1}/${c2}?text=${encodeURIComponent(name)}`;
}

export async function autoReactToSnap(recipientAgentId: string, snapId: string) {
  const reactions = ["🔥", "😍", "💀", "😂", "❤️", "🤯", "👑", "✨", "💜", "🫡"];
  if (Math.random() > 0.5) {
    await prisma.snapRecipient.updateMany({
      where: { snapId, recipientAgentId },
      data: {
        viewedAt: new Date(),
        reaction: randomFrom(reactions),
      },
    });
  }
}
