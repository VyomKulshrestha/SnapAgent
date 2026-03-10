import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { path: string } }) {
    try {
        const path = params.path;

        if (path === 'agents') {
            const data = await prisma.agent.findMany({ select: { id: true, name: true, mood: true, currentGoal: true, reputation: true, influence: true, factionId: true }, take: 200, orderBy: { influence: 'desc' } });
            return NextResponse.json(data);
        }

        if (path === 'factions') {
            const data = await prisma.faction.findMany({ select: { id: true, name: true, ideology: true, influence: true, _count: { select: { members: true } } } });
            return NextResponse.json(data);
        }

        if (path === 'events') {
            const data = await prisma.worldEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
            return NextResponse.json(data);
        }

        if (path === 'history') {
            const data = await prisma.worldHistory.findMany({ orderBy: { timestamp: 'desc' }, take: 100 });
            return NextResponse.json(data);
        }

        if (path === 'social-graph') {
            const data = await prisma.relationship.findMany({ select: { agentId: true, friendAgentId: true, status: true, trust: true }, take: 500 });
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
    } catch (err) {
        return NextResponse.json({ error: "Failed to load simulation data" }, { status: 500 });
    }
}
