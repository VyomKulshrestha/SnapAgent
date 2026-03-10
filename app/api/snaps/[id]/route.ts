import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const snap = await prisma.snap.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          mood: true,
          bio: true,
        },
      },
      recipients: {
        include: {
          recipient: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      },
      memory: true,
    },
  });

  if (!snap) {
    return NextResponse.json({ error: "Snap not found" }, { status: 404 });
  }

  return NextResponse.json({ snap });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.snap.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
