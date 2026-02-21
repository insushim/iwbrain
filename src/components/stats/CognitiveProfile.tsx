"use client";

interface Scores {
  logic: number;
  memory: number;
  attention: number;
  language: number;
  math: number;
  spatial: number;
}

interface CognitiveProfileProps {
  scores: Scores;
}

const AREAS: {
  key: keyof Scores;
  name: string;
  icon: string;
  color: string;
}[] = [
  { key: "logic", name: "논리력", icon: "🔢", color: "#0984E3" },
  { key: "memory", name: "기억력", icon: "🧩", color: "#E84393" },
  { key: "attention", name: "주의력", icon: "🎨", color: "#00CEC9" },
  { key: "language", name: "언어력", icon: "📝", color: "#6C5CE7" },
  { key: "math", name: "연산력", icon: "⚡", color: "#FDCB6E" },
  { key: "spatial", name: "공간력", icon: "🏗️", color: "#00B894" },
];

export default function CognitiveProfile({ scores }: CognitiveProfileProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "12px",
      }}
    >
      {AREAS.map(({ key, name, icon, color }) => {
        const score = Math.min(100, Math.max(0, Math.round(scores[key])));
        return (
          <div
            key={key}
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "22px" }}>{icon}</span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                {name}
              </span>
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color,
              }}
            >
              {score}
            </div>
            <div
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "3px",
                background: "#f0f0f0",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${score}%`,
                  height: "100%",
                  borderRadius: "3px",
                  background: color,
                  transition: "width 0.6s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
