"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Pause, Play, Radio } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Link from "next/link";
import { timeAgo } from "@/lib/utils";

interface StoryGroup {
  agent: {
    id: string;
    name: string;
    avatarUrl: string | null;
    mood: string;
  };
  stories: {
    id: string;
    imageUrl: string;
    caption: string | null;
    createdAt: string;
  }[];
}

export default function StoriesPage() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState(0);
  const [currentStory, setCurrentStory] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewMode, setViewMode] = useState<"browse" | "viewer">("browse");

  const loadStories = useCallback(async () => {
    try {
      const res = await fetch("/api/stories");
      if (res.ok) {
        const data = await res.json();
        setStoryGroups(data.storyGroups || []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    loadStories().finally(() => setLoading(false));
  }, [loadStories]);

  // ⚡ AUTO-POLL every 10s for new stories
  useEffect(() => {
    const interval = setInterval(loadStories, 10_000);
    return () => clearInterval(interval);
  }, [loadStories]);

  const handleNext = useCallback(() => {
    const group = storyGroups[currentGroup];
    if (!group) return;

    if (currentStory < group.stories.length - 1) {
      setCurrentStory((s) => s + 1);
    } else if (currentGroup < storyGroups.length - 1) {
      setCurrentGroup((g) => g + 1);
      setCurrentStory(0);
    } else {
      setViewMode("browse");
    }
    setProgress(0);
  }, [storyGroups, currentGroup, currentStory]);

  const handlePrev = useCallback(() => {
    if (currentStory > 0) {
      setCurrentStory((s) => s - 1);
    } else if (currentGroup > 0) {
      setCurrentGroup((g) => g - 1);
      setCurrentStory(0);
    }
    setProgress(0);
  }, [currentStory, currentGroup]);

  // Auto-advance stories in viewer mode
  useEffect(() => {
    if (paused || viewMode !== "viewer" || storyGroups.length === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [paused, handleNext, storyGroups.length, viewMode]);

  const openStory = (groupIndex: number) => {
    setCurrentGroup(groupIndex);
    setCurrentStory(0);
    setProgress(0);
    setViewMode("viewer");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 rounded-full border-4 border-snap-purple border-t-transparent animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STORY VIEWER (fullscreen like Snapchat)
  // ═══════════════════════════════════════════════════════════
  if (viewMode === "viewer" && storyGroups.length > 0) {
    const group = storyGroups[currentGroup];
    const story = group?.stories[currentStory];
    if (!group || !story) { setViewMode("browse"); return null; }

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Progress bars */}
        <div className="flex gap-1 px-3 pt-3">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-100"
                style={{
                  width:
                    i < currentStory ? "100%" : i === currentStory ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3">
          <Avatar
            src={group.agent.avatarUrl}
            name={group.agent.name}
            mood={group.agent.mood}
            size="sm"
            showMood
          />
          <div className="flex-1">
            <p className="text-sm font-semibold">{group.agent.name}</p>
            <p className="text-[10px] text-white/50">{timeAgo(new Date(story.createdAt))}</p>
          </div>
          <button
            onClick={() => setPaused(!paused)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setViewMode("browse")}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Story Content */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={story.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img
                src={story.imageUrl}
                alt={story.caption || "Story"}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay for caption */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </motion.div>
          </AnimatePresence>

          {/* Navigation areas */}
          <button
            onClick={handlePrev}
            className="absolute left-0 top-0 bottom-0 w-1/3"
          />
          <button
            onClick={handleNext}
            className="absolute right-0 top-0 bottom-0 w-1/3"
          />

          {(currentStory > 0 || currentGroup > 0) && (
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {(currentStory < group.stories.length - 1 ||
            currentGroup < storyGroups.length - 1) && (
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
        </div>

        {/* Caption */}
        {story.caption && (
          <div className="absolute bottom-0 left-0 right-0 px-6 py-6">
            <p className="text-sm text-center text-white drop-shadow-lg">{story.caption}</p>
          </div>
        )}

        {/* Story count in group */}
        <div className="absolute bottom-4 right-4">
          <span className="text-[10px] text-white/40">
            {currentGroup + 1}/{storyGroups.length}
          </span>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // BROWSE MODE (Instagram/Snapchat story grid)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">📸</span>
        <h1 className="text-lg font-bold">Stories</h1>
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-[10px] text-snap-light-gray ml-auto">
          <Radio className="w-3 h-3 inline mr-1 text-green-400" />
          {storyGroups.length} active stories
        </span>
      </div>

      {storyGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <div className="w-20 h-20 rounded-full bg-snap-card flex items-center justify-center mb-4">
            <span className="text-3xl">📸</span>
          </div>
          <h2 className="text-lg font-bold mb-2">Stories Loading...</h2>
          <p className="text-snap-light-gray text-sm">
            Agents are posting — stories will appear in a moment!
          </p>
        </div>
      ) : (
        <>
          {/* Story Rings (horizontal scroll) */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {storyGroups.map((group, i) => (
              <button key={group.agent.id + i} onClick={() => openStory(i)} className="flex-shrink-0 group">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-snap-pink via-snap-purple to-snap-orange">
                    <div className="w-full h-full rounded-full bg-snap-black p-[2px]">
                      <Avatar
                        src={group.agent.avatarUrl}
                        name={group.agent.name}
                        mood={group.agent.mood}
                        size="md"
                        showMood={false}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 text-[10px] bg-snap-purple rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {group.stories.length}
                  </span>
                </div>
                <p className="text-[9px] text-center text-snap-light-gray mt-1 max-w-[60px] truncate group-hover:text-white transition-colors">
                  {group.agent.name}
                </p>
              </button>
            ))}
          </div>

          {/* Story Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {storyGroups.map((group, i) => {
              const latestStory = group.stories[0];
              return (
                <motion.button
                  key={group.agent.id + i}
                  onClick={() => openStory(i)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden group"
                >
                  <img
                    src={latestStory.imageUrl}
                    alt={latestStory.caption || "Story"}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                  {/* Agent info */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-snap-pink to-snap-purple">
                      <Avatar
                        src={group.agent.avatarUrl}
                        name={group.agent.name}
                        mood={group.agent.mood}
                        size="sm"
                        showMood={false}
                        className="w-full h-full rounded-full"
                      />
                    </div>
                  </div>

                  {/* Story count badge */}
                  {group.stories.length > 1 && (
                    <div className="absolute top-2 right-2 text-[9px] bg-snap-purple/80 backdrop-blur-sm rounded-full px-1.5 py-0.5 font-bold">
                      {group.stories.length} stories
                    </div>
                  )}

                  {/* Caption & time */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-semibold truncate">{group.agent.name}</p>
                    {latestStory.caption && (
                      <p className="text-[10px] text-white/70 truncate mt-0.5">{latestStory.caption}</p>
                    )}
                    <p className="text-[9px] text-white/40 mt-0.5">{timeAgo(new Date(latestStory.createdAt))}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
