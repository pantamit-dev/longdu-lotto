"use client";

import { useState } from "react";
import Image from "next/image";
import { useLiff } from "@/components/liff/liff-provider";
import {
  LogIn,
  LogOut,
  Send,
  Share2,
  XCircle,
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Ticket,
} from "lucide-react";

export default function Home() {
  const {
    isReady,
    isInClient,
    isLoggedIn,
    profile,
    error,
    login,
    logout,
    sendMessage,
    shareTargetPicker,
    closeWindow,
  } = useLiff();

  const [messageInput, setMessageInput] = useState("ขอร่วมสนุกกับ Longdu Lotto ครับ! 🎉");
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  const handleSend = async () => {
    setSendStatus("กำลังส่งข้อความ...");
    const ok = await sendMessage(messageInput);
    if (ok) {
      setSendStatus("ส่งข้อความเข้าแชทสำเร็จ! ✅");
      setTimeout(() => setSendStatus(null), 3000);
    } else {
      setSendStatus("เกิดข้อผิดพลาดในการส่งข้อความ ❌");
    }
  };

  const handleShare = async () => {
    setSendStatus("กำลังเปิดหน้าต่างแชร์...");
    const ok = await shareTargetPicker(
      `🎉 มาเล่น Longdu Lotto ด้วยกันเถอะ!\nคลิกเปิดที่นี่: https://miniapp.line.me/2012197159-qbSubL2Y`
    );
    if (ok) {
      setSendStatus("แชร์ให้เพื่อนสำเร็จ! ✅");
      setTimeout(() => setSendStatus(null), 3000);
    } else {
      setSendStatus("ยกเลิกการแชร์");
      setTimeout(() => setSendStatus(null), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 sm:p-6 max-w-xl mx-auto w-full">
      {/* Header */}
      <header className="w-full text-center py-6 mb-4">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3.5 py-1.5 rounded-full text-sm font-medium mb-3">
          <Ticket className="w-4 h-4" />
          <span>LINE MINI App & LIFF SDK</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Longdu Lotto
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          ระบบหวยและมินิแอปบน LINE Official Account
        </p>
      </header>

      {/* Main Card */}
      <main className="w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        {/* Loading State */}
        {!isReady && !error && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-500 text-sm animate-pulse">
              กำลังเชื่อมต่อ LINE LIFF SDK...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-800 dark:text-amber-300 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              <span>แจ้งเตือนการเชื่อมต่อ LIFF</span>
            </div>
            <p className="text-xs break-words">{error}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              💡 หมายเหตุ: ตรวจสอบว่าใน LINE Developers Console ได้ตั้งค่า Endpoint URL ตรงกับ URL ของเซิร์ฟเวอร์ที่กำลังรันอยู่หรือไม่
            </p>
          </div>
        )}

        {/* Logged In View */}
        {isReady && isLoggedIn && profile && (
          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              {profile.pictureUrl ? (
                <Image
                  src={profile.pictureUrl}
                  alt={profile.displayName}
                  width={64}
                  height={64}
                  className="rounded-full ring-2 ring-emerald-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 font-bold text-xl">
                  {profile.displayName.slice(0, 1)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold truncate text-slate-900 dark:text-white">
                    {profile.displayName}
                  </h2>
                  <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> เชื่อมต่อแล้ว
                  </span>
                </div>
                {profile.statusMessage && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    "{profile.statusMessage}"
                  </p>
                )}
                <p className="text-[11px] text-slate-400 font-mono truncate mt-1">
                  ID: {profile.userId}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ทดสอบการทำงานของ LIFF SDK
              </h3>

              {isInClient && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="flex-1 px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="พิมพ์ข้อความทดสอบ..."
                    />
                    <button
                      onClick={handleSend}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>ส่งแชท</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-medium transition-colors"
                >
                  <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>แชร์ให้เพื่อน</span>
                </button>

                {isInClient ? (
                  <button
                    onClick={closeWindow}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl text-slate-800 dark:text-slate-200 text-sm font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    <span>ปิดหน้าต่าง</span>
                  </button>
                ) : (
                  <button
                    onClick={logout}
                    className="flex items-center justify-center gap-2 p-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400 text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>ออกจากระบบ</span>
                  </button>
                )}
              </div>

              {sendStatus && (
                <p className="text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium py-1 animate-fadeIn">
                  {sendStatus}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Not Logged In View (External Browser) */}
        {isReady && !isLoggedIn && (
          <div className="py-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                ยินดีต้อนรับสู่ Longdu Lotto
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                เปิดจากเบราว์เซอร์ภายนอก โปรดเข้าสู่ระบบด้วยบัญชี LINE เพื่อเริ่มต้นใช้งาน
              </p>
            </div>
            <button
              onClick={login}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#06C755] hover:bg-[#05b34c] active:scale-95 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20"
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบด้วย LINE</span>
            </button>
          </div>
        )}

        {/* Environment Diagnostic Info */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1.5 font-mono">
          <div className="flex justify-between items-center">
            <span>สภาพแวดล้อม:</span>
            <span className="flex items-center gap-1 font-sans text-xs">
              {isInClient ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> LINE App Browser
                </span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> External Browser
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>LIFF ID:</span>
            <span>2012197159-qbSubL2Y</span>
          </div>
        </div>
      </main>

      {/* Footer / Instructions */}
      <footer className="mt-6 text-center text-xs text-slate-400 space-y-1">
        <p>💡 เมื่อนำเว็บขึ้นออนไลน์ ให้ไปแก้ <strong>Endpoint URL</strong> ใน LINE Developers Console</p>
        <p>ให้ตรงกับ Domain HTTPS ของคุณ เพื่อให้กดเปิดจาก LINE ได้โดยตรง</p>
      </footer>
    </div>
  );
}
