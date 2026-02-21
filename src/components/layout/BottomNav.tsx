"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const tabs = [
  {
    path: "/",
    label: "홈",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
  },
  {
    path: "/play",
    label: "플레이",
    icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    path: "/daily",
    label: "데일리",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    path: "/stats",
    label: "통계",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    path: "/settings",
    label: "설정",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const isGamePage =
    pathname.startsWith("/play/") && pathname.split("/").length > 2;
  if (isGamePage) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-[var(--bg-card)] border-[var(--border)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
    >
      <div className="mx-auto max-w-[480px] flex items-center justify-around px-2 pt-1">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className="relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px]"
              aria-label={tab.label}
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1 w-8 h-0.5 rounded-full bg-[#6C5CE7]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <svg
                className="w-6 h-6 transition-colors"
                fill="none"
                stroke={active ? "#6C5CE7" : "var(--text-muted)"}
                strokeWidth={active ? 2.5 : 2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={tab.icon}
                />
              </svg>
              <span
                className="text-[10px] mt-0.5 font-medium transition-colors"
                style={{ color: active ? "#6C5CE7" : "var(--text-muted)" }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
