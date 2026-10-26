"use client";

import React, { useState, useEffect } from "react";
import { OverviewMetricsGrid } from "@/components/hearder/OverviewMetricsGrid";
import { NumberInspectionModal } from "@/components/hearder/NumberInspectionModal";
import { HearderMetricSummary } from "@/types/lottery";
import {
  ShieldCheck,
  Search,
  Filter,
  ArrowLeft,
  RefreshCw,
  Users,
  Calendar,
  Layers,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AdminOption {
  id: string;
  name: string;
}

export default function HearderDashboardPage() {
  const [selectedAdminId, setSelectedAdminId] = useState<string>("admin-all");
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [metrics, setMetrics] = useState<HearderMetricSummary>({
    twoTopTotal: 0,
    twoDownTotal: 0,
    twoTodTotal: 0,
    threeTopTotal: 0,
    threeDownTotal: 0,
    threeTodTotal: 0,
    runTopTotal: 0,
    runDownTotal: 0,
    totalGrossBet: 0,
    totalCommission: 0,
    totalNetBet: 0,
  });
  const [batches, setBatches] = useState<any[]>([]);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch analytics data
  const fetchAnalytics = async (adminId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/hearder/analytics?admin_id=${adminId}`);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setAdmins(data.admins);
        setBatches(data.batches);
      }
    } catch (e) {
      console.error("Failed to load analytics", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedAdminId);
  }, [selectedAdminId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="กลับสู่หน้าหลัก LINE MINI App"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <span>Hearder Risk Overview</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  สิทธิ์เจ้ามือ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>งวดประจำวันที่ 1 พฤศจิกายน 2569</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">เปิดรับแทง (OPEN)</span>
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsInspectionOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-950 flex items-center gap-2 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>ส่องยอดรายตัวเลข</span>
            </button>

            <button
              type="button"
              onClick={() => fetchAnalytics(selectedAdminId)}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-emerald-400")} />
            </button>
          </div>
        </div>

        {/* Multi-Dimension Admin Filter */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>คัดกรองข้อมูลรายคนกลาง (Filter by Admin):</span>
          </div>

          <div className="relative">
            <select
              value={selectedAdminId}
              onChange={(e) => setSelectedAdminId(e.target.value)}
              className="appearance-none bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-w-[220px]"
            >
              {admins.map((adm) => (
                <option key={adm.id} value={adm.id}>
                  {adm.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Global Counters & Financial Breakdown Grid */}
        <OverviewMetricsGrid metrics={metrics} />

        {/* Recent Tickets Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>รายการโพยส่งเจ้ามือล่าสุด ({batches.length} โพย)</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              สถานะ: สรุปยอดรอตัดรอบ
            </span>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 text-slate-400 text-[11px] font-bold border-b border-slate-800">
                  <th className="py-2.5 px-3">ชื่อโพย / ลูกค้า</th>
                  <th className="py-2.5 px-3">Admin ผู้ดูแล</th>
                  <th className="py-2.5 px-3 text-right">ยอดดิบ (Gross)</th>
                  <th className="py-2.5 px-3 text-right">คอมมิชชั่น</th>
                  <th className="py-2.5 px-3 text-right">ยอดสุทธิ (Net)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {batches.map((b) => {
                  const gross = b.items.reduce((s: number, i: any) => s + i.price, 0);
                  const comm = gross * (b.commissionRate / 100);
                  const net = gross - comm;
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-bold text-white">
                        {b.ticketName}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-300">
                        {b.createdByName}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-200 tabular-nums">
                        ฿{gross.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-400 tabular-nums">
                        -฿{comm.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-400 tabular-nums">
                        ฿{net.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Number Inspection Modal */}
        <NumberInspectionModal
          isOpen={isInspectionOpen}
          onClose={() => setIsInspectionOpen(false)}
          allBatches={batches}
        />
      </div>
    </div>
  );
}
