"use client";

import React from "react";
import { Delete } from "lucide-react";

interface NumpadProps {
  onPress: (digit: string) => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function Numpad({ onPress, onDelete, onClear, disabled = false }: NumpadProps) {
  const keys = [
    { label: "1", val: "1" },
    { label: "2", val: "2" },
    { label: "3", val: "3" },
    { label: "4", val: "4" },
    { label: "5", val: "5" },
    { label: "6", val: "6" },
    { label: "7", val: "7" },
    { label: "8", val: "8" },
    { label: "9", val: "9" },
    { label: "C", val: "clear", isAction: true },
    { label: "0", val: "0" },
    { label: "del", val: "delete", isAction: true, isDel: true },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 w-full select-none" role="region" aria-label="แป้นพิมพ์ตัวเลข">
      {keys.map((k) => {
        if (k.val === "clear") {
          return (
            <button
              key={k.label}
              type="button"
              disabled={disabled}
              onClick={onClear}
              className="min-h-[50px] sm:min-h-[54px] rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-sm border border-rose-200/60 dark:border-rose-900/40 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
              aria-label="ล้างทั้งหมด"
            >
              ล้าง
            </button>
          );
        }

        if (k.val === "delete") {
          return (
            <button
              key={k.label}
              type="button"
              disabled={disabled}
              onClick={onDelete}
              className="min-h-[50px] sm:min-h-[54px] rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
              aria-label="ลบตัวเลข"
            >
              <Delete className="w-5 h-5 stroke-[2.2]" />
            </button>
          );
        }

        return (
          <button
            key={k.label}
            type="button"
            disabled={disabled}
            onClick={() => onPress(k.val)}
            className="min-h-[50px] sm:min-h-[54px] rounded-2xl bg-white dark:bg-slate-850 text-slate-900 dark:text-white font-mono font-black text-2xl border border-slate-200 dark:border-slate-750 shadow-sm active:scale-95 active:bg-slate-100 dark:active:bg-slate-700 transition-all flex items-center justify-center disabled:opacity-40"
          >
            {k.label}
          </button>
        );
      })}
    </div>
  );
}
