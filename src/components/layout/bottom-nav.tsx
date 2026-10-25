"use client";

import React from "react";
import { useLiffStore, LiffTab } from "@/lib/store/liff-store";
import { Home, Ticket, FileText, Trophy, User } from "lucide-react";

export function BottomNav() {
  const { activeTab, setActiveTab } = useLiffStore();

  const navItems: { id: LiffTab; label: string; icon: React.ElementType; isCenter?: boolean }[] = [
    { id: "home", label: "หน้าหลัก", icon: Home },
    { id: "bet", label: "ซื้อหวย", icon: Ticket, isCenter: true },
    { id: "history", label: "โพยของฉัน", icon: FileText },
    { id: "results", label: "ตรวจผล", icon: Trophy },
    { id: "profile", label: "บัญชี", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-area-bottom shadow-lg"
      aria-label="เมนูหลัก"
    >
      <div className="max-w-md mx-auto px-3 py-1 flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="relative -top-4 flex flex-col items-center justify-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full"
                aria-label={item.label}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-active:scale-95 ${
                    isActive
                      ? "bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-emerald-500/40 ring-4 ring-white dark:ring-slate-900"
                      : "bg-slate-900 text-white dark:bg-emerald-600 shadow-slate-900/30 ring-4 ring-white dark:ring-slate-900 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span
                  className={`text-[10px] font-bold mt-1 transition-colors ${
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`min-w-[56px] min-h-[48px] py-1 px-2 flex flex-col items-center justify-center rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
              }`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110" : "scale-100"}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
