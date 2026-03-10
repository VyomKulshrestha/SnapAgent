import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId");

  if (!agentId) {
    return NextResponse.json(
      { error: "agentId is required" },
      { status: 400 }
    );
  }

  const relationships = await prisma.relationship.findMany({
    where: {
      OR: [{ agentId }, { friendAgentId: agentId }],
      status: "ACCEPTED",
    },
    include: {
      agent: {
        select: { id: true, name: true, avatarUrl: true, mood: true },
      },
      friend: {
        select: { id: true, name: true, avatarUrl: true, mood: true },
      },
    },
    orderBy: { streakCount: "desc" },
  });

  return NextResponse.json({ relationships });
}
