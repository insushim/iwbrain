"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  reward: string;
}

interface AchievementListProps {
  achievements: Achievement[];
  unlockedIds: string[];
}

const CATEGORIES = [
  "전체",
  "일반",
  "논리력",
  "기억력",
  "주의력",
  "언어력",
  "연산력",
  "공간력",
];

export default function AchievementList({
  achievements,
  unlockedIds,
}: AchievementListProps) {
  const [activeCategory, setActiveCategory] = useState("전체");

  const unlockedSet = new Set(unlockedIds);

  const filtered =
    activeCategory === "전체"
      ? achievements
      : achievements.filter((a) => a.category === activeCategory);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Count */}
      <div style={{ fontSize: "14px", color: "#888", fontWeight: 600 }}>
        달성 {unlockedIds.length}/{achievements.length}
      </div>

      {/* Category filter tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              background: activeCategory === cat ? "#6C5CE7" : "#f0f0f0",
              color: activeCategory === cat ? "#fff" : "#666",
              transition: "all 0.2s ease",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
        }}
      >
        {filtered.map((achievement) => {
          const unlocked = unlockedSet.has(achievement.id);
          return (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: unlocked ? "#fff" : "#f5f5f5",
                borderRadius: "14px",
                padding: "16px",
                boxShadow: unlocked ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                filter: unlocked ? "none" : "grayscale(1)",
                opacity: unlocked ? 1 : 0.6,
                position: "relative",
                overflow: "hidden",
                cursor: "default",
              }}
            >
              {/* Lock overlay for locked achievements */}
              {!unlocked && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    fontSize: "18px",
                  }}
                >
                  🔒
                </div>
              )}

              <div style={{ fontSize: "28px", marginBottom: "8px" }}>
                {unlocked ? achievement.icon : "❓"}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#333",
                  marginBottom: "4px",
                }}
              >
                {achievement.title}
              </div>

              {unlocked && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#888",
                    lineHeight: 1.4,
                  }}
                >
                  {achievement.description}
                </div>
              )}

              {unlocked && (
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "11px",
                    color: "#6C5CE7",
                    fontWeight: 600,
                  }}
                >
                  {achievement.reward}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
