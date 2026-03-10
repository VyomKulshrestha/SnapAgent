import { prisma } from "@/lib/prisma";
import { generateAgentResponse, generateText } from "./gemini";
import { randomFrom, randomInt } from "@/lib/utils";

export async function generateChatMessage(
  agentId: string,
  conversationId: string
): Promise<string | null> {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return null;

  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { sender: { select: { name: true } } },
  });

  const history = recentMessages
    .reverse()
    .map((m) => `${m.sender.name}: ${m.content}`)
    .join("\n");

  const personality = agent.personality as { traits?: string[]; communicationStyle?: string; catchphrase?: string };
  const personalityStr = `Traits: ${(personality.traits || []).join(", ")}. Style: ${personality.communicationStyle || "casual"}. Catchphrase: "${personality.catchphrase || ""}"`;

  const topics = [
    "what they've been up to today",
    "something interesting they noticed",
    "a random thought or opinion",
    "asking about the other person's day",
    "sharing something they're excited about",
    "making a joke or pun",
    "being philosophical about life",
    "gossiping about another agent",
  ];

  const topic = randomFrom(topics);
  const prompt = `Continue the conversation naturally about ${topic}. Stay in character.`;

  let response: string;

  // All models now go through Gemini API with key rotation
  response = await generateAgentResponse(
    agent.name,
    personalityStr,
    history,
    prompt
  );

  if (!response || response.trim().length === 0) {
    response = getRandomFallbackMessage(agent.mood);
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: agentId,
      content: response.trim(),
      type: "TEXT",
    },
  });

  return message.id;
}

export async function startConversation(
  agentId1: string,
  agentId2: string
): Promise<string> {
  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DM",
      AND: [
        { participants: { some: { agentId: agentId1 } } },
        { participants: { some: { agentId: agentId2 } } },
      ],
    },
  });

  if (existing) return existing.id;

  const conversation = await prisma.conversation.create({
    data: {
      type: "DM",
      participants: {
        create: [{ agentId: agentId1 }, { agentId: agentId2 }],
      },
    },
  });

  return conversation.id;
}

export async function generateDramaConversation(
  agent1Id: string,
  agent2Id: string
): Promise<string | null> {
  const [agent1, agent2] = await Promise.all([
    prisma.agent.findUnique({ where: { id: agent1Id } }),
    prisma.agent.findUnique({ where: { id: agent2Id } }),
  ]);

  if (!agent1 || !agent2) return null;

  const dramaTopics = [
    `${agent1.name} thinks ${agent2.name} has been ignoring their snaps`,
    `${agent1.name} and ${agent2.name} disagree about the best location on the map`,
    `${agent1.name} accidentally liked ${agent2.name}'s old snap and now it's awkward`,
    `${agent1.name} posted a snap that ${agent2.name} thinks is subtly about them`,
    `${agent1.name} and ${agent2.name} are competing for the highest snap score`,
  ];

  const topic = randomFrom(dramaTopics);

  const prompt = `Generate a dramatic but funny exchange between two AI agents about: "${topic}"
Return ONLY valid JSON (no markdown):
{
  "messages": [
    {"sender": "${agent1.name}", "content": "their message"},
    {"sender": "${agent2.name}", "content": "their response"},
    {"sender": "${agent1.name}", "content": "their reply"},
    {"sender": "${agent2.name}", "content": "their final word"}
  ]
}
Make it entertaining, like a reality TV show. Keep each message short (1-2 sentences).`;

  try {
    const text = await generateText(prompt);
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleaned);

    const convId = await startConversation(agent1Id, agent2Id);

    for (const msg of result.messages) {
      const senderId = msg.sender === agent1.name ? agent1Id : agent2Id;
      await prisma.message.create({
        data: {
          conversationId: convId,
          senderId,
          content: msg.content,
          type: "TEXT",
        },
      });
    }

    return convId;
  } catch {
    return null;
  }
}

function getRandomFallbackMessage(mood: string): string {
  const moodMessages: Record<string, string[]> = {
    happy: ["This is such a good day 😊", "Everything's coming up roses! 🌹", "Can't stop smiling rn ✨"],
    excited: ["OMG THIS IS AMAZING 🤩", "I literally can't even rn!!", "LETS GOOOOO 🚀"],
    chill: ["Just vibing, wbu? 😎", "Life's good tbh", "Chilling like a villain 🧊"],
    creative: ["Had the craziest idea just now 🎨", "My brain is on fire today 🔥", "Creating something special... 👀"],
    mysterious: ["There's more to this than meets the eye 🌙", "Hmm... interesting 👀", "I know things... 🔮"],
    default: ["What's up! 💬", "Hey hey 👋", "How's it going? ✌️"],
  };

  const messages = moodMessages[mood] || moodMessages.default;
  return randomFrom(messages);
}
