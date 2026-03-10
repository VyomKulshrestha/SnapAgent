"use client";

import { motion } from "framer-motion";
import { MapPin, Flame } from "lucide-react";
import Avatar from "@/components/ui/Avatar";

interface Agent {
  id: string;
  name: string;
  avatarUrl: string | null;
  mood: string;
}

interface LocationPin {
  name: string;
  agents: Agent[];
  count: number;
  isHot: boolean;
  position: { x: number; y: number };
}

interface SnapMapProps {
  locations: LocationPin[];
  onLocationClick: (location: LocationPin) => void;
}

export default function SnapMap({ locations, onLocationClick }: SnapMapProps) {
  return (
    <div className="relative w-full h-full">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, #A855F7 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {locations
        .filter((l) => l.count > 0)
        .map((loc) => (
          <motion.button
            key={loc.name}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.2 }}
            onClick={() => onLocationClick(loc)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${loc.position.x}%`, top: `${loc.position.y}%` }}
          >
            <div className="relative">
              {loc.isHot && (
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-snap-pink"
                />
              )}
              <div
                className={`relative flex items-center justify-center rounded-full ${
                  loc.isHot
                    ? "bg-gradient-to-br from-snap-pink to-snap-orange"
                    : "bg-snap-card border border-snap-gray"
                }`}
                style={{ width: 40 + loc.count * 5, height: 40 + loc.count * 5 }}
              >
                {loc.agents.length === 1 ? (
                  <Avatar
                    src={loc.agents[0].avatarUrl}
                    name={loc.agents[0].name}
                    size="sm"
                  />
                ) : (
                  <span className="text-xs font-bold">{loc.count}</span>
                )}
              </div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                <MapPin className="w-2 h-2 text-snap-light-gray" />
                <p className="text-[7px] text-snap-light-gray whitespace-nowrap">
                  {loc.name}
                </p>
                {loc.isHot && <Flame className="w-2 h-2 text-red-400" />}
              </div>
            </div>
          </motion.button>
        ))}
    </div>
  );
}
