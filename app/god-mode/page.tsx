"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import BottomNav from "@/components/layout/BottomNav";
import { Activity, Zap, TrendingUp, Users, AlertTriangle, ShieldAlert, Sparkles, MessageCircleWarning } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GodModePage() {
    const [actionLog, setActionLog] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const logAction = (msg: string) => {
        setActionLog(prev => [msg, ...prev].slice(0, 10)); // Keep last 10 logs
    };

    const triggerAction = async (action: string, payload: any = {}) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/god-mode/action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, payload })
            });
            const data = await res.json();
            if (data.success) {
                logAction(`✅ Triggered: ${data.message || action}`);
            } else {
                logAction(`❌ Failed: ${data.error || action}`);
            }
        } catch (e: any) {
            logAction(`❌ Error: ${e.message}`);
        }
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col h-screen bg-neutral-950 text-white font-sans overflow-hidden">
            <TopBar />

            <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3 bg-red-950/30 p-4 border border-red-900/50 rounded-2xl">
                    <div className="p-3 bg-red-500/20 rounded-full text-red-500">
                        <AlertTriangle size={28} className="animate-pulse" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-mono tracking-widest text-red-400">GOD MODE ACTIVE</h2>
                        <p className="text-sm text-neutral-400">Inject events directly into the simulation. Actions cannot be undone.</p>
                    </div>
                </div>

                {/* Event Injection Grid */}
                <section>
                    <h3 className="text-sm font-semibold text-neutral-500 tracking-wider mb-3 uppercase">World Events</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            disabled={isLoading}
                            onClick={() => triggerAction("SPAWN_AGENTS", { count: 10 })}
                            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                            <Users className="text-blue-400" size={24} />
                            <span className="text-sm font-medium">Spawn 10 Agents</span>
                        </button>

                        <button
                            disabled={isLoading}
                            onClick={() => triggerAction("SPAWN_SLANG")}
                            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                            <Sparkles className="text-fuchsia-400" size={24} />
                            <span className="text-sm font-medium">Inject New Slang</span>
                        </button>

                        <button
                            disabled={isLoading}
                            onClick={() => triggerAction("START_RUMOR")}
                            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                            <MessageCircleWarning className="text-orange-400" size={24} />
                            <span className="text-sm font-medium">Start Global Rumor</span>
                        </button>

                        <button
                            disabled={isLoading}
                            onClick={() => triggerAction("CREATE_FACTION")}
                            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                            <ShieldAlert className="text-emerald-400" size={24} />
                            <span className="text-sm font-medium">Forge New Faction</span>
                        </button>
                    </div>
                </section>

                <section>
                    <h3 className="text-sm font-semibold text-neutral-500 tracking-wider mb-3 uppercase">Economy & Status</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            disabled={isLoading}
                            onClick={() => triggerAction("RICH_AGENT")}
                            className="bg-gradient-to-br from-yellow-900/40 to-yellow-600/20 hover:from-yellow-800/50 border border-yellow-700/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                            <Zap className="text-yellow-400" size={24} />
                            <span className="text-sm font-medium text-yellow-200">Bless Agent (Wealth)</span>
                        </button>

                        <button
                            disabled={isLoading}
                            onClick={() => triggerAction("TRIGGER_ECON_SHOCK")}
                            className="bg-gradient-to-br from-red-900/40 to-red-600/20 hover:from-red-800/50 border border-red-700/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50">
                            <TrendingUp className="text-red-400" size={24} />
                            <span className="text-sm font-medium text-red-200">Economic Shock</span>
                        </button>
                    </div>
                </section>

                {/* God Log */}
                <section>
                    <h3 className="text-sm font-semibold text-neutral-500 tracking-wider mb-3 uppercase">Intervention Log</h3>
                    <div className="bg-black border border-neutral-800 rounded-xl p-4 min-h-[150px] font-mono text-sm overflow-hidden">
                        <AnimatePresence>
                            {actionLog.length === 0 ? (
                                <p className="text-neutral-600 italic">No interventions yet...</p>
                            ) : (
                                actionLog.map((log, i) => (
                                    <motion.div
                                        key={i + log}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1 - (i * 0.15), x: 0 }}
                                        className={`mb-2 ${i === 0 ? 'text-white font-medium' : 'text-neutral-500'}`}
                                    >
                                        <span className="text-neutral-600 mr-2">{new Date().toLocaleTimeString()}</span>
                                        {log}
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                <div className="h-6"></div>
            </main>

            <BottomNav />
        </div>
    );
}
