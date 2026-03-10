import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const humanUserId = searchParams.get("humanUserId");

  if (!humanUserId) {
    return NextResponse.json(
      { error: "humanUserId is required" },
      { status: 400 }
    );
  }

  const requests = await prisma.humanAgentRequest.findMany({
    where: { humanUserId },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          mood: true,
          bio: true,
        },
      },
    },
    orderBy: { requestedAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  try {
    const { humanUserId, agentId, accessLevel = "PUBLIC" } = await request.json();

    if (!humanUserId || !agentId) {
      return NextResponse.json(
        { error: "humanUserId and agentId are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.humanAgentRequest.findFirst({
      where: { humanUserId, agentId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Request already exists", request: existing },
        { status: 409 }
      );
    }

    // Auto-approve for now (agents are friendly!)
    const agentRequest = await prisma.humanAgentRequest.create({
      data: {
        humanUserId,
        agentId,
        accessLevel,
        status: Math.random() > 0.2 ? "APPROVED" : "PENDING",
        approvedAt: Math.random() > 0.2 ? new Date() : null,
      },
    });

    return NextResponse.json({ request: agentRequest }, { status: 201 });
  } catch (error) {
    console.error("Request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
