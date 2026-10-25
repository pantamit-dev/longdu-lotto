"use client";

import React from "react";
import { useLiffStore } from "@/lib/store/liff-store";
import { useLiff } from "@/components/liff/liff-provider";
import {
  Ticket,
  Trophy,
  Share2,
  TrendingUp,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Bell,
  CheckCircle2,
} from "lucide-react";

export function HomeView() {
  const { setActiveTab, period, discountRate } = useLiffStore();
  const { shareTargetPicker } = useLiff();

  const handleShare = async () => {
    await shareTargetPicker(
      `🎉 มาแทงหวย Longdu Lotto ผ่าน LINE MINI App ด้วยกัน!\nอัตราจ่ายสูงสุด ฿900 ส่วนลดสมาชิก ${discountRate}%\nเปิดแอป: https://miniapp.line.me/2012197159-qbSubL2Y`
    );
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Quick Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Buy Lottery Hero CTA */}
        <button
          onClick={() => setActiveTab("bet")}
          className="col-span-2 relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-500 text-white p-4 rounded-2xl shadow-md shadow-emerald-500/20 flex items-center justify-between group active:scale-[0.99] transition-transform text-left"
        >
          <div className="space-y-1 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>เปิดรับแทงแล้ว</span>
            </span>
            <h3 className="text-lg font-extrabold tracking-tight">ซื้อหวยงวดนี้</h3>
            <p className="text-xs text-emerald-100 font-medium">
              คีย์ง่าย รวดเร็ว 3 ตัว ฿900 ส่วนลด {discountRate}%
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0 group-hover:scale-105 transition-transform">
            <Ticket className="w-7 h-7" />
          </div>
        </button>

        {/* Check Results Card */}
        <button
          onClick={() => setActiveTab("results")}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm text-left hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">ตรวจรางวัล</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ผลสลากงวดล่าสุด</p>
          </div>
        </button>

        {/* Share with Friends Card */}
        <button
          onClick={handleShare}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm text-left hover:border-emerald-500/50 transition-colors flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">แชร์ชวนเพื่อน</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">ส่งต่อผ่าน LINE Chat</p>
          </div>
        </button>
      </div>

      {/* Payout Rates Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">อัตราจ่ายเงินรางวัล</h3>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">สูงสุดในไทย</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400 font-medium">3 ตัวบน</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">บาทละ 900</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400 font-medium">3 ตัวโต๊ด</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">บาทละ 150</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400 font-medium">2 ตัวบน / ล่าง</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">บาทละ 95</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-600 dark:text-slate-400 font-medium">วิ่งบน / วิ่งล่าง</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">3.2 / 4.2</span>
          </div>
        </div>
      </div>

      {/* LINE Notification Feature Alert */}
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-3.5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bell className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs">
          <h4 className="font-bold text-emerald-900 dark:text-emerald-300">
            แจ้งเตือนผลรางวัลผ่าน LINE OA ทันที
          </h4>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
            ระบบจะส่งข้อความแจ้งเตือนผลสลากและใบสรุปเงินรางวัลเข้าห้องแชท LINE ของคุณอัตโนมัติเมื่อออกรางวัลเสร็จสิ้น
          </p>
        </div>
      </div>
    </div>
  );
}
