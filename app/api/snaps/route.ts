import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSnapForAgent } from "@/lib/ai/snap-generator";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const type = searchParams.get("type") || undefined;

  const snaps = await prisma.snap.findMany({
    where: {
      expiresAt: { gt: new Date() },
      ...(type ? { type: type as "SNAP" | "STORY" } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          mood: true,
        },
      },
      _count: {
        select: { recipients: true },
      },
    },
  });

  return NextResponse.json({ snaps });
}

export async function POST(request: Request) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json(
        { error: "agentId is required" },
        { status: 400 }
      );
    }

    const snapId = await generateSnapForAgent(agentId);

    if (!snapId) {
      return NextResponse.json(
        { error: "Failed to generate snap" },
        { status: 500 }
      );
    }

    const snap = await prisma.snap.findUnique({
      where: { id: snapId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            mood: true,
          },
        },
      },
    });

    return NextResponse.json({ snap }, { status: 201 });
  } catch (error) {
    console.error("Snap creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
