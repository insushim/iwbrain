"use client";

import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { useSettingsStore } from "@/stores/settingsStore";
import { clearAllData } from "@/lib/storage";
import Modal from "@/components/ui/Modal";

export default function SettingsPage() {
  const {
    settings,
    init,
    toggleSound,
    toggleVibration,
    setVolume,
    toggleDarkMode,
  } = useSettingsStore();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [showLicenses, setShowLicenses] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  const handleReset = () => {
    clearAllData();
    setShowResetModal(false);
    window.location.reload();
  };

  return (
    <div>
      <Header title="설정" />
      <main className="px-4 py-4 space-y-3">
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] divide-y divide-[var(--border)]">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">사운드</p>
              <p className="text-sm text-[var(--text-secondary)]">
                게임 효과음
              </p>
            </div>
            <button
              onClick={toggleSound}
              className={`w-12 h-7 rounded-full transition-colors relative ${settings.soundEnabled ? "bg-[#6C5CE7]" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.soundEnabled ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">진동</p>
              <p className="text-sm text-[var(--text-secondary)]">
                터치 피드백
              </p>
            </div>
            <button
              onClick={toggleVibration}
              className={`w-12 h-7 rounded-full transition-colors relative ${settings.vibrationEnabled ? "bg-[#6C5CE7]" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${settings.vibrationEnabled ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">볼륨</p>
              <span className="text-sm text-[var(--text-secondary)] font-tabular">
                {settings.soundVolume}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.soundVolume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full accent-[#6C5CE7]"
            />
          </div>

          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">다크 모드</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {settings.darkMode === "system"
                  ? "시스템 설정"
                  : settings.darkMode
                    ? "켜짐"
                    : "꺼짐"}
              </p>
            </div>
            <button
              onClick={toggleDarkMode}
              className="px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-sm font-medium"
            >
              {settings.darkMode === "system"
                ? "&#127763; 시스템"
                : settings.darkMode
                  ? "&#127769; 다크"
                  : "&#9728;&#65039; 라이트"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] divide-y divide-[var(--border)]">
          <button
            onClick={() => setShowInstallGuide(true)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div>
              <p className="font-medium">앱 설치</p>
              <p className="text-sm text-[var(--text-secondary)]">
                홈 화면에 추가
              </p>
            </div>
            <svg
              className="w-5 h-5 text-[var(--text-muted)]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            onClick={() => setShowLicenses(true)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div>
              <p className="font-medium">오픈소스 라이선스</p>
              <p className="text-sm text-[var(--text-secondary)]">
                사용된 오픈소스 소프트웨어
              </p>
            </div>
            <svg
              className="w-5 h-5 text-[var(--text-muted)]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div>
              <p className="font-medium text-[#E17055]">데이터 초기화</p>
              <p className="text-sm text-[var(--text-secondary)]">
                모든 게임 기록이 삭제됩니다
              </p>
            </div>
            <svg
              className="w-5 h-5 text-[#E17055]"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">NeuroFlex v1.0.0</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">MIT License</p>
        </div>
      </main>

      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="데이터 초기화"
      >
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          모든 게임 기록, 업적, 설정이 초기화됩니다. 이 작업은 되돌릴 수
          없습니다.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setShowResetModal(false)}
            className="flex-1 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 font-medium"
          >
            취소
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-2.5 rounded-xl bg-[#E17055] text-white font-medium"
          >
            초기화
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showLicenses}
        onClose={() => setShowLicenses(false)}
        title="오픈소스 라이선스"
      >
        <div className="text-sm text-[var(--text-secondary)] space-y-3 max-h-80 overflow-y-auto">
          {[
            { name: "React", license: "MIT", author: "Meta Platforms, Inc." },
            { name: "Next.js", license: "MIT", author: "Vercel, Inc." },
            { name: "Framer Motion", license: "MIT", author: "Framer B.V." },
            { name: "Zustand", license: "MIT", author: "Paul Henschel" },
            {
              name: "Tailwind CSS",
              license: "MIT",
              author: "Tailwind Labs, Inc.",
            },
            { name: "date-fns", license: "MIT", author: "Sasha Koss" },
            { name: "canvas-confetti", license: "ISC", author: "Kiril Vatev" },
            {
              name: "Pretendard",
              license: "SIL OFL 1.1",
              author: "Kil Hyung-jin",
            },
            { name: "TypeScript", license: "Apache-2.0", author: "Microsoft" },
            { name: "sharp", license: "Apache-2.0", author: "Lovell Fuller" },
            {
              name: "OpenNext Cloudflare",
              license: "MIT",
              author: "OpenNext Contributors",
            },
          ].map((lib) => (
            <div
              key={lib.name}
              className="flex items-center justify-between py-1.5"
            >
              <div>
                <p className="font-medium text-[var(--text-primary)]">
                  {lib.name}
                </p>
                <p className="text-xs">{lib.author}</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 shrink-0">
                {lib.license}
              </span>
            </div>
          ))}
          <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
            이 앱은 위 오픈소스 소프트웨어를 사용하여 제작되었습니다. 각
            라이선스의 전문은 해당 프로젝트의 저장소에서 확인할 수 있습니다.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
        title="앱 설치 방법"
      >
        <div className="text-sm text-[var(--text-secondary)] space-y-3">
          <div>
            <p className="font-medium text-[var(--text-primary)]">
              iOS (Safari)
            </p>
            <p>공유 버튼 &rarr; &quot;홈 화면에 추가&quot;</p>
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">
              Android (Chrome)
            </p>
            <p>메뉴(⋮) &rarr; &quot;홈 화면에 추가&quot;</p>
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">
              PC (Chrome)
            </p>
            <p>주소창 우측 설치 아이콘 클릭</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
