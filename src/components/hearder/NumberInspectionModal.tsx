"use client";

import React, { useState } from "react";
import { Search, X, ShieldAlert, User, Ticket, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NumberBetDetail {
  id: string;
  ticketName: string;
  adminName: string;
  categoryLabel: string;
  amount: number;
  createdAt: string;
}

interface NumberInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  allBatches?: Array<{
    ticketName: string;
    createdByName?: string;
    items: Array<{
      number: string;
      categoryLabel: string;
      price: number;
      category: string;
    }>;
    createdAt: string;
  }>;
}

export function NumberInspectionModal({
  isOpen,
  onClose,
  allBatches = [],
}: NumberInspectionModalProps) {
  const [searchNumber, setSearchNumber] = useState("");

  if (!isOpen) return null;

  // Search and aggregate
  const matchingDetails: NumberBetDetail[] = [];
  let totalExposedAmount = 0;

  if (searchNumber.trim()) {
    allBatches.forEach((batch, bIndex) => {
      batch.items.forEach((item, iIndex) => {
        if (item.number === searchNumber.trim()) {
          totalExposedAmount += item.price;
          matchingDetails.push({
            id: `${bIndex}-${iIndex}`,
            ticketName: batch.ticketName,
            adminName: batch.createdByName || "Admin Somchai",
            categoryLabel: item.categoryLabel,
            amount: item.price,
            createdAt: batch.createdAt,
          });
        }
      });
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspection-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ overscrollBehavior: "contain" }}
    >
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 id="inspection-modal-title" className="text-sm font-bold text-white">
                ส่องยอดรายตัวเลข (Number Volume Inspector)
              </h2>
              <p className="text-[11px] text-slate-400">
                ตรวจสอบยอดความเสี่ยงและแจกแจงที่มาของตัวเลข
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

        {/* Search Input */}
        <div className="p-4 bg-slate-950 border-b border-slate-800">
          <label htmlFor="search-number-input" className="text-xs font-semibold text-slate-300 block mb-1.5">
            ระบุตัวเลขที่ต้องการตรวจสอบ (เช่น 789 หรือ 45)
          </label>
          <div className="relative">
            <input
              id="search-number-input"
              type="text"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="พิมพ์ตัวเลข เช่น 789"
              maxLength={3}
              autoFocus
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-base font-bold tracking-wider placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
            />
            {searchNumber && (
              <button
                type="button"
                onClick={() => setSearchNumber("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {searchNumber.trim() ? (
            <>
              {/* Aggregate Callout */}
              <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400">
                    ยอดรวมของเลข <span className="font-mono font-bold text-white text-sm">[{searchNumber}]</span> ทุกหมวด:
                  </span>
                  <div className="text-xl font-mono font-extrabold text-emerald-400 mt-0.5 tabular-nums">
                    ฿{totalExposedAmount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">จำนวนรายการ</span>
                  <span className="text-sm font-bold font-mono text-white tabular-nums">
                    {matchingDetails.length} รายการ
                  </span>
                </div>
              </div>

              {/* Breakdown list */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 block px-1">
                  แจกแจงตามใบโพยและ Admin:
                </span>

                {matchingDetails.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    ไม่มียอดแทงในเลข {searchNumber} สำหรับงวดนี้
                  </div>
                ) : (
                  matchingDetails.map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="font-semibold text-white">
                            {item.ticketName}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{item.adminName}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-emerald-400/90 font-medium">{item.categoryLabel}</span>
                        </div>
                      </div>

                      <div className="font-mono font-bold text-white text-sm tabular-nums">
                        ฿{item.amount.toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              พิมพ์ตัวเลขด้านบนเพื่อส่องดูยอดและที่มาของรายการ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

