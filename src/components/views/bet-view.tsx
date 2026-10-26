"use client";

import React, { useState } from "react";
import { useLotteryCart } from "@/hooks/useLotteryCart";
import { TouchNumpadEntry } from "@/components/numpad/TouchNumpadEntry";
import { CartPreviewModal } from "@/components/numpad/CartPreviewModal";
import { useLiffStore } from "@/lib/store/liff-store";
import { useLiff } from "@/components/liff/liff-provider";
import { TicketBatch } from "@/types/lottery";
import {
  CheckCircle2,
  Send,
  Ticket,
  Share2,
  X,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

export function BetView() {
  const { currentRole, addTicketBatch, period } = useLiffStore();
  const { sendMessage } = useLiff();

  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [submittedBatch, setSubmittedBatch] = useState<TicketBatch | null>(null);
  const [sendNotice, setSendNotice] = useState<string | null>(null);

  const cart = useLotteryCart({
    initialTicketName: "ป้าสมศรี หน้าร้าน",
    adminId: "admin-001",
    commissionRate: 15,
  });

  const handleOpenCart = () => {
    setIsCartModalOpen(true);
  };

  const handleCloseCart = () => {
    setIsCartModalOpen(false);
  };

  const handleSubmitCart = () => {
    const batch = cart.submitBatch((createdBatch) => {
      addTicketBatch(createdBatch);
      setSubmittedBatch(createdBatch);
      setIsCartModalOpen(false);
    });
  };

  const handleSendReceiptToChat = async () => {
    if (!submittedBatch) return;
    setSendNotice("กำลังส่งใบเสร็จเข้าห้องแชท LINE...");

    const receiptLines = [
      `🧾 [Longdu Lotto] ใบส่งโพยเจ้ามือสำเร็จ`,
      `━━━━━━━━━━━━━━━━━━`,
      `ชื่อโพย / ลูกค้า: ${submittedBatch.ticketName}`,
      `งวดวันที่: ${period.drawDate}`,
      `จำนวนรายการ: ${submittedBatch.items.length} รายการ`,
      `━━━━━━━━━━━━━━━━━━`,
      currentRole !== "STUFF"
        ? `ยอดแทงดิบรวม: ฿${submittedBatch.grossAmount.toLocaleString()}\nส่วนลดคอมมิชชั่น Admin: -฿${submittedBatch.commissionAmount.toLocaleString()}\nยอดสุทธินำส่งเจ้ามือ: ฿${submittedBatch.netAmount.toLocaleString()}`
        : `ยอดแทงรวม: ฿${submittedBatch.grossAmount.toLocaleString()}`,
      `━━━━━━━━━━━━━━━━━━`,
      `สถานะ: 🟢 บันทึกส่งเจ้ามือเรียบร้อย`,
    ];

    const ok = await sendMessage(receiptLines.join("\n"));
    if (ok) {
      setSendNotice("ส่งใบเสร็จเข้าแชท LINE สำเร็จแล้ว!");
    } else {
      setSendNotice("จำลองการส่งใบเสร็จสำเร็จ (Preview Mode)");
    }
    setTimeout(() => setSendNotice(null), 3000);
  };

  return (
    <div className="w-full">
      {/* Role Banner Indicator */}
      <div className="mb-3 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white">
            {currentRole === "ADMIN" && "โหมดคนกลาง (Admin High-Speed Numpad)"}
            {currentRole === "STUFF" && "โหมดผู้ช่วย (Stuff Fast Entry - ซ่อนยอดการเงิน)"}
            {currentRole === "MEMBER" && "โหมดผู้ซื้อทั่วไป (Member View)"}
            {currentRole === "HEARDER" && "โหมดเจ้ามือ (Hearder View)"}
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">
          Auto-Commit ON
        </span>
      </div>

      {/* Main High-Speed Touch Numpad */}
      <TouchNumpadEntry
        ticketName={cart.ticketName}
        setTicketName={cart.setTicketName}
        mode={cart.mode}
        setMode={cart.setMode}
        inputDigits={cart.inputDigits}
        requiredLength={cart.requiredLength}
        price={cart.price}
        setPrice={cart.setPrice}
        // 2-digit toggles
        twoTop={cart.twoTop}
        setTwoTop={cart.setTwoTop}
        twoDown={cart.twoDown}
        setTwoDown={cart.setTwoDown}
        twoTod={cart.twoTod}
        setTwoTod={cart.setTwoTod}
        twoAutoSwap={cart.twoAutoSwap}
        setTwoAutoSwap={cart.setTwoAutoSwap}
        // 3-digit toggles
        threeTop={cart.threeTop}
        setThreeTop={cart.setThreeTop}
        threeTod={cart.threeTod}
        setThreeTod={cart.setThreeTod}
        threeDown={cart.threeDown}
        setThreeDown={cart.setThreeDown}
        threeAutoSwap={cart.threeAutoSwap}
        setThreeAutoSwap={cart.setThreeAutoSwap}
        // run toggles
        runTop={cart.runTop}
        setRunTop={cart.setRunTop}
        runDown={cart.runDown}
        setRunDown={cart.setRunDown}
        // 19door toggles
        doorType={cart.doorType}
        setDoorType={cart.setDoorType}
        doorTop={cart.doorTop}
        setDoorTop={cart.setDoorTop}
        doorDown={cart.doorDown}
        setDoorDown={cart.setDoorDown}
        // Feedback & cart
        isFlashGreen={cart.isFlashGreen}
        cartItemCount={cart.items.length}
        grossBetTotal={cart.grossBetTotal}
        onOpenCartModal={handleOpenCart}
        // Handlers
        onDigitPress={cart.handleDigitPress}
        onBackspace={cart.handleBackspace}
        onClear={cart.handleClear}
      />

      {/* 4-Column Cart Modal Preview (modal_panel_preview) */}
      <CartPreviewModal
        isOpen={isCartModalOpen}
        onClose={handleCloseCart}
        ticketName={cart.ticketName}
        adminId={cart.adminId}
        commissionRate={currentRole === "STUFF" ? 0 : cart.commissionRate}
        aggregatedRows={cart.aggregatedRows}
        totalItemCount={cart.items.length}
        grossBetTotal={cart.grossBetTotal}
        commissionAmount={currentRole === "STUFF" ? 0 : cart.commissionAmount}
        netBetTotal={currentRole === "STUFF" ? cart.grossBetTotal : cart.netBetTotal}
        onRemoveRow={cart.removeRowByNumber}
        onClearCart={cart.clearCart}
        onSubmit={handleSubmitCart}
      />

      {/* Submission Success Dialog / Modal */}
      {submittedBatch && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-sm bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                บันทึกส่งโพยสำเร็จ!
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ชื่อโพย: <span className="font-bold text-emerald-400">{submittedBatch.ticketName}</span>
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs text-left">
              <div className="flex justify-between text-slate-400">
                <span>จำนวนตัวเลข:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {submittedBatch.items.length} รายการ
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ยอดแทงรวมดิบ:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  ฿{submittedBatch.grossAmount.toLocaleString()}
                </span>
              </div>
              {currentRole !== "STUFF" && (
                <>
                  <div className="flex justify-between text-emerald-400">
                    <span>ส่วนลดคอมมิชชั่น Admin:</span>
                    <span className="font-mono font-bold tabular-nums">
                      -฿{submittedBatch.commissionAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-white">
                    <span>ยอดสุทธิส่งเจ้ามือ:</span>
                    <span className="font-mono text-emerald-400 tabular-nums">
                      ฿{submittedBatch.netAmount.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
            </div>

            {sendNotice && (
              <p className="text-[11px] text-emerald-400 font-semibold animate-pulse">
                {sendNotice}
              </p>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSendReceiptToChat}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งใบเสร็จเข้าแชท LINE</span>
              </button>

              <button
                type="button"
                onClick={() => setSubmittedBatch(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-bold rounded-xl transition-all"
              >
                คีย์โพยต่อไป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
