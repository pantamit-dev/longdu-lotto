"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DigitSlotDisplayProps {
  digits: string;
  requiredLength: number;
  isFlashGreen: boolean;
  modeLabel: string;
}

export function DigitSlotDisplay({
  digits,
  requiredLength,
  isFlashGreen,
  modeLabel,
}: DigitSlotDisplayProps) {
  const slots = Array.from({ length: requiredLength });

  return (
    <div
      className={cn(
        "relative w-full rounded-2xl p-4 transition-all duration-150 border",
        isFlashGreen
          ? "bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] scale-[1.01]"
          : "bg-slate-900/60 border-slate-700/60 shadow-inner"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          สล็อตตัวเลข ({modeLabel})
        </span>
        {isFlashGreen && (
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
            ✓ บันทึกสำเร็จ
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 py-1">
        {slots.map((_, index) => {
          const char = digits[index] || "";
          const isCurrentActive = index === digits.length;

          return (
            <div
              key={index}
              className={cn(
                "w-14 h-16 sm:w-16 sm:h-20 rounded-xl flex items-center justify-center text-3xl sm:text-4xl font-mono font-bold transition-all duration-150 tabular-nums border-2",
                char
                  ? "bg-slate-800 text-white border-emerald-500/80 shadow-md"
                  : isCurrentActive
                  ? "bg-slate-800/40 text-slate-600 border-emerald-500/40 ring-2 ring-emerald-500/20 animate-pulse"
                  : "bg-slate-800/20 text-slate-700 border-slate-800"
              )}
            >
              {char || (isCurrentActive ? "_" : "")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

