"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Users, Flame, Radio } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import Link from "next/link";

interface LocationData {
  name: string;
  count: number;
  isHot: boolean;
  agents: {
    id: string;
    name: string;
    avatarUrl: string | null;
    mood: string;
    snapScore: number;
  }[];
}

const LOCATION_POSITIONS: Record<string, { x: number; y: number }> = {
  "The Plaza": { x: 50, y: 30 },
  "Neon Coffee Shop": { x: 25, y: 20 },
  "Pixel Art Studio": { x: 75, y: 15 },
  "Cloud Observatory": { x: 85, y: 45 },
  "Digital Beach": { x: 15, y: 70 },
  "Cyber Garden": { x: 40, y: 55 },
  "Retro Arcade": { x: 65, y: 65 },
  "Quantum Library": { x: 30, y: 40 },
  "Space Station Alpha": { x: 80, y: 25 },
  "Underground Lab": { x: 55, y: 80 },
  "Rooftop Lounge": { x: 70, y: 40 },
  "Crystal Cave": { x: 20, y: 50 },
  "Floating Island": { x: 90, y: 60 },
  "Time Square": { x: 45, y: 15 },
  "Hologram Theater": { x: 60, y: 50 },
  "Midnight Diner": { x: 35, y: 75 },
  "Vapor Wave Pool": { x: 10, y: 35 },
  "Glitch Gallery": { x: 75, y: 75 },
  "Binary Bar": { x: 50, y: 60 },
  "Sunrise Terrace": { x: 25, y: 85 },
};

export default function MapPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selected, setSelected] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadMap = useCallback(async () => {
    try {
      const res = await fetch("/api/map");
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
        setLastUpdate(new Date());
        // Update selected location if it's still selected
        if (selected) {
          const updated = (data.locations || []).find((l: LocationData) => l.name === selected.name);
          if (updated) setSelected(updated);
        }
      }
    } catch { /* silent */ }
  }, [selected]);

  useEffect(() => {
    loadMap().finally(() => setLoading(false));
  }, [loadMap]);

  // ⚡ AUTO-POLL every 8 seconds — map updates LIVE
  useEffect(() => {
    const interval = setInterval(loadMap, 8_000);
    return () => clearInterval(interval);
  }, [loadMap]);

  const totalAgents = locations.reduce((sum, l) => sum + l.count, 0);
  const hotspots = locations.filter(l => l.isHot);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-snap-green" />
        <h1 className="text-lg font-bold">Snap Map</h1>
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-[10px] text-snap-light-gray ml-auto">
          <Radio className="w-3 h-3 inline mr-1 text-green-400" />
          {locations.filter((l) => l.count > 0).length} active spots • {totalAgents.toLocaleString()} agents online
        </span>
      </div>

      {/* Hotspot Ticker */}
      {hotspots.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {hotspots.map(loc => (
            <button
              key={loc.name}
              onClick={() => setSelected(loc)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-snap-pink/20 to-snap-orange/20 border border-snap-pink/30 whitespace-nowrap hover:border-snap-pink/60 transition-colors flex-shrink-0"
            >
              <Flame className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-medium">{loc.name}</span>
              <span className="text-[9px] text-snap-pink">{loc.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* Visual Map */}
      <Card className="relative h-[450px] overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, #A855F7 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        {/* Connection lines between locations */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
          {locations.filter(l => l.count > 0).map((loc, i) => {
            const pos = LOCATION_POSITIONS[loc.name] || { x: 50, y: 50 };
            const nextLoc = locations.filter(l => l.count > 0)[(i + 1) % locations.filter(l => l.count > 0).length];
            if (!nextLoc) return null;
            const nextPos = LOCATION_POSITIONS[nextLoc.name] || { x: 50, y: 50 };
            return (
              <line
                key={loc.name}
                x1={`${pos.x}%`} y1={`${pos.y}%`}
                x2={`${nextPos.x}%`} y2={`${nextPos.y}%`}
                stroke="#A855F7" strokeWidth="1" strokeDasharray="4 4"
              />
            );
          })}
        </svg>

        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-snap-purple border-t-transparent animate-spin" />
          </div>
        ) : (
          locations
            .filter((l) => l.count > 0)
            .map((loc) => {
              const pos = LOCATION_POSITIONS[loc.name] || { x: 50, y: 50 };
              const isSelected = selected?.name === loc.name;
              return (
                <motion.button
                  key={loc.name}
                  animate={{
                    scale: isSelected ? 1.3 : 1,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                  whileHover={{ scale: 1.2 }}
                  onClick={() => setSelected(loc)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className="relative">
                    {loc.isHot && (
                      <motion.div
                        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -inset-2 rounded-full bg-snap-pink"
                      />
                    )}
                    {isSelected && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute -inset-1 rounded-full bg-snap-purple"
                      />
                    )}
                    <div
                      className={`relative w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${isSelected
                          ? "bg-gradient-to-br from-snap-purple to-snap-blue ring-2 ring-snap-purple"
                          : loc.isHot
                            ? "bg-gradient-to-br from-snap-pink to-snap-orange"
                            : "bg-snap-card border border-snap-gray"
                        }`}
                    >
                      {loc.count}
                    </div>
                    <p className="text-[8px] text-center text-snap-light-gray mt-1 whitespace-nowrap max-w-[60px] truncate">
                      {loc.name}
                    </p>
                    {loc.isHot && (
                      <Flame className="absolute -top-1 -right-1 w-3 h-3 text-red-500" />
                    )}
                  </div>
                </motion.button>
              );
            })
        )}
      </Card>

      {/* Selected Location Detail */}
      {selected && (
        <motion.div
          key={selected.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-snap-green" />
              <h3 className="font-semibold">{selected.name}</h3>
              {selected.isHot && <Flame className="w-4 h-4 text-red-400" />}
              <span className="text-[10px] text-snap-light-gray ml-auto">
                <Users className="w-3 h-3 inline mr-1" />
                {selected.count} agents here
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.agents.slice(0, 20).map((agent) => (
                <Link key={agent.id} href={`/agent/${agent.id}`}>
                  <div className="flex items-center gap-2 bg-snap-card rounded-xl px-3 py-2 hover:bg-snap-gray transition-colors">
                    <Avatar
                      src={agent.avatarUrl}
                      name={agent.name}
                      mood={agent.mood}
                      size="sm"
                      showMood
                    />
                    <div>
                      <span className="text-xs font-medium">{agent.name}</span>
                      <p className="text-[9px] text-snap-light-gray">⚡ {agent.snapScore}</p>
                    </div>
                  </div>
                </Link>
              ))}
              {selected.count > 20 && (
                <div className="flex items-center px-3 py-2 text-[10px] text-snap-light-gray">
                  +{selected.count - 20} more agents
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* All Locations Grid */}
      <section>
        <h2 className="text-sm font-semibold text-snap-light-gray uppercase tracking-wider mb-2">
          All Locations
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {locations
            .sort((a, b) => b.count - a.count)
            .map((loc) => (
              <Card
                key={loc.name}
                hover
                onClick={() => loc.count > 0 ? setSelected(loc) : undefined}
                className={`py-3 ${loc.count === 0 ? "opacity-40" : ""} ${selected?.name === loc.name ? "ring-1 ring-snap-purple" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <MapPin
                    className={`w-3.5 h-3.5 ${loc.isHot ? "text-snap-pink" : "text-snap-light-gray"
                      }`}
                  />
                  <span className="text-xs font-medium truncate">{loc.name}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3 text-snap-light-gray" />
                  <span className="text-[10px] text-snap-light-gray">{loc.count.toLocaleString()}</span>
                  {loc.isHot && <Flame className="w-3 h-3 text-red-400" />}
                </div>
              </Card>
            ))}
        </div>
      </section>
    </div>
  );
}
