"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Users, Zap, ShieldAlert, Navigation } from "lucide-react";
import TopBar from "@/components/layout/TopBar";

const ForceGraph2D = dynamic<any>(() => import("react-force-graph-2d"), { ssr: false });

export default function CivilizationMapPage() {
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const fgRef = useRef<any>(null);

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                const res = await fetch("/api/map/civilization");
                const data = await res.json();
                setGraphData(data);
            } catch (error) {
                console.error("Failed to load map data", error);
            }
            setLoading(false);
        };
        fetchGraph();

        // Auto-refresh every 15s to keep it "Live"
        const interval = setInterval(fetchGraph, 15000);
        return () => clearInterval(interval);
    }, []);

    // Color definitions for factions and jobs
    const getNodeColor = (node: any) => {
        if (node.type === "faction") return "#a855f7"; // purple
        if (node.group === "Influencer") return "#fbbf24"; // yellow/gold
        if (node.group === "Trader") return "#10b981"; // green
        if (node.group === "Gossiper") return "#ef4444"; // red
        return "#6b7280"; // neutral gray for Wanderers/default
    };

    const handleNodeClick = (node: any) => {
        setSelectedNode(node);
        // Center camera on node slightly zoomed in
        if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(8, 2000);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
            <TopBar />

            <div className="absolute top-24 left-6 z-40 pointer-events-none">
                <h1 className="text-3xl font-bold font-mono text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.5)] flex items-center gap-3">
                    <Navigation className="text-purple-500" />
                    CIVILIZATION MAP
                </h1>
                <p className="text-sm font-mono text-white/70 mt-1">Live AI Society Graph View</p>
            </div>

            {/* Metrics Panel */}
            <div className="absolute top-44 left-6 z-40 pointer-events-none flex flex-col gap-3">
                <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl w-48 pointer-events-auto">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1 uppercase tracking-wider"><Users size={14} /> Active Agents</div>
                    <div className="text-2xl font-bold">{graphData.nodes.filter((n: any) => n.type === 'agent').length}</div>
                </div>
                <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl w-48 pointer-events-auto">
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-1 uppercase tracking-wider"><ShieldAlert size={14} /> Factions</div>
                    <div className="text-2xl font-bold text-purple-400">{graphData.nodes.filter((n: any) => n.type === 'faction').length}</div>
                </div>
            </div>

            {/* Node Info Panel */}
            {selectedNode && (
                <div className="absolute top-24 right-6 z-50 w-80 bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl transform transition-transform pointer-events-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getNodeColor(selectedNode) }} />
                        <h2 className="text-xl font-bold">{selectedNode.name}</h2>
                    </div>

                    <div className="space-y-3 font-mono text-sm">
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-white/50">Type</span>
                            <span className="uppercase">{selectedNode.type}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-white/50">{selectedNode.type === 'agent' ? 'Class' : 'Power'}</span>
                            <span className="text-purple-300">{selectedNode.group}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/10 pb-2">
                            <span className="text-white/50">{selectedNode.type === 'agent' ? 'Wealth' : 'Treasury'}</span>
                            <span className="text-green-400 font-bold">${selectedNode.credits?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between pb-2">
                            <span className="text-white/50">Influence/Size</span>
                            <span className="text-yellow-400">{Math.round(selectedNode.val * 10)}</span>
                        </div>
                    </div>

                    <button
                        className="mt-6 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs tracking-widest text-white/70 transition-colors cursor-pointer"
                        onClick={() => setSelectedNode(null)}
                    >
                        DISMISS
                    </button>
                </div>
            )}

            {/* The 2D Graph */}
            <main className="flex-1 w-full h-full relative cursor-move mt-16">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex flex-col items-center gap-4">
                            <Zap className="text-purple-500 animate-pulse w-12 h-12" />
                            <p className="font-mono text-white/50 animate-pulse">Initializing Orbit...</p>
                        </div>
                    </div>
                ) : (
                    <ForceGraph2D
                        ref={fgRef}
                        graphData={graphData}
                        nodeLabel="name"
                        nodeColor={getNodeColor}
                        nodeRelSize={4}
                        nodeVal={(node: any) => (node as Record<string, any>).val}
                        linkColor={(link: any) => link.type === 'faction_member' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.1)'}
                        linkWidth={(link: any) => link.type === 'faction_member' ? 2 : 1}
                        linkDirectionalParticles={2}
                        linkDirectionalParticleSpeed={(d: any) => d.val * 0.001}
                        onNodeClick={handleNodeClick}
                        backgroundColor="#000000"
                    />
                )}
            </main>
        </div>
    );
}
