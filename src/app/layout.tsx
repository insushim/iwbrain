"use client";

import "./globals.css";
import { useEffect } from "react";
import BottomNav from "@/components/layout/BottomNav";
import { useSettingsStore } from "@/stores/settingsStore";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings, init: initSettings } = useSettingsStore();

  useEffect(() => {
    initSettings();
  }, [initSettings]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      root.classList.toggle("dark", mq.matches);
      const handler = (e: MediaQueryListEvent) =>
        root.classList.toggle("dark", e.matches);
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      root.classList.toggle("dark", settings.darkMode === true);
    }
  }, [settings.darkMode]);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#6C5CE7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta
          name="description"
          content="매일 5분, 6가지 게임으로 두뇌를 깨워요"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512.png"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512.png"
          media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/icon-512.png"
          media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)"
        />
        <title>NeuroFlex - 두뇌 트레이닝</title>
      </head>
      <body className="min-h-dvh bg-[var(--bg)]">
        <div className="mx-auto max-w-[480px] min-h-dvh pb-20">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
