"use client";

import React from "react";
import { AggregatedBetRow } from "@/types/lottery";
import {
  X,
  Trash2,
  PlusCircle,
  Send,
  Ticket,
  Percent,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CartPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketName: string;
  adminId: string;
  commissionRate: number;
  aggregatedRows: AggregatedBetRow[];
  totalItemCount: number;
  grossBetTotal: number;
  commissionAmount: number;
  netBetTotal: number;
  onRemoveRow: (number: string) => void;
  onClearCart: () => void;
  onSubmit: () => void;
}

export function CartPreviewModal({
  isOpen,
  onClose,
  ticketName,
  adminId,
  commissionRate,
  aggregatedRows,
  totalItemCount,
  grossBetTotal,
  commissionAmount,
  netBetTotal,
  onRemoveRow,
  onClearCart,
  onSubmit,
}: CartPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ overscrollBehavior: "contain" }}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-250"
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h2 id="cart-modal-title" className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>สรุปโพย 4 คอลัมน์</span>
                <span className="text-[11px] font-normal text-slate-400">
                  ({totalItemCount} รายการ)
                </span>
              </h2>
              <p className="text-[11px] text-emerald-400 font-medium">
                ชื่อโพย: <span className="font-bold text-white">{ticketName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Column Table Content (Aggregated) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {aggregatedRows.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              ยังไม่มีรายการตัวเลขในตะกร้า
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/60 shadow-sm">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 text-[11px] font-bold border-b border-slate-800 uppercase tracking-wider">
                    <th className="py-2.5 px-3">ตัวเลข</th>
                    <th className="py-2.5 px-2 text-right">บน</th>
                    <th className="py-2.5 px-2 text-right">ล่าง</th>
                    <th className="py-2.5 px-2 text-right">โต๊ด</th>
                    <th className="py-2.5 px-3 text-right">รวม</th>
                    <th className="py-2.5 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {aggregatedRows.map((row) => (
                    <tr
                      key={row.number}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-bold text-white text-sm tabular-nums">
                        {row.number}
                      </td>
                      <td className="py-2.5 px-2 text-right text-emerald-400 font-semibold tabular-nums">
                        {row.topAmount > 0 ? row.topAmount.toLocaleString() : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-right text-teal-400 font-semibold tabular-nums">
                        {row.downAmount > 0 ? row.downAmount.toLocaleString() : "-"}
                      </td>
                      <td className="py-2.5 px-2 text-right text-amber-400 font-semibold tabular-nums">
                        {row.todAmount > 0 ? row.todAmount.toLocaleString() : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white tabular-nums">
                        ฿{row.totalRowAmount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveRow(row.number)}
                          aria-label={`Remove number ${row.number}`}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Financial Breakdown & Summary Widget */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-400">
              <span>ยอดแทงดิบรวม (Gross Bet):</span>
              <span className="font-mono font-bold text-white tabular-nums text-sm">
                ฿{grossBetTotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-emerald-400 font-medium">
              <span className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" />
                <span>ส่วนลดคอมมิชชั่น Admin ({commissionRate}%):</span>
              </span>
              <span className="font-mono font-bold tabular-nums">
                -฿{commissionAmount.toLocaleString()}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200">
                ยอดสุทธิต้องส่งเจ้ามือ (Net Bet to Hearder):
              </span>
              <span className="text-base font-extrabold font-mono text-emerald-400 tabular-nums">
                ฿{netBetTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>คีย์เพิ่มต่อ</span>
            </button>

            <button
              type="button"
              onClick={onClearCart}
              disabled={aggregatedRows.length === 0}
              className="py-2.5 px-2 bg-rose-950/40 hover:bg-rose-900/50 active:scale-95 text-rose-300 text-xs font-bold rounded-xl border border-rose-900/40 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ล้างตะกร้า</span>
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={aggregatedRows.length === 0}
              className="py-2.5 px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>ส่งโพยให้เจ้ามือ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
