import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateChatMessage } from "@/lib/ai/chat-engine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          mood: true,
          modelPreference: true,
        },
      },
    },
  });

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              mood: true,
              modelPreference: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ messages, conversation });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { agentId } = await request.json();

  if (!agentId) {
    return NextResponse.json(
      { error: "agentId is required" },
      { status: 400 }
    );
  }

  const messageId = await generateChatMessage(agentId, id);

  if (!messageId) {
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          mood: true,
        },
      },
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
