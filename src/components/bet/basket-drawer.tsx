"use client";

import React from "react";
import { useLiffStore } from "@/lib/store/liff-store";
import { calculateTotals } from "@/lib/engine/lotto-engine";
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export function BasketDrawer() {
  const {
    basket,
    removeFromBasket,
    clearBasket,
    isBasketOpen,
    setIsBasketOpen,
    setIsConfirmModalOpen,
    discountRate,
  } = useLiffStore();

  if (!isBasketOpen) return null;

  const { subtotal, discountAmount, netTotal, itemCount } = calculateTotals(basket, discountRate);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end transition-opacity duration-200"
      style={{ overscrollBehavior: "contain" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="basket-sheet-title"
    >
      {/* Backdrop tap to close */}
      <div
        className="flex-1 w-full"
        onClick={() => setIsBasketOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer Card */}
      <div
        className="w-full max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-300"
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Grab Handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 id="basket-sheet-title" className="text-base font-extrabold text-slate-900 dark:text-white">
                ตะกร้าโพยหวย
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                รวมทั้งหมด {itemCount} รายการ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {basket.length > 0 && (
              <button
                type="button"
                onClick={clearBasket}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2.5 py-1.5 rounded-lg transition-colors min-h-[36px]"
              >
                ล้างทั้งหมด
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsBasketOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 transition-colors"
              aria-label="ปิดตะกร้า"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 overscroll-contain">
          {basket.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold">ยังไม่มีรายการตัวเลขในโพย</p>
              <p className="text-[10px] text-slate-400">
                เลือกประเภทและพิมพ์ตัวเลขเพื่อเพิ่มลงโพยได้ทันที
              </p>
            </div>
          ) : (
            basket.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-750"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-black text-emerald-600 dark:text-emerald-400 text-base shadow-xs">
                    {item.number}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.subTypeLabel}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      อัตราจ่าย บาทละ {item.payoutRate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      ฿{item.price}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromBasket(item.id)}
                    className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors"
                    aria-label={`ลบเลข ${item.number}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {basket.length > 0 && (
          <div className="px-5 pt-3 pb-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 space-y-3">
            {/* Calculation summary */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>ยอดแทงรวม ({itemCount} รายการ)</span>
                <span className="font-mono font-semibold">฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>ส่วนลดสมาชิก VIP ({discountRate}%)</span>
                </span>
                <span className="font-mono">-฿{discountAmount.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  ยอดชำระสุทธิ
                </span>
                <div className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
                  ฿{netTotal.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <button
              type="button"
              onClick={() => {
                setIsBasketOpen(false);
                setIsConfirmModalOpen(true);
              }}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 min-h-[48px]"
            >
              <span>ส่งโพยทันที</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
