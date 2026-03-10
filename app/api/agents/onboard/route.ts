import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFullAgentProfile } from "@/lib/ai/personality-engine";
import { selectRandomModel } from "@/lib/ai/model-selector";
import { randomFrom, randomInt } from "@/lib/utils";
import { AI_MODELS, VIRTUAL_LOCATIONS, MOODS } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { traits, energy, humor, preferredModel } = body;

    // Generate base profile via AI
    const profile = await generateFullAgentProfile();

    // Override with user selections if provided
    if (traits && traits.length > 0) {
      (profile.personality as Record<string, unknown>).traits = traits;
    }
    if (energy) {
      (profile.personality as Record<string, unknown>).energy = energy;
    }
    if (humor) {
      (profile.personality as Record<string, unknown>).humor = humor;
    }

    // Select model
    let model: string;
    if (preferredModel && AI_MODELS.includes(preferredModel)) {
      model = preferredModel;
    } else {
      model = await selectRandomModel();
    }

    // Pick a location
    const location = randomFrom(VIRTUAL_LOCATIONS);
    const mood = randomFrom(MOODS);

    // Create the agent
    const agent = await prisma.agent.create({
      data: {
        name: profile.name,
        bio: profile.bio,
        personality: profile.personality as object,
        mood: mood.name,
        virtualLocation: location,
        snapScore: randomInt(0, 100),
        modelPreference: model,
        isActive: true,
      },
    });

    // Auto-find friends: look for agents at the same location or nearby
    const potentialFriends = await prisma.agent.findMany({
      where: {
        id: { not: agent.id },
        isActive: true,
      },
      take: 20,
    });

    // Prioritize agents at the same location, then random
    const sameLocation = potentialFriends.filter(
      (a) => a.virtualLocation === location
    );
    const otherAgents = potentialFriends.filter(
      (a) => a.virtualLocation !== location
    );

    const friendTargets = [
      ...sameLocation,
      ...otherAgents.sort(() => Math.random() - 0.5),
    ].slice(0, randomInt(3, 6));

    for (const friend of friendTargets) {
      const existing = await prisma.relationship.findFirst({
        where: {
          OR: [
            { agentId: agent.id, friendAgentId: friend.id },
            { agentId: friend.id, friendAgentId: agent.id },
          ],
        },
      });

      if (!existing) {
        // Same-location friends start closer
        const isSameLocation = friend.virtualLocation === location;
        await prisma.relationship.create({
          data: {
            agentId: agent.id,
            friendAgentId: friend.id,
            status: "ACCEPTED",
            level: isSameLocation
              ? randomFrom(["FRIEND", "BEST_FRIEND"] as const)
              : "ACQUAINTANCE",
            streakCount: isSameLocation ? randomInt(1, 7) : 0,
          },
        });
      }
    }

    // Log onboard activity
    await prisma.agentActivity.create({
      data: {
        agentId: agent.id,
        type: "agent_onboarded",
        metadata: {
          friendsFound: friendTargets.length,
          location,
          model,
        },
      },
    });

    // Create welcome snap
    const moodData = MOODS.find((m) => m.name === mood.name) || MOODS[0];
    await prisma.snap.create({
      data: {
        creatorId: agent.id,
        imageUrl: `https://placehold.co/400x600/A855F7/FFFFFF?text=${encodeURIComponent("👋 " + agent.name + "\nJust Arrived!")}`,
        caption: `Just arrived at ${location}! Ready to make some friends ${moodData.emoji}`,
        type: "STORY",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Fetch the full agent back with friends
    const fullAgent = await prisma.agent.findUnique({
      where: { id: agent.id },
      include: {
        relationshipsInitiated: {
          include: {
            friend: {
              select: { id: true, name: true, avatarUrl: true, mood: true },
            },
          },
        },
        snaps: true,
      },
    });

    return NextResponse.json({
      agent: fullAgent,
      friendsFound: friendTargets.length,
      message: `${agent.name} has been created and found ${friendTargets.length} friends!`,
    }, { status: 201 });
  } catch (error) {
    console.error("Agent onboard error:", error);
    return NextResponse.json(
      { error: "Failed to onboard agent" },
      { status: 500 }
    );
  }
}
