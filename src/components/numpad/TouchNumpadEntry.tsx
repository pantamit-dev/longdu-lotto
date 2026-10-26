"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { LottoMode } from "@/types/lottery";
import { DigitSlotDisplay } from "./DigitSlotDisplay";
import {
  Tag,
  Sparkles,
  RotateCcw,
  Delete,
  Eye,
  Check,
  Zap,
} from "lucide-react";

interface TouchNumpadEntryProps {
  ticketName: string;
  setTicketName: (val: string) => void;
  mode: LottoMode;
  setMode: (mode: LottoMode) => void;
  inputDigits: string;
  requiredLength: number;
  price: number;
  setPrice: (price: number) => void;
  // 2-digit toggles
  twoTop: boolean;
  setTwoTop: (val: boolean) => void;
  twoDown: boolean;
  setTwoDown: (val: boolean) => void;
  twoTod: boolean;
  setTwoTod: (val: boolean) => void;
  twoAutoSwap: boolean;
  setTwoAutoSwap: (val: boolean) => void;
  // 3-digit toggles
  threeTop: boolean;
  setThreeTop: (val: boolean) => void;
  threeTod: boolean;
  setThreeTod: (val: boolean) => void;
  threeDown: boolean;
  setThreeDown: (val: boolean) => void;
  threeAutoSwap: boolean;
  setThreeAutoSwap: (val: boolean) => void;
  // run toggles
  runTop: boolean;
  setRunTop: (val: boolean) => void;
  runDown: boolean;
  setRunDown: (val: boolean) => void;
  // 19door toggles
  doorType: "19door" | "front" | "back";
  setDoorType: (val: "19door" | "front" | "back") => void;
  doorTop: boolean;
  setDoorTop: (val: boolean) => void;
  doorDown: boolean;
  setDoorDown: (val: boolean) => void;
  // Feedback & cart
  isFlashGreen: boolean;
  cartItemCount: number;
  grossBetTotal: number;
  onOpenCartModal: () => void;
  // Handlers
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

const PRESET_CUSTOMERS = [
  "ป้าสมศรี หน้าร้าน",
  "วินมอเตอร์ไซค์",
  "เจ๊ณี ตลาดสด",
  "เฮียไก่ ปากซอย",
  "ทั่วไป",
];

const PRICE_PRESETS = [10, 20, 50, 100];

export function TouchNumpadEntry({
  ticketName,
  setTicketName,
  mode,
  setMode,
  inputDigits,
  requiredLength,
  price,
  setPrice,
  twoTop,
  setTwoTop,
  twoDown,
  setTwoDown,
  twoTod,
  setTwoTod,
  twoAutoSwap,
  setTwoAutoSwap,
  threeTop,
  setThreeTop,
  threeTod,
  setThreeTod,
  threeDown,
  setThreeDown,
  threeAutoSwap,
  setThreeAutoSwap,
  runTop,
  setRunTop,
  runDown,
  setRunDown,
  doorType,
  setDoorType,
  doorTop,
  setDoorTop,
  doorDown,
  setDoorDown,
  isFlashGreen,
  cartItemCount,
  grossBetTotal,
  onOpenCartModal,
  onDigitPress,
  onBackspace,
  onClear,
}: TouchNumpadEntryProps) {
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const modeLabels: Record<LottoMode, string> = {
    "2digit": "2 ตัว",
    "3digit": "3 ตัว",
    run: "เลขวิ่ง",
    "19door": "19 ประตู / รูด",
  };

  return (
    <div className="w-full flex flex-col space-y-3.5 pb-24 select-none">
      {/* 1. Ticket Name Header */}
      <div className="relative bg-slate-900/80 border border-slate-800 rounded-2xl p-3 shadow-sm">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5 font-medium">
          <label htmlFor="ticket-name-input" className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            <span>ชื่อโพย / ชื่อลูกค้า (Customer Tag)</span>
          </label>
          <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
            Admin Entry
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="ticket-name-input"
            type="text"
            value={ticketName}
            onChange={(e) => setTicketName(e.target.value)}
            placeholder="ระบุชื่อโพย เช่น ป้าสมศรี หน้าร้าน"
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
          />
          <button
            type="button"
            onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            เลือกลูกค้า
          </button>
        </div>

        {/* Dropdown for preset customers */}
        {showCustomerDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-2 z-20 flex flex-wrap gap-1.5">
            {PRESET_CUSTOMERS.map((cust) => (
              <button
                key={cust}
                type="button"
                onClick={() => {
                  setTicketName(cust);
                  setShowCustomerDropdown(false);
                }}
                className={cn(
                  "px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors",
                  ticketName === cust
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                )}
              >
                {cust}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Mode Selection Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
        {(["2digit", "3digit", "run", "19door"] as LottoMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "py-2.5 text-xs font-bold rounded-xl transition-all duration-150 text-center flex items-center justify-center gap-1",
              mode === m
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
          >
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* 3. Subtype Toggles */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2.5">
        {mode === "2digit" && (
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setTwoTop(!twoTop)}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1",
                twoTop
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              )}
            >
              {twoTop && <Check className="w-3.5 h-3.5" />} 2 ตัวบน
            </button>
            <button
              type="button"
              onClick={() => setTwoDown(!twoDown)}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1",
                twoDown
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              )}
            >
              {twoDown && <Check className="w-3.5 h-3.5" />} 2 ตัวล่าง
            </button>
            <button
              type="button"
              onClick={() => setTwoTod(!twoTod)}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1",
                twoTod
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              )}
            >
              {twoTod && <Check className="w-3.5 h-3.5" />} 2 ตัวโต๊ด
            </button>
            <button
              type="button"
              onClick={() => setTwoAutoSwap(!twoAutoSwap)}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1",
                twoAutoSwap
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> กลับเลข
            </button>
          </div>
        )}

        {mode === "3digit" && (
          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setThreeTop(!threeTop)}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1",
                threeTop
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              )}
            >
              {threeTop && <Check className="w-3.5 h-3.5" />} 3 ตัวบน
            </button>
            <button
              type="button"
              onClick={() => setThreeTod(!threeTod)}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1",
                threeTod
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              )}
            >
              {threeTod && <Check className="w-3.5 h-3.5" />} 3 ตัวโต๊ด
            </button>
            <button
              type="button"
              onClick={() => setThreeDown(!threeDown)}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1",
                threeDown
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              )}
            >
              {threeDown && <Check className="w-3.5 h-3.5" />} 3 ตัวล่าง
            </button>
            <button
              type="button"
              onClick={() => setThreeAutoSwap(!threeAutoSwap)}
              className={cn(
                "py-2 px-1 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1",
                threeAutoSwap
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 6 กลับ
            </button>
          </div>
        )}

        {mode === "run" && (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRunTop(!runTop)}
              className={cn(
                "py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5",
                runTop
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              )}
            >
              {runTop && <Check className="w-4 h-4" />} วิ่งบน (บาทละ 3.2)
            </button>
            <button
              type="button"
              onClick={() => setRunDown(!runDown)}
              className={cn(
                "py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5",
                runDown
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm"
                  : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
              )}
            >
              {runDown && <Check className="w-4 h-4" />} วิ่งล่าง (บาทละ 4.2)
            </button>
          </div>
        )}

        {mode === "19door" && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDoorType("19door")}
                className={cn(
                  "py-2 text-xs font-bold rounded-xl border transition-all",
                  doorType === "19door"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
                )}
              >
                19 ประตู
              </button>
              <button
                type="button"
                onClick={() => setDoorType("front")}
                className={cn(
                  "py-2 text-xs font-bold rounded-xl border transition-all",
                  doorType === "front"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
                )}
              >
                รูดหน้า (10 ตัว)
              </button>
              <button
                type="button"
                onClick={() => setDoorType("back")}
                className={cn(
                  "py-2 text-xs font-bold rounded-xl border transition-all",
                  doorType === "back"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
                )}
              >
                รูดหลัง (10 ตัว)
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDoorTop(!doorTop)}
                className={cn(
                  "py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1",
                  doorTop
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                )}
              >
                {doorTop && <Check className="w-3.5 h-3.5" />} 2 ตัวบน
              </button>
              <button
                type="button"
                onClick={() => setDoorDown(!doorDown)}
                className={cn(
                  "py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1",
                  doorDown
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                )}
              >
                {doorDown && <Check className="w-3.5 h-3.5" />} 2 ตัวล่าง
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Price Chips */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
          ราคา/ตัว:
        </span>
        {PRICE_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPrice(p)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all tabular-nums border",
              price === p
                ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800"
            )}
          >
            +{p}฿
          </button>
        ))}
        <div className="flex items-center ml-auto">
          <input
            type="number"
            value={price || ""}
            onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value, 10) || 0))}
            className="w-16 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-xs text-center font-mono font-bold text-white tabular-nums"
          />
          <span className="text-xs text-slate-400 ml-1">฿</span>
        </div>
      </div>

      {/* 5. Digit Slot Display */}
      <DigitSlotDisplay
        digits={inputDigits}
        requiredLength={requiredLength}
        isFlashGreen={isFlashGreen}
        modeLabel={modeLabels[mode]}
      />

      {/* 6. High-Speed Touch Numpad Grid */}
      <div className="grid grid-cols-3 gap-2.5 pt-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => onDigitPress(digit.toString())}
            aria-label={`Digit ${digit}`}
            className="h-14 sm:h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-2xl font-bold font-mono text-white border border-slate-800 shadow-sm flex items-center justify-center transition-transform cursor-pointer"
          >
            {digit}
          </button>
        ))}

        {/* Clear (ล้าง) */}
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear digits"
          className="h-14 sm:h-16 rounded-2xl bg-rose-950/40 hover:bg-rose-900/50 active:scale-95 text-xs font-bold text-rose-300 border border-rose-900/40 shadow-sm flex flex-col items-center justify-center gap-1 transition-transform cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 text-rose-400" />
          <span>ล้าง</span>
        </button>

        {/* 0 */}
        <button
          type="button"
          onClick={() => onDigitPress("0")}
          aria-label="Digit 0"
          className="h-14 sm:h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-2xl font-bold font-mono text-white border border-slate-800 shadow-sm flex items-center justify-center transition-transform cursor-pointer"
        >
          0
        </button>

        {/* Backspace (⌫) */}
        <button
          type="button"
          onClick={onBackspace}
          aria-label="Backspace"
          className="h-14 sm:h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 text-sm font-bold text-amber-400 border border-slate-800 shadow-sm flex items-center justify-center transition-transform cursor-pointer"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* 7. Floating Bottom Summary Bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto px-4 z-30 pointer-events-none">
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3 shadow-2xl flex items-center justify-between pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium">
              ตะกร้าโพย ({cartItemCount} รายการ)
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold font-mono text-white tabular-nums">
                ฿{grossBetTotal.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                (ยอดดิบ)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCartModal}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-4 h-4" />
            <span>ดูรายการโพย</span>
          </button>
        </div>
      </div>
    </div>
  );
}
