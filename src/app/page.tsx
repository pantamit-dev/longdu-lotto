"use client";

import React from "react";
import { useLiff } from "@/components/liff/liff-provider";
import { useLiffStore } from "@/lib/store/liff-store";
import { MobileShell } from "@/components/layout/mobile-shell";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HomeView } from "@/components/views/home-view";
import { BetView } from "@/components/views/bet-view";
import { HistoryView } from "@/components/views/history-view";
import { ResultsView } from "@/components/views/results-view";
import { ProfileView } from "@/components/views/profile-view";
import { AlertTriangle, Sparkles } from "lucide-react";

export default function Page() {
  const { isReady, error } = useLiff();
  const { activeTab } = useLiffStore();

  return (
    <MobileShell>
      {/* Top Header */}
      <TopHeader />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-4 w-full">
        {/* Loading state while LIFF SDK initializes */}
        {!isReady && !error && (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-xs animate-pulse">
              กำลังเชื่อมต่อ LINE LIFF SDK...
            </p>
          </div>
        )}

        {/* Informational banner if LIFF encounters configuration error in development */}
        {error && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span>โหมดทดสอบภายนอก LINE (Preview Mode)</span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              LIFF SDK แจ้งเตือน: {error} (แอปยังคงทำงานในโหมดจำลองเพื่อให้ทดสอบ UI ได้อย่างสมบูรณ์)
            </p>
          </div>
        )}

        {/* Dynamic Views based on activeTab */}
        {activeTab === "home" && <HomeView />}
        {activeTab === "bet" && <BetView />}
        {activeTab === "history" && <HistoryView />}
        {activeTab === "results" && <ResultsView />}
        {activeTab === "profile" && <ProfileView />}
      </main>

      {/* 5-Tab Bottom Navigation Bar */}
      <BottomNav />
    </MobileShell>
  );
}
