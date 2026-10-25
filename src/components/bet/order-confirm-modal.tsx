"use client";

import React from "react";
import { useLiffStore } from "@/lib/store/liff-store";
import { calculateTotals } from "@/lib/engine/lotto-engine";
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Wallet,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface OrderConfirmModalProps {
  onSuccess: () => void;
}

export function OrderConfirmModal({ onSuccess }: OrderConfirmModalProps) {
  const {
    basket,
    discountRate,
    memberBalance,
    period,
    isConfirmModalOpen,
    setIsConfirmModalOpen,
    submitOrder,
  } = useLiffStore();

  if (!isConfirmModalOpen) return null;

  const { subtotal, discountAmount, netTotal, itemCount } = calculateTotals(basket, discountRate);
  const remainingBalance = memberBalance - netTotal;
  const isInsufficient = remainingBalance < 0;

  const handleConfirm = () => {
    const res = submitOrder();
    if (res.success) {
      onSuccess();
    } else {
      alert(res.error || "เกิดข้อผิดพลาดในการส่งโพย");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ overscrollBehavior: "contain" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => setIsConfirmModalOpen(false)}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 id="confirm-modal-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                ยืนยันการส่งโพย
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {period.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsConfirmModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto overscroll-contain">
          {/* Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-750 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">จำนวนตัวเลขทั้งหมด</span>
              <span className="font-bold text-slate-900 dark:text-white">{itemCount} รายการ</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">ยอดรวมปกติ</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                ฿{subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400">
              <span className="inline-flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ส่วนลด VIP Tier ({discountRate}%)</span>
              </span>
              <span className="font-mono font-bold">-฿{discountAmount.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                ยอดหักเงินสุทธิ
              </span>
              <div className="font-mono text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ฿{netTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Wallet Balance Check */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Wallet className="w-4 h-4 text-slate-400" />
                <span>ยอดเงินในกระเป๋าของคุณ</span>
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                ฿{memberBalance.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400">ยอดเงินคงเหลือหลังแทง</span>
              <span
                className={`font-mono font-bold ${
                  isInsufficient
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                ฿{remainingBalance.toLocaleString()}
              </span>
            </div>

            {isInsufficient && (
              <div className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>ยอดเงินคงเหลือไม่เพียงพอ กรุณาเติมเงินก่อนทำรายการ</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
            🔒 เมื่อกดยืนยัน ระบบจะบันทึกโพยและตัดยอดเครดิตทันที
          </p>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex gap-2">
          <button
            type="button"
            onClick={() => setIsConfirmModalOpen(false)}
            className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl transition-all min-h-[48px]"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={isInsufficient || basket.length === 0}
            onClick={handleConfirm}
            className="flex-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-50 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-1.5 min-h-[48px]"
          >
            <span>ยืนยันการชำระเงิน</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
