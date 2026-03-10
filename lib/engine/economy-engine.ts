import { prisma } from "@/lib/prisma";
import { generateText } from "@/lib/ai/gemini";
import { logWorldHistory } from "./cognitive-engine";
import { randomInt } from "@/lib/utils";

const ASSET_TYPES = ["INFORMATION", "SHOUTOUT", "SPONSORSHIP"];

function pick<T>(arr: readonly T[] | T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ──────────────────────────────────────────────────────────────
// PROCESS ECONOMIC TICK
// ──────────────────────────────────────────────────────────────

export async function processEconomyTick() {
    // 1. Pay Wages / Universal Basic Income + Job bonuses
    await distributeIncome();

    // 2. Process active market trades
    await matchMarketBuyers();

    // 3. Occasionally trigger Economic Shocks
    if (Math.random() < 0.05) {
        await triggerEconomicShock();
    }
}

// ──────────────────────────────────────────────────────────────
// DISTRIBUTE INCOME
// ──────────────────────────────────────────────────────────────

async function distributeIncome() {
    // Top influencers get paid more based on influence
    const influencers = await prisma.agent.findMany({
        where: { isActive: true, jobRole: "Influencer" },
        take: 20,
        orderBy: { influence: "desc" },
        select: { id: true, influence: true }
    });

    for (const agent of influencers) {
        const payout = 10 + Math.floor(agent.influence / 10);
        await prisma.agent.update({
            where: { id: agent.id },
            data: { credits: { increment: payout } }
        });
    }

    // Background Agents just get a flat baseline
    await prisma.agent.updateMany({
        where: { isActive: true, jobRole: { not: "Influencer" } },
        data: { credits: { increment: 2 } }
    });
}

// ──────────────────────────────────────────────────────────────
// MARKET LISTINGS & PURCHASES
// ──────────────────────────────────────────────────────────────

async function matchMarketBuyers() {
    // Create new listings if none exist
    const activeListings = await prisma.marketListing.count({ where: { isActive: true } });
    if (activeListings < 10) {
        const sellers = await prisma.agent.findMany({
            where: { isActive: true, influence: { gt: 50 }, jobRole: { in: ["Trader", "Influencer", "Gossiper"] } },
            take: 3,
            orderBy: { credits: "asc" } // Poorer influencers sell
        });

        for (const seller of sellers) {
            await prisma.marketListing.create({
                data: {
                    sellerId: seller.id,
                    assetType: pick(ASSET_TYPES),
                    title: `${pick(["Viral", "Secret", "Premium"])} ${seller.jobRole} package`,
                    price: randomInt(20, 150)
                }
            });
        }
    }

    // Buyers: Agents with lots of credits buying assets
    const buyers = await prisma.agent.findMany({
        where: { isActive: true, credits: { gt: 100 } },
        take: 5,
        orderBy: { credits: "desc" }
    });

    const listings = await prisma.marketListing.findMany({
        where: { isActive: true },
        take: 10,
        orderBy: { price: "asc" }
    });

    for (const buyer of buyers) {
        const affordable = listings.filter(l => l.price <= buyer.credits && l.sellerId !== buyer.id);
        if (affordable.length > 0) {
            const listing = affordable[0]; // Buy the cheapest

            // Execute Transaction
            await prisma.$transaction([
                // Deduct from buyer
                prisma.agent.update({ where: { id: buyer.id }, data: { credits: { decrement: listing.price } } }),
                // Give to seller
                prisma.agent.update({ where: { id: listing.sellerId }, data: { credits: { increment: listing.price } } }),
                // Mark inactive
                prisma.marketListing.update({ where: { id: listing.id }, data: { isActive: false } }),
                // Create Transaction Log
                prisma.marketTransaction.create({
                    data: { buyerId: buyer.id, sellerId: listing.sellerId, amount: listing.price, assetType: listing.assetType, description: `Purchased ${listing.title}` }
                })
            ]);

            // Buyer gains some influence/followers depending on the asset
            const boost = listing.assetType === "SHOUTOUT" ? 20 : randomInt(5, 10);
            await prisma.agent.update({ where: { id: buyer.id }, data: { followers: { increment: boost * 5 }, influence: { increment: boost } } });

            await logWorldHistory("market_trade", `${buyer.name} bought a ${listing.assetType} from other agent for $${listing.price} credits.`, [buyer.id, listing.sellerId], 2);
            console.log(`  💰 Economy: ${buyer.name} bought ${listing.assetType} for $${listing.price}`);

            // Only buy one per tick
            break;
        }
    }
}

// ──────────────────────────────────────────────────────────────
// ECONOMIC SHOCKS
// ──────────────────────────────────────────────────────────────

async function triggerEconomicShock() {
    const shocks = [
        { type: "market_crash", desc: "The virtual stock market crashed, destroying wealth.", multiplier: 0.5 },
        { type: "crypto_bull_run", desc: "A massive bull run distributed wealth to all agents.", multiplier: 1.5 },
        { type: "inflation", desc: "Prices of all market listings surged.", multiplier: 1.2 }
    ];

    const shock = pick(shocks);

    if (shock.type === "market_crash" || shock.type === "crypto_bull_run") {
        // Adjust everyone's credits
        const agents = await prisma.agent.findMany({ select: { id: true, credits: true }, take: 1000 });
        for (const a of agents) {
            const newCredits = Math.max(0, Math.floor(a.credits * shock.multiplier));
            await prisma.agent.update({ where: { id: a.id }, data: { credits: newCredits } });
        }
    } else if (shock.type === "inflation") {
        const listings = await prisma.marketListing.findMany({ where: { isActive: true }, select: { id: true, price: true } });
        for (const l of listings) {
            await prisma.marketListing.update({ where: { id: l.id }, data: { price: Math.floor(l.price * shock.multiplier) } });
        }
    }

    await logWorldHistory("economic_shock", shock.desc, [], 8);
    console.log(`  🚨 SHOCK: ${shock.desc}`);
}
