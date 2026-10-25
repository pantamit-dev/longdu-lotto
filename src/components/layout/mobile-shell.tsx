"use client";

import React from "react";

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex justify-center w-full">
      <div className="w-full max-w-md bg-white dark:bg-slate-950 min-h-screen flex flex-col relative border-x border-slate-200 dark:border-slate-800/80 shadow-xl overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
