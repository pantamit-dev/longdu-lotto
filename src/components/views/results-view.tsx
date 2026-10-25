"use client";

import React, { useState } from "react";
import { useLiffStore } from "@/lib/store/liff-store";
import {
  OfficialDrawResult,
  matchTicketsAgainstDraw,
  AutoCheckReport,
} from "@/lib/engine/lotto-engine";
import {
  Trophy,
  CheckCircle2,
  Search,
  Sparkles,
  AlertCircle,
  Zap,
  Gift,
  X,
  FileCheck2,
} from "lucide-react";

export function ResultsView() {
  const { orders } = useLiffStore();
  const [searchNumber, setSearchNumber] = useState("");
  const [checkResult, setCheckResult] = useState<{
    status: "checked" | "idle";
    won: boolean;
    message: string;
  }>({ status: "idle", won: false, message: "" });

  const [autoReport, setAutoReport] = useState<AutoCheckReport | null>(null);
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);

  // Official GLO draw data
  const officialResult: OfficialDrawResult = {
    period: "งวดประจำวันที่ 16 ตุลาคม 2569",
    firstPrize: "285664",
    frontThree: ["025", "482"],
    backThree: ["113", "726"],
    backTwo: "15",
  };

  const handleAutoCheck = () => {
    const report = matchTicketsAgainstDraw(orders, officialResult);
    setAutoReport(report);
    setIsAutoModalOpen(true);
  };

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchNumber.trim()) return;

    const num = searchNumber.trim();
    if (num === officialResult.backTwo || num === officialResult.firstPrize.slice(-2)) {
      setCheckResult({
        status: "checked",
        won: true,
        message: `ยินดีด้วย! เลข ${num} ตรงกับผลรางวัลเลขท้าย 2 ตัว 🎉 (บาทละ 95)`,
      });
    } else if (
      officialResult.frontThree.includes(num) ||
      officialResult.backThree.includes(num) ||
      num === officialResult.firstPrize.slice(-3)
    ) {
      setCheckResult({
        status: "checked",
        won: true,
        message: `ยินดีด้วย! เลข ${num} ตรงกับผลรางวัลเลข 3 ตัว 🎉 (บาทละ 900)`,
      });
    } else {
      setCheckResult({
        status: "checked",
        won: false,
        message: `เลข ${num} ไม่ตรงกับผลรางวัลในงวดนี้`,
      });
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">ผลสลากกินแบ่ง</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {officialResult.period}
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
          <Trophy className="w-5 h-5" />
        </div>
      </div>

      {/* Auto Check CTA Button */}
      <button
        type="button"
        onClick={handleAutoCheck}
        className="w-full p-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/25 flex items-center justify-between active:scale-98 transition-all min-h-[56px] group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
          </div>
          <div className="text-left">
            <div className="text-sm font-black tracking-tight">
              ตรวจโพยของฉันอัตโนมัติ (Auto-Check)
            </div>
            <div className="text-[11px] text-emerald-100">
              ตรวจสอบทุกโพยในระบบพร้อมคำนวณเงินรางวัลทันที
            </div>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse flex-shrink-0" />
      </button>

      {/* Main Draw Display Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-md space-y-4">
        {/* First Prize */}
        <div className="text-center pb-4 border-b border-slate-800">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>รางวัลที่ 1 (6 หลัก)</span>
          </span>
          <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-white mt-1 text-shadow">
            {officialResult.firstPrize}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">รางวัลละ 6,000,000 บาท</p>
        </div>

        {/* 2 & 3 Digits Grid */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          {/* Back Two */}
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <div className="text-[10px] font-bold text-slate-400 mb-1">2 ตัวล่าง</div>
            <div className="font-mono text-2xl font-black text-amber-400">
              {officialResult.backTwo}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">รางวัลละ 2,000 บาท</div>
          </div>

          {/* Front Three */}
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <div className="text-[10px] font-bold text-slate-400 mb-1">เลขหน้า 3 ตัว</div>
            <div className="font-mono text-base font-black text-white space-x-1">
              {officialResult.frontThree.map((n, i) => (
                <span key={i} className="inline-block">{n}</span>
              ))}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">รางวัลละ 4,000 บาท</div>
          </div>

          {/* Back Three */}
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/60">
            <div className="text-[10px] font-bold text-slate-400 mb-1">เลขท้าย 3 ตัว</div>
            <div className="font-mono text-base font-black text-white space-x-1">
              {officialResult.backThree.map((n, i) => (
                <span key={i} className="inline-block">{n}</span>
              ))}
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5">รางวัลละ 4,000 บาท</div>
          </div>
        </div>
      </div>

      {/* Quick Check Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            ตรวจเลขรางวัลด้วยตนเอง
          </h3>
        </div>

        <form onSubmit={handleManualCheck} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ""))}
            placeholder="พิมพ์เลข 2, 3 หรือ 6 หลัก"
            className="flex-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition-all min-h-[44px] flex items-center justify-center gap-1.5"
          >
            <span>ตรวจ</span>
          </button>
        </form>

        {checkResult.status === "checked" && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in ${
              checkResult.won
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {checkResult.won ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            )}
            <p className="font-semibold leading-relaxed">{checkResult.message}</p>
          </div>
        )}
      </div>

      {/* Payout Rates Reference */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2.5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          ตารางอัตราจ่ายมาตรฐาน
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">3 ตัวบน</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">บาทละ 900</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">3 ตัวโต๊ด</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">บาทละ 150</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">2 ตัวบน / ล่าง</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">บาทละ 95</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-slate-600 dark:text-slate-400">วิ่งบน / ล่าง</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">3.2 / 4.2</span>
          </div>
        </div>
      </div>

      {/* Auto Check Report Modal */}
      {isAutoModalOpen && autoReport && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ overscrollBehavior: "contain" }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200"
            style={{ overscrollBehavior: "contain" }}
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    ผลการตรวจโพยอัตโนมัติ
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ตรวจทั้งหมด {autoReport.totalOrdersChecked} โพย ({autoReport.totalTicketsChecked} รายการ)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAutoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Body */}
            <div className="p-5 space-y-4 overflow-y-auto overscroll-contain">
              {/* Prize Summary Box */}
              {autoReport.winningTicketsCount > 0 ? (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-4 shadow-md text-center space-y-1">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-100">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>ยินดีด้วย! คุณถูกรางวัล {autoReport.winningTicketsCount} รายการ</span>
                  </span>
                  <div className="font-mono text-3xl font-black text-amber-300">
                    +฿{autoReport.totalPrizeWon.toLocaleString()}
                  </div>
                  <p className="text-[10px] text-emerald-100">
                    ยอดเงินรางวัลเข้ากระเป๋าของคุณเรียบร้อยแล้ว
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-center space-y-1">
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    ไม่พบรายการถูกรางวัลในงวดนี้
                  </p>
                  <p className="text-xs text-slate-400">
                    ขอให้โชคดีในงวดถัดไปครับ! ✨
                  </p>
                </div>
              )}

              {/* Winning Items List */}
              {autoReport.winningItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    รายการที่ถูกรางวัล
                  </h4>
                  {autoReport.winningItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                          <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                            {item.number}
                          </span>
                          <span>• {item.type}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {item.ruleExplanation} ({item.orderNo})
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                          +฿{item.prizeAmount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          (แทง ฿{item.price} x {item.payoutRate})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAutoModalOpen(false)}
                className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-2xl"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
