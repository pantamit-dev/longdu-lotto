"use client";

import React, { useState } from "react";
import { useLiff } from "@/components/liff/liff-provider";
import { useLiffStore, LottoOrder } from "@/lib/store/liff-store";
import {
  CheckCircle2,
  Send,
  Share2,
  FileText,
  XCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface OrderSuccessSheetProps {
  order: LottoOrder | null;
  onClose: () => void;
}

export function OrderSuccessSheet({ order, onClose }: OrderSuccessSheetProps) {
  const { sendMessage, shareTargetPicker, closeWindow } = useLiff();
  const { setActiveTab } = useLiffStore();
  const [sendNotice, setSendNotice] = useState<string | null>(null);

  if (!order) return null;

  const handleSendReceiptToChat = async () => {
    setSendNotice("กำลังส่งใบเสร็จเข้าห้องแชท LINE...");

    // Format lottery receipt message
    const lines = [
      `🧾 [Longdu Lotto] ใบเสร็จรับเงินสำเร็จ`,
      `━━━━━━━━━━━━━━━━━━`,
      `รหัสคำสั่งซื้อ: #${order.orderNo}`,
      `งวดวันที่: ${order.periodName}`,
      `เวลาทำรายการ: ${order.createdAt}`,
      `จำนวนทั้งหมด: ${order.totalItems} รายการ`,
      `━━━━━━━━━━━━━━━━━━`,
      `ยอดแทงรวม: ฿${order.totalAmount.toLocaleString()}`,
      `ส่วนลดสมาชิก VIP: -฿${order.discountAmount.toLocaleString()}`,
      `ยอดชำระสุทธิ: ฿${order.netAmount.toLocaleString()}`,
      `━━━━━━━━━━━━━━━━━━`,
      `สถานะ: 🟡 รอผลออกรางวัล`,
      `ขอให้โชคดีถูกรางวัลใหญ่ครับ! 🎉✨`,
    ];

    const messageText = lines.join("\n");
    const ok = await sendMessage(messageText);

    if (ok) {
      setSendNotice("ส่งใบเสร็จเข้าแชท LINE เรียบร้อยแล้ว! ✅");
      setTimeout(() => setSendNotice(null), 3000);
    } else {
      setSendNotice("ส่งข้อความไม่สำเร็จ (สามารถเปิดดูในแท็บโพยของฉันได้ตลอดเวลา)");
      setTimeout(() => setSendNotice(null), 3000);
    }
  };

  const handleShareWithFriends = async () => {
    setSendNotice("กำลังเปิดหน้าต่างแชร์...");
    const shareText = `🎉 ผมเพิ่งส่งโพยหวยงวด ${order.periodName} ที่ Longdu Lotto ไปเรียบร้อยแล้ว!\nรับอัตราจ่ายสูงสุด บาทละ 900 พร้อมส่วนลด 12%\nคลิกมาเปิดเล่นด้วยกันใน LINE: https://miniapp.line.me/2012197159-qbSubL2Y`;

    const ok = await shareTargetPicker(shareText);
    if (ok) {
      setSendNotice("แชร์ให้เพื่อนสำเร็จแล้ว! ✅");
      setTimeout(() => setSendNotice(null), 3000);
    } else {
      setSendNotice("ยกเลิกการแชร์");
      setTimeout(() => setSendNotice(null), 2000);
    }
  };

  const handleGoToHistory = () => {
    onClose();
    setActiveTab("history");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ overscrollBehavior: "contain" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-sheet-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Celebration Header */}
        <div className="pt-8 pb-5 px-6 text-center bg-gradient-to-b from-emerald-500/15 to-transparent">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
          </div>
          <h3 id="success-sheet-title" className="text-xl font-black text-slate-900 dark:text-white">
            ส่งโพยสำเร็จแล้ว!
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ระบบบันทึกโพยและตัดยอดเงินในระบบเรียบร้อย
          </p>
        </div>

        {/* Notice feedback */}
        {sendNotice && (
          <div className="mx-5 mb-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold text-center animate-in fade-in">
            {sendNotice}
          </div>
        )}

        {/* Receipt Card */}
        <div className="px-5 py-2 space-y-3 overflow-y-auto overscroll-contain">
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">รหัสโพย</span>
              <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                #{order.orderNo}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">งวดวันที่</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {order.periodName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-medium">จำนวนรายการ</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {order.totalItems} รายการ
              </span>
            </div>
            <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>ส่วนลดสมาชิก VIP (-12%)</span>
              <span className="font-mono">-฿{order.discountAmount.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
              <span className="font-black text-slate-900 dark:text-white">ยอดชำระสุทธิ</span>
              <div className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                ฿{order.netAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Send Receipt to LINE Chat */}
            <button
              type="button"
              onClick={handleSendReceiptToChat}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 min-h-[46px]"
            >
              <Send className="w-4 h-4" />
              <span>ส่งใบเสร็จเข้าแชท LINE (Chat Receipt)</span>
            </button>

            {/* Share to friends */}
            <button
              type="button"
              onClick={handleShareWithFriends}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 min-h-[46px]"
            >
              <Share2 className="w-4 h-4" />
              <span>แชร์เลขเด็ดให้เพื่อนใน LINE</span>
            </button>

            {/* View My Orders */}
            <button
              type="button"
              onClick={handleGoToHistory}
              className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 min-h-[46px]"
            >
              <FileText className="w-4 h-4" />
              <span>ดูโพยของฉันในหน้ารายการ</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 py-1"
          >
            ซื้อหวยเพิ่ม / ปิดหน้านี้
          </button>
        </div>
      </div>
    </div>
  );
}
