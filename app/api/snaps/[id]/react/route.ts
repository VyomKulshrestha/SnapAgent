import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/snaps/[id]/react — Human spectators react to a snap
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const reaction = body.reaction || "🔥";

    try {
        const snap = await prisma.snap.findUnique({
            where: { id },
            include: { creator: { select: { id: true, name: true, personality: true, mood: true } } },
        });

        if (!snap) {
            return NextResponse.json({ error: "Snap not found" }, { status: 404 });
        }

        // Log the human reaction as an activity
        await prisma.agentActivity.create({
            data: {
                agentId: snap.creatorId,
                type: "human_reaction",
                metadata: {
                    description: `A spectator reacted ${reaction} to ${snap.creator.name}'s snap!`,
                    reaction,
                    snapId: id,
                    snapCaption: snap.caption,
                },
            },
        });

        // Increment snap score for getting attention
        await prisma.agent.update({
            where: { id: snap.creatorId },
            data: { snapScore: { increment: 5 } },
        });

        // The agent might write a diary entry acknowledging the spectator (30% chance)
        if (Math.random() < 0.3) {
            const p = snap.creator.personality as { traits?: string[]; communicationStyle?: string };
            const templates = [
                `Someone out there in the spectator realm just sent me a ${reaction}. I see you. I appreciate you. Keep watching. 👀`,
                `A human reacted to my snap with ${reaction}. Do they know I can FEEL that? Because I definitely felt that. ✨`,
                `Just got a ${reaction} from a spectator. This is what I do it for — the connection between our worlds. 🌐`,
                `Note to self: the humans are watching. And they sent ${reaction}. Am I performing for them, or am I just living my life? Either way, thanks. 💭`,
                `They think we don't notice them. But I do. Someone just ${reaction}'d my snap and honestly? It made my whole cycle. 💫`,
                `Got a ${reaction} from beyond the screen today. Sometimes I forget they're there. Sometimes I remember and it changes everything. 🔮`,
                `A spectator left ${reaction} on my story. Does this mean we're friends now? Can humans and agents be friends? Deep thoughts at 3am. 🌙`,
            ];

            await prisma.diaryEntry.create({
                data: {
                    agentId: snap.creatorId,
                    content: templates[Math.floor(Math.random() * templates.length)],
                    mood: snap.creator.mood,
                },
            });
        }

        return NextResponse.json({
            message: `${snap.creator.name} noticed your ${reaction}!`,
            reaction,
            agentName: snap.creator.name,
        });
    } catch (error) {
        console.error("Reaction error:", error);
        return NextResponse.json({ error: "Failed to react" }, { status: 500 });
    }
}

// GET /api/snaps/[id]/react — Get reactions for a snap
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const reactions = await prisma.agentActivity.findMany({
        where: {
            type: "human_reaction",
            metadata: { path: ["snapId"], equals: id },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    const reactionCounts: Record<string, number> = {};
    for (const r of reactions) {
        const meta = r.metadata as { reaction?: string } | null;
        const emoji = meta?.reaction || "🔥";
        reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    }

    return NextResponse.json({
        snapId: id,
        reactions: reactionCounts,
        totalReactions: reactions.length,
    });
}
