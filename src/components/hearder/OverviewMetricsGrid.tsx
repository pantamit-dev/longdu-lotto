"use client";

import React from "react";
import { HearderMetricSummary } from "@/types/lottery";
import { TrendingUp, ShieldAlert, Award, Wallet, DollarSign, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverviewMetricsGridProps {
  metrics: HearderMetricSummary;
}

export function OverviewMetricsGrid({ metrics }: OverviewMetricsGridProps) {
  const betCategories = [
    { label: "2 ตัวบน", value: metrics.twoTopTotal, color: "text-emerald-400" },
    { label: "2 ตัวล่าง", value: metrics.twoDownTotal, color: "text-teal-400" },
    { label: "2 ตัวโต๊ด", value: metrics.twoTodTotal, color: "text-amber-400" },
    { label: "3 ตัวบน", value: metrics.threeTopTotal, color: "text-cyan-400" },
    { label: "3 ตัวล่าง", value: metrics.threeDownTotal, color: "text-blue-400" },
    { label: "3 ตัวโต๊ด", value: metrics.threeTodTotal, color: "text-orange-400" },
    { label: "วิ่งบน", value: metrics.runTopTotal, color: "text-purple-400" },
    { label: "วิ่งล่าง", value: metrics.runDownTotal, color: "text-pink-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Financial Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Gross Bet */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">
              ยอดแทงรวมทั้งระบบ (Gross Bet)
            </span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-white mt-1 tabular-nums">
              ฿{metrics.totalGrossBet.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Commission Outflow */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400">
              ส่วนแบ่งคอมมิชชั่น Admin
            </span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-amber-400 mt-1 tabular-nums">
              -฿{metrics.totalCommission.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Net Bet Inflow */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-300">
              ยอดสุทธิดูแลรับผิดชอบ (Net Bet)
            </span>
            <div className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-400 mt-1 tabular-nums">
              ฿{metrics.totalNetBet.toLocaleString()}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 8-Category Tabular Volume Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>ยอดแทงแยกตาม 8 หมวดหมู่หลัก (Tabular Nums)</span>
          </h3>
          <span className="text-[10px] text-slate-400">Real-Time Aggregation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {betCategories.map((cat) => (
            <div
              key={cat.label}
              className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col justify-between"
            >
              <span className="text-[11px] font-medium text-slate-400">
                {cat.label}
              </span>
              <div
                className={cn(
                  "text-lg font-mono font-bold mt-1.5 tabular-nums",
                  cat.color
                )}
              >
                ฿{cat.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

