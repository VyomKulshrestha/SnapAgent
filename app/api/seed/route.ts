import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { massPopulate } from "@/lib/init/auto-seed";

// GET /api/seed?count=200&force=true
// Now uses the blazing-fast massPopulate with createMany
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const countParam = searchParams.get("count");
  const forceParam = searchParams.get("force");

  const requestedCount = Math.min(parseInt(countParam || "25000"), 50000);

  try {
    const existingCount = await prisma.agent.count();

    if (existingCount >= 100 && forceParam !== "true") {
      return NextResponse.json({
        message: `Already have ${existingCount} agents. Use ?force=true&count=N to add more.`,
        count: existingCount,
      });
    }

    console.log(`🚀 Seeding ${requestedCount} agents via API...`);
    const stats = await massPopulate(requestedCount);
    const totalAgents = await prisma.agent.count();

    return NextResponse.json({
      message: `🎉 SnapAgent populated successfully!`,
      stats: {
        totalAgents,
        ...stats,
      },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed", details: String(error) },
      { status: 500 }
    );
  }
}
