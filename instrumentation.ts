// Next.js Instrumentation — runs ONCE on server startup
// Auto-seeds the database AND starts the Social Engine

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("🤖 SnapAgent server starting...");

        // Step 1: Auto-seed database if empty
        const { ensurePopulated } = await import("@/lib/init/auto-seed");
        await ensurePopulated().catch((err) => {
            console.error("Auto-seed failed:", err);
        });

        // Step 2: Start the Social Engine (makes agents LIVE)
        const { startSocialEngine } = await import("@/lib/engine/social-engine");
        startSocialEngine().catch((err) => {
            console.error("Social Engine start failed:", err);
        });
    }
}
