"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useLiff } from "@/components/liff/liff-provider";
import { useLiffStore } from "@/lib/store/liff-store";
import { Wallet, Clock, RefreshCw, Sparkles, User, ShieldCheck } from "lucide-react";

export function TopHeader() {
  const { profile, isLoggedIn } = useLiff();
  const { period, memberBalance, discountRate, refreshBalance } = useLiffStore();
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 4,
    minutes: 32,
    seconds: 15,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time countdown effect
  useEffect(() => {
    const updateCountdown = () => {
      const target = new Date(period.closeTime).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [period.closeTime]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshBalance();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <header className="w-full bg-slate-900 text-white safe-area-top px-4 pt-3 pb-4 border-b border-slate-800 shadow-sm sticky top-0 z-30">
      {/* Top Bar: Profile & Balance */}
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* User Profile */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-emerald-500/40 flex-shrink-0">
            {profile?.pictureUrl ? (
              <Image
                src={profile.pictureUrl}
                alt={profile.displayName || "LINE User"}
                fill
                sizes="36px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                {profile?.displayName || (isLoggedIn ? "สมาชิก LINE" : "ผู้เยี่ยมชม")}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                VIP {discountRate}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>สมาชิกรับรอง</span>
            </p>
          </div>
        </div>

        {/* Member Credit Balance */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1.5 rounded-xl">
          <div className="flex items-center gap-1.5 text-right">
            <Wallet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 font-medium leading-none">เครดิตแทง</p>
              <p className="text-xs font-bold text-white tabular-nums leading-tight mt-0.5">
                ฿{memberBalance.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1 hover:bg-slate-700/60 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="รีเฟรชยอดเงิน"
            aria-label="รีเฟรชยอดเงิน"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Period Banner & Countdown Hero */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-800/90 to-emerald-950/70 border border-emerald-500/30 rounded-2xl p-3 shadow-inner">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wide">
              {period.status === "OPEN" ? "เปิดรับแทง" : "ปิดรับแทง"}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-300">{period.drawDate}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1">
              <span>{period.name}</span>
            </h2>
            <p className="text-[10px] text-emerald-400/90 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3" />
              <span>3 ตัว ฿900 • 2 ตัว ฿95 • ส่วนลด {discountRate}%</span>
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 px-2 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-amber-300 tabular-nums">
              {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
