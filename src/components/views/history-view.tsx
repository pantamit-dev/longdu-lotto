"use client";

import React, { useState, useMemo } from "react";
import { useLiffStore } from "@/lib/store/liff-store";
import {
  FileText,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter,
  Search,
  Copy,
  Sparkles,
  Ticket,
  ArrowRight,
} from "lucide-react";

export function HistoryView() {
  const { orders, setActiveTab } = useLiffStore();
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "WON" | "LOST">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<string | null>("ord-1");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyOrderNo = (orderNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(orderNo);
    setCopiedId(orderNo);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Status filter
      if (filter !== "ALL" && ord.status !== filter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesOrder = ord.orderNo.toLowerCase().includes(query);
        const matchesPeriod = ord.periodName.toLowerCase().includes(query);
        const matchesNumbers = ord.items.some((item) => item.number.includes(query));
        return matchesOrder || matchesPeriod || matchesNumbers;
      }

      return true;
    });
  }, [orders, filter, searchQuery]);

  return (
    <div className="space-y-3.5 pb-24 animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">โพยของฉัน</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ประวัติการส่งโพยทั้งหมด {orders.length} รายการ
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ค้นหาตามรหัสโพย หรือตัวเลข เช่น 64, ORD..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
        {[
          { key: "ALL", label: "ทั้งหมด" },
          { key: "PENDING", label: "รอออกผล" },
          { key: "WON", label: "ถูกรางวัล 🎉" },
          { key: "LOST", label: "ไม่ถูกรางวัล" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all min-h-[44px] flex items-center justify-center ${
              filter === tab.key
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3 p-6">
            <Filter className="w-8 h-8 text-slate-400 mx-auto stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              ไม่พบรายการโพยตามเงื่อนไขที่ค้นหา
            </p>
            <button
              onClick={() => setActiveTab("bet")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl shadow-sm min-h-[44px]"
            >
              <span>ไปหน้าซื้อหวยทันที</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isExpanded = expandedOrder === ord.id;
            const isWon = ord.status === "WON";

            return (
              <div
                key={ord.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-xs transition-all ${
                  isWon
                    ? "border-amber-400/60 dark:border-amber-500/40 shadow-amber-500/5 ring-1 ring-amber-400/20"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => setExpandedOrder(isExpanded ? null : ord.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors min-h-[52px]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                        #{ord.orderNo}
                      </span>

                      {/* Copy Button */}
                      <span
                        onClick={(e) => handleCopyOrderNo(ord.orderNo, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="คัดลอกรหัสโพย"
                      >
                        <Copy className="w-3 h-3" />
                      </span>
                      {copiedId === ord.orderNo && (
                        <span className="text-[10px] text-emerald-600 font-bold">คัดลอกแล้ว!</span>
                      )}

                      {ord.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>รอออกผล</span>
                        </span>
                      )}
                      {ord.status === "WON" && (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>ถูกรางวัล +฿{ord.prizeWon?.toLocaleString()}</span>
                        </span>
                      )}
                      {ord.status === "LOST" && (
                        <span className="inline-flex items-center text-slate-400 dark:text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                          ไม่ถูกรางวัล
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      งวด {ord.periodName} • {ord.createdAt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        ฿{ord.netAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {ord.totalItems} รายการ
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 animate-in fade-in">
                    <div className="space-y-1.5 max-h-56 overflow-y-auto">
                      {ord.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 min-w-16">
                              {item.type}
                            </span>
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm tracking-wider">
                              {item.number}
                            </span>
                          </div>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                            ฿{item.price}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Financial summary breakdown */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>ยอดแทงรวม</span>
                        <span className="font-mono">฿{ord.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>ส่วนลดสมาชิก VIP (-12%)</span>
                        <span className="font-mono font-bold">-฿{ord.discountAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 dark:text-white font-bold pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span>ยอดชำระสุทธิ</span>
                        <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                          ฿{ord.netAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
