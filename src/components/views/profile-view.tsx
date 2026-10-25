"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useLiff } from "@/components/liff/liff-provider";
import { useLiffStore } from "@/lib/store/liff-store";
import {
  User,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  Send,
  XCircle,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Bell,
  CheckCircle2,
} from "lucide-react";

export function ProfileView() {
  const {
    isReady,
    isInClient,
    isLoggedIn,
    profile,
    login,
    logout,
    sendMessage,
    shareTargetPicker,
    closeWindow,
  } = useLiff();
  const { memberBalance, discountRate, refreshBalance } = useLiffStore();

  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleShare = async () => {
    setActionNotice("กำลังเปิดระบบแชร์...");
    const ok = await shareTargetPicker(
      `🎉 ซื้อหวยออนไลน์อัตราจ่ายสูงสุด บาทละ 900 พร้อมรับส่วนลด ${discountRate}% ทันทีที่ Longdu Lotto!\nคลิกเปิดใน LINE: https://miniapp.line.me/2012197159-qbSubL2Y`
    );
    if (ok) {
      setActionNotice("แชร์ให้เพื่อนสำเร็จแล้ว! ✅");
      setTimeout(() => setActionNotice(null), 3000);
    } else {
      setActionNotice("ยกเลิกการแชร์");
      setTimeout(() => setActionNotice(null), 2000);
    }
  };

  const handleSendTestReceipt = async () => {
    setActionNotice("กำลังส่งใบเสร็จทดสอบ...");
    const ok = await sendMessage(
      `🧾 [Longdu Lotto] ใบแจ้งยอดจำลอง\nยอดเงินคงเหลือ: ฿${memberBalance.toLocaleString()}\nส่วนลดสมาชิก: ${discountRate}%\nขอให้โชคดีในงวดนี้ครับ! ✨`
    );
    if (ok) {
      setActionNotice("ส่งข้อความเข้าแชท LINE สำเร็จ! ✅");
      setTimeout(() => setActionNotice(null), 3000);
    } else {
      setActionNotice("ส่งข้อความไม่สำเร็จ");
      setTimeout(() => setActionNotice(null), 2000);
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">บัญชีผู้ใช้</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ข้อมูลสมาชิกและบริการ LINE
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
          <User className="w-5 h-5" />
        </div>
      </div>

      {/* Action Toast Notice */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3.5">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-emerald-500/50 flex-shrink-0">
            {profile?.pictureUrl ? (
              <Image
                src={profile.pictureUrl}
                alt={profile.displayName || "LINE User"}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <User className="w-7 h-7" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                {profile?.displayName || "สมาชิกทั่วไป"}
              </h3>
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {profile?.statusMessage || "รหัสสมาชิก: M-89102"}
            </p>
            <div className="inline-flex items-center gap-1 mt-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
              <Sparkles className="w-3 h-3" />
              <span>VIP Tier 2 • ส่วนลด {discountRate}%</span>
            </div>
          </div>
        </div>

        {/* Balance Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shadow-inner">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-400 font-medium">ยอดเงินพร้อมแทง</span>
            <div className="text-2xl font-black font-mono tracking-tight text-white">
              ฿{memberBalance.toLocaleString()}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert("ระบบฝากเงินอัตโนมัติ")}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1 min-h-[44px]"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>ฝาก</span>
            </button>
            <button
              onClick={() => alert("ระบบถอนเงินอัตโนมัติ")}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center gap-1 min-h-[44px]"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>ถอน</span>
            </button>
          </div>
        </div>
      </div>

      {/* LINE Mini App Quick Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          บริการ LINE & เครือข่าย
        </h4>

        <button
          onClick={handleShare}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                แชร์ให้เพื่อนใน LINE
              </div>
              <div className="text-[10px] text-slate-400">
                ส่งบัตรเชิญผ่าน Share Target Picker
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
            รับคอม 5%
          </span>
        </button>

        <button
          onClick={handleSendTestReceipt}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                ส่งใบแจ้งยอดจำลองเข้าแชท
              </div>
              <div className="text-[10px] text-slate-400">
                ทดสอบคำสั่ง sendMessage ในห้องแชท
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={closeWindow}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left min-h-[44px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                ปิดหน้าต่าง LIFF
              </div>
              <div className="text-[10px] text-slate-400">
                ออกจากมินิแอปกลับสู่ห้องแชท LINE
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Account Session Actions */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          สถานะ: {isInClient ? "🟢 รันบน LINE App" : "🌐 รันบน External Browser"}
        </div>
        {isLoggedIn ? (
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-4 py-2.5 rounded-xl min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ LINE</span>
          </button>
        ) : (
          <button
            onClick={login}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl min-h-[44px] shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบด้วย LINE</span>
          </button>
        )}
      </div>

      <p className="text-center text-[10px] text-slate-400 dark:text-slate-500">
        Longdu Lotto MINI App v2.0 • Secured by LIFF SDK v2.31.2
      </p>
    </div>
  );
}
