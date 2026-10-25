"use client";

import React, { useState, useMemo } from "react";
import { useLiffStore } from "@/lib/store/liff-store";
import {
  LottoMode,
  LottoSubType,
  LottoBetItem,
  PAYOUT_RATES,
  SUBTYPE_LABELS,
  generate2DigitPermutations,
  generate3DigitPermutations,
  generate19Door,
  generateRootFront,
  generateRootBack,
  calculateTotals,
} from "@/lib/engine/lotto-engine";
import { Numpad } from "@/components/bet/numpad";
import { BasketDrawer } from "@/components/bet/basket-drawer";
import { OrderConfirmModal } from "@/components/bet/order-confirm-modal";
import { OrderSuccessSheet } from "@/components/bet/order-success-sheet";
import {
  Ticket,
  Sparkles,
  ShoppingBag,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
} from "lucide-react";

export function BetView() {
  const {
    basket,
    addToBasket,
    isBasketOpen,
    setIsBasketOpen,
    discountRate,
    lastSubmittedOrder,
  } = useLiffStore();

  const [showSuccessSheet, setShowSuccessSheet] = useState(false);

  // Mode Selection
  const [mode, setMode] = useState<LottoMode>("2digit");

  // Input states
  const [inputDigits, setInputDigits] = useState("");
  const [price, setPrice] = useState<number>(20);

  // SubType toggles for 2-digit
  const [twoTop, setTwoTop] = useState(true);
  const [twoDown, setTwoDown] = useState(true);
  const [twoAutoSwap, setTwoAutoSwap] = useState(true);

  // SubType toggles for 3-digit
  const [threeTop, setThreeTop] = useState(true);
  const [threeTod, setThreeTod] = useState(false);
  const [threeFront, setThreeFront] = useState(false);
  const [threeDown, setThreeDown] = useState(false);
  const [threeSixSwap, setThreeSixSwap] = useState(false);

  // SubType toggles for 19-door
  const [doorType, setDoorType] = useState<"19door" | "front" | "back">("19door");
  const [doorTargetTop, setDoorTargetTop] = useState(true);
  const [doorTargetDown, setDoorTargetDown] = useState(true);

  // SubType toggles for Run
  const [runTop, setRunTop] = useState(true);
  const [runDown, setRunDown] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Required length per mode
  const requiredLength = useMemo(() => {
    switch (mode) {
      case "2digit":
        return 2;
      case "3digit":
        return 3;
      case "19door":
      case "run":
        return 1;
    }
  }, [mode]);

  // Keypad Handlers
  const handleNumpadPress = (digit: string) => {
    if (inputDigits.length < requiredLength) {
      setInputDigits((prev) => prev + digit);
    }
  };

  const handleNumpadDelete = () => {
    setInputDigits((prev) => prev.slice(0, -1));
  };

  const handleNumpadClear = () => {
    setInputDigits("");
  };

  // Quick price chips
  const addPrice = (amount: number) => {
    setPrice((prev) => Math.max(1, prev + amount));
  };

  // Calculate generated items based on current settings
  const generatedItems = useMemo<LottoBetItem[]>(() => {
    if (inputDigits.length !== requiredLength || price <= 0) return [];

    const items: LottoBetItem[] = [];

    if (mode === "2digit") {
      const numbers = twoAutoSwap
        ? generate2DigitPermutations(inputDigits)
        : [inputDigits];

      numbers.forEach((num) => {
        if (twoTop) {
          items.push({
            id: `item-${Date.now()}-${Math.random()}`,
            subType: "BT_2TOP",
            subTypeLabel: SUBTYPE_LABELS["BT_2TOP"],
            number: num,
            price,
            payoutRate: PAYOUT_RATES["BT_2TOP"],
          });
        }
        if (twoDown) {
          items.push({
            id: `item-${Date.now()}-${Math.random()}`,
            subType: "BT_2DOWN",
            subTypeLabel: SUBTYPE_LABELS["BT_2DOWN"],
            number: num,
            price,
            payoutRate: PAYOUT_RATES["BT_2DOWN"],
          });
        }
      });
    } else if (mode === "3digit") {
      const numbers = threeSixSwap
        ? generate3DigitPermutations(inputDigits)
        : [inputDigits];

      numbers.forEach((num) => {
        if (threeTop) {
          items.push({
            id: `item-${Date.now()}-${Math.random()}`,
            subType: "BT_3TOP",
            subTypeLabel: SUBTYPE_LABELS["BT_3TOP"],
            number: num,
            price,
            payoutRate: PAYOUT_RATES["BT_3TOP"],
          });
        }
        if (threeFront) {
          items.push({
            id: `item-${Date.now()}-${Math.random()}`,
            subType: "BT_3FRONT",
            subTypeLabel: SUBTYPE_LABELS["BT_3FRONT"],
            number: num,
            price,
            payoutRate: PAYOUT_RATES["BT_3FRONT"],
          });
        }
        if (threeDown) {
          items.push({
            id: `item-${Date.now()}-${Math.random()}`,
            subType: "BT_3DOWN",
            subTypeLabel: SUBTYPE_LABELS["BT_3DOWN"],
            number: num,
            price,
            payoutRate: PAYOUT_RATES["BT_3DOWN"],
          });
        }
      });

      // Tod is naturally non-permutated (1 entry per unique combination)
      if (threeTod) {
        items.push({
          id: `item-${Date.now()}-${Math.random()}`,
          subType: "BT_3TOD",
          subTypeLabel: SUBTYPE_LABELS["BT_3TOD"],
          number: inputDigits,
          price,
          payoutRate: PAYOUT_RATES["BT_3TOD"],
        });
      }
    } else if (mode === "19door") {
      let numbers: string[] = [];
      if (doorType === "19door") numbers = generate19Door(inputDigits);
      else if (doorType === "front") numbers = generateRootFront(inputDigits);
      else if (doorType === "back") numbers = generateRootBack(inputDigits);

      numbers.forEach((num) => {
        if (doorTargetTop) {
          items.push({
            id: `item-${Date.now()}-${Math.random()}`,
            subType: "BT_2TOP",
            subTypeLabel: SUBTYPE_LABELS["BT_2TOP"],
            number: num,
            price,
            payoutRate: PAYOUT_RATES["BT_2TOP"],
          });
        }
        if (doorTargetDown) {
          items.push({
            id: `item-${Date.now()}-${Math.random()}`,
            subType: "BT_2DOWN",
            subTypeLabel: SUBTYPE_LABELS["BT_2DOWN"],
            number: num,
            price,
            payoutRate: PAYOUT_RATES["BT_2DOWN"],
          });
        }
      });
    } else if (mode === "run") {
      if (runTop) {
        items.push({
          id: `item-${Date.now()}-${Math.random()}`,
          subType: "BT_RUNTOP",
          subTypeLabel: SUBTYPE_LABELS["BT_RUNTOP"],
          number: inputDigits,
          price,
          payoutRate: PAYOUT_RATES["BT_RUNTOP"],
        });
      }
      if (runDown) {
        items.push({
          id: `item-${Date.now()}-${Math.random()}`,
          subType: "BT_RUNDOWN",
          subTypeLabel: SUBTYPE_LABELS["BT_RUNDOWN"],
          number: inputDigits,
          price,
          payoutRate: PAYOUT_RATES["BT_RUNDOWN"],
        });
      }
    }

    return items;
  }, [
    mode,
    inputDigits,
    price,
    requiredLength,
    twoTop,
    twoDown,
    twoAutoSwap,
    threeTop,
    threeTod,
    threeFront,
    threeDown,
    threeSixSwap,
    doorType,
    doorTargetTop,
    doorTargetDown,
    runTop,
    runDown,
  ]);

  const previewTotals = useMemo(
    () => calculateTotals(generatedItems, discountRate),
    [generatedItems, discountRate]
  );

  const basketTotals = useMemo(
    () => calculateTotals(basket, discountRate),
    [basket, discountRate]
  );

  const handleAddItems = () => {
    if (generatedItems.length === 0) return;
    addToBasket(generatedItems);
    setToastMessage(`เพิ่ม ${generatedItems.length} รายการลงโพยแล้ว! ✅`);
    setInputDigits("");
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="space-y-3.5 pb-28 animate-in fade-in duration-200">
      {/* Toast message */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-1.5 animate-in fade-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mode Selector Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl">
        {[
          { key: "2digit", label: "2 ตัว" },
          { key: "3digit", label: "3 ตัว" },
          { key: "19door", label: "19 ประตู / รูด" },
          { key: "run", label: "เลขวิ่ง" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setMode(tab.key as LottoMode);
              setInputDigits("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all min-h-[44px] flex items-center justify-center ${
              mode === tab.key
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SubType Toggles */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-0.5">
          <span>ประเภทการแทง</span>
          <span className="text-emerald-600 dark:text-emerald-400">
            {mode === "2digit" && "บาทละ 95"}
            {mode === "3digit" && "บาทละ 900 / 150"}
            {mode === "19door" && "บาทละ 95"}
            {mode === "run" && "บาทละ 3.2 / 4.2"}
          </span>
        </div>

        {/* 2 Digit Options */}
        {mode === "2digit" && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTwoTop(!twoTop)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center gap-1 ${
                twoTop
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              2 ตัวบน
            </button>
            <button
              type="button"
              onClick={() => setTwoDown(!twoDown)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center gap-1 ${
                twoDown
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              2 ตัวล่าง
            </button>
            <button
              type="button"
              onClick={() => setTwoAutoSwap(!twoAutoSwap)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center gap-1 ${
                twoAutoSwap
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>กลับเลขอัตโนมัติ</span>
            </button>
          </div>
        )}

        {/* 3 Digit Options */}
        {mode === "3digit" && (
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setThreeTop(!threeTop)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                threeTop
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              3 ตัวบน
            </button>
            <button
              type="button"
              onClick={() => setThreeTod(!threeTod)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                threeTod
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              3 ตัวโต๊ด
            </button>
            <button
              type="button"
              onClick={() => setThreeFront(!threeFront)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                threeFront
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              3 ตัวหน้า
            </button>
            <button
              type="button"
              onClick={() => setThreeDown(!threeDown)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                threeDown
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              3 ตัวท้าย
            </button>
            <button
              type="button"
              onClick={() => setThreeSixSwap(!threeSixSwap)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] flex items-center gap-1 ${
                threeSixSwap
                  ? "bg-amber-500 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>6 กลับอัตโนมัติ</span>
            </button>
          </div>
        )}

        {/* 19 Door Options */}
        {mode === "19door" && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {[
                { key: "19door", label: "19 ประตู (19 เลข)" },
                { key: "front", label: "รูดหน้า (10 เลข)" },
                { key: "back", label: "รูดหลัง (10 เลข)" },
              ].map((dt) => (
                <button
                  key={dt.key}
                  type="button"
                  onClick={() => setDoorType(dt.key as any)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                    doorType === dt.key
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setDoorTargetTop(!doorTargetTop)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                  doorTargetTop
                    ? "bg-slate-900 text-white dark:bg-emerald-700"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                ใส่บน
              </button>
              <button
                type="button"
                onClick={() => setDoorTargetDown(!doorTargetDown)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                  doorTargetDown
                    ? "bg-slate-900 text-white dark:bg-emerald-700"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                ใส่ล่าง
              </button>
            </div>
          </div>
        )}

        {/* Run Options */}
        {mode === "run" && (
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setRunTop(!runTop)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                runTop
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              วิ่งบน (บาทละ 3.2)
            </button>
            <button
              type="button"
              onClick={() => setRunDown(!runDown)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] ${
                runDown
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              วิ่งล่าง (บาทละ 4.2)
            </button>
          </div>
        )}
      </div>

      {/* Digit Display Box */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-850 text-white rounded-3xl p-4 shadow-md border border-slate-800 text-center space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          ตัวเลขที่ระบุ ({inputDigits.length}/{requiredLength} หลัก)
        </span>

        {/* Boxes */}
        <div className="flex justify-center items-center gap-2.5 my-1">
          {Array.from({ length: requiredLength }).map((_, idx) => {
            const digit = inputDigits[idx];
            const isCurrent = idx === inputDigits.length;

            return (
              <div
                key={idx}
                className={`w-14 h-16 rounded-2xl flex items-center justify-center font-mono font-black text-3xl transition-all ${
                  digit
                    ? "bg-emerald-600 text-white border-2 border-emerald-400 shadow-md"
                    : isCurrent
                    ? "bg-slate-800 border-2 border-emerald-500 animate-pulse text-emerald-400"
                    : "bg-slate-800/60 border border-slate-700 text-slate-600"
                }`}
              >
                {digit || "_"}
              </div>
            );
          })}
        </div>

        {/* Quick price chips */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">ราคา/ตัว:</span>
            <input
              type="number"
              min="1"
              value={price}
              onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-16 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm"
            />
            <span className="text-slate-400">฿</span>
          </div>

          <div className="flex gap-1">
            {[10, 20, 50, 100].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => addPrice(amt)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-mono font-bold text-slate-300 rounded-lg border border-slate-700 active:scale-95 transition-all"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Generated Preview Bar */}
      {generatedItems.length > 0 && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">
              สร้างได้ {generatedItems.length} รายการ
            </span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">
              รวม ฿{previewTotals.subtotal} (ลดเหลือ ฿{previewTotals.netTotal})
            </span>
          </div>

          {/* Sample numbers preview */}
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
            {generatedItems.map((item, idx) => (
              <span
                key={idx}
                className="font-mono text-[11px] font-bold bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-2xs"
              >
                {item.number} ({item.subTypeLabel.replace("2 ตัว", "").replace("3 ตัว", "")})
              </span>
            ))}
          </div>

          {/* Add to basket CTA */}
          <button
            type="button"
            onClick={handleAddItems}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มลงโพย ({generatedItems.length} รายการ)</span>
          </button>
        </div>
      )}

      {/* Numeric Touch Keypad */}
      <Numpad
        onPress={handleNumpadPress}
        onDelete={handleNumpadDelete}
        onClear={handleNumpadClear}
      />

      {/* Floating Bottom Basket Bar (when basket has items) */}
      {basket.length > 0 && (
        <div className="fixed bottom-18 left-0 right-0 z-30 px-4 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsBasketOpen(true)}
              className="w-full bg-slate-900/95 dark:bg-emerald-600/95 backdrop-blur-md text-white rounded-2xl p-3 shadow-xl border border-slate-700 dark:border-emerald-500 flex items-center justify-between active:scale-98 transition-all min-h-[52px]"
            >
              <div className="flex items-center gap-2.5">
                <div className="relative w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4 text-emerald-400 dark:text-white" />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-900 font-mono font-black text-[10px] flex items-center justify-center border-2 border-slate-900">
                    {basket.length}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold">โพยของคุณ ({basket.length} รายการ)</div>
                  <div className="text-[10px] text-slate-300 dark:text-emerald-100">
                    ส่วนลด {discountRate}% เรียบร้อยแล้ว
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-mono font-black text-sm text-emerald-400 dark:text-white">
                    ฿{basketTotals.netTotal.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-slate-400 line-through">
                    ฿{basketTotals.subtotal.toLocaleString()}
                  </div>
                </div>
                <div className="bg-emerald-500 dark:bg-white text-slate-900 px-2.5 py-1 rounded-xl text-xs font-black shadow-xs">
                  ดูโพย
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Basket Bottom Sheet Modal */}
      <BasketDrawer />

      {/* Order Confirmation Modal */}
      <OrderConfirmModal onSuccess={() => setShowSuccessSheet(true)} />

      {/* Order Success Celebration Sheet */}
      {showSuccessSheet && (
        <OrderSuccessSheet
          order={lastSubmittedOrder}
          onClose={() => setShowSuccessSheet(false)}
        />
      )}
    </div>
  );
}
