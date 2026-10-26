"use client";

import { useState, useMemo, useCallback } from "react";
import {
  CartBetItem,
  AggregatedBetRow,
  LottoMode,
  BetCategory,
  TicketBatch,
} from "@/types/lottery";
import {
  generate2Permutations,
  generate3Permutations,
} from "@/lib/lottery/engine";
import {
  generate19Door,
  generateRootFront,
  generateRootBack,
  PAYOUT_RATES,
} from "@/lib/engine/lotto-engine";
import { soundEngine } from "@/lib/audio/sound-engine";
import { calculateNetBet } from "@/lib/lottery/settlement";

export interface UseLotteryCartOptions {
  initialTicketName?: string;
  adminId?: string;
  commissionRate?: number;
}

export function useLotteryCart(options: UseLotteryCartOptions = {}) {
  // Ticket name / Customer tag
  const [ticketName, setTicketName] = useState(options.initialTicketName || "ป้าสมศรี หน้าร้าน");
  const [adminId] = useState(options.adminId || "admin-001");
  const [commissionRate, setCommissionRate] = useState(options.commissionRate ?? 15); // 15%

  // Mode: 2digit, 3digit, run, 19door
  const [mode, setMode] = useState<LottoMode>("2digit");

  // Digit Input Buffer
  const [inputDigits, setInputDigits] = useState("");

  // Price per item
  const [price, setPrice] = useState<number>(20);

  // 2-Digit Toggles
  const [twoTop, setTwoTop] = useState(true);
  const [twoDown, setTwoDown] = useState(true);
  const [twoTod, setTwoTod] = useState(false);
  const [twoAutoSwap, setTwoAutoSwap] = useState(true);

  // 3-Digit Toggles
  const [threeTop, setThreeTop] = useState(true);
  const [threeTod, setThreeTod] = useState(true);
  const [threeDown, setThreeDown] = useState(false);
  const [threeAutoSwap, setThreeAutoSwap] = useState(false);

  // Run Toggles
  const [runTop, setRunTop] = useState(true);
  const [runDown, setRunDown] = useState(false);

  // 19-Door Toggles
  const [doorType, setDoorType] = useState<"19door" | "front" | "back">("19door");
  const [doorTop, setDoorTop] = useState(true);
  const [doorDown, setDoorDown] = useState(true);

  // Staged cart items
  const [items, setItems] = useState<CartBetItem[]>([]);

  // Visual feedback flash (150ms green)
  const [isFlashGreen, setIsFlashGreen] = useState(false);

  // Submitted ticket history (staged locally)
  const [submittedBatches, setSubmittedBatches] = useState<TicketBatch[]>([]);

  // Required digits per mode
  const requiredLength = useMemo(() => {
    switch (mode) {
      case "2digit":
        return 2;
      case "3digit":
        return 3;
      case "run":
      case "19door":
        return 1;
      default:
        return 2;
    }
  }, [mode]);

  // Aggregated Rows: Merges same numbers into 4-column layout [number] [top] [down] [tod]
  const aggregatedRows: AggregatedBetRow[] = useMemo(() => {
    const map = new Map<string, AggregatedBetRow>();

    items.forEach((item) => {
      let row = map.get(item.number);
      if (!row) {
        row = {
          number: item.number,
          digitsLength: item.number.length,
          topAmount: 0,
          downAmount: 0,
          todAmount: 0,
          totalRowAmount: 0,
        };
        map.set(item.number, row);
      }

      if (item.category === "2top" || item.category === "3top" || item.category === "runtop") {
        row.topAmount += item.price;
      } else if (item.category === "2down" || item.category === "3down" || item.category === "rundown") {
        row.downAmount += item.price;
      } else if (item.category === "2tod" || item.category === "3tod") {
        row.todAmount += item.price;
      }

      row.totalRowAmount += item.price;
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.digitsLength !== b.digitsLength) return a.digitsLength - b.digitsLength;
      return a.number.localeCompare(b.number);
    });
  }, [items]);

  // Financial calculations
  const grossBetTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price, 0);
  }, [items]);

  const commissionAmount = useMemo(() => {
    return Math.round(grossBetTotal * (commissionRate / 100) * 100) / 100;
  }, [grossBetTotal, commissionRate]);

  const netBetTotal = useMemo(() => {
    return calculateNetBet(grossBetTotal, commissionRate);
  }, [grossBetTotal, commissionRate]);

  /**
   * Commit a set of numbers and categories to the cart
   */
  const commitNumbers = useCallback(
    (numbers: string[], categories: { category: BetCategory; label: string; payout: number }[]) => {
      if (numbers.length === 0 || categories.length === 0) return;

      const newItems: CartBetItem[] = [];
      numbers.forEach((num) => {
        categories.forEach((cat) => {
          newItems.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            number: num,
            category: cat.category,
            categoryLabel: cat.label,
            price: price,
            payoutRate: cat.payout,
          });
        });
      });

      setItems((prev) => [...prev, ...newItems]);

      // Sound & Flash Feedback
      soundEngine.playCommit();
      setIsFlashGreen(true);
      setTimeout(() => {
        setIsFlashGreen(false);
      }, 150);

      // Reset slot input
      setInputDigits("");
    },
    [price]
  );

  /**
   * Numpad Digit Press Handler with Auto-Commit Engine
   */
  const handleDigitPress = useCallback(
    (digit: string) => {
      soundEngine.playDigit(digit);

      const nextInput = inputDigits + digit;

      if (nextInput.length < requiredLength) {
        setInputDigits(nextInput);
        return;
      }

      // We reached the required length -> Trigger Auto-Commit!
      let numbersToCommit: string[] = [];
      const categories: { category: BetCategory; label: string; payout: number }[] = [];

      if (mode === "2digit") {
        if (twoAutoSwap) {
          numbersToCommit = generate2Permutations(nextInput);
        } else {
          numbersToCommit = [nextInput];
        }

        if (twoTop) categories.push({ category: "2top", label: "2 ตัวบน", payout: PAYOUT_RATES.BT_2TOP });
        if (twoDown) categories.push({ category: "2down", label: "2 ตัวล่าง", payout: PAYOUT_RATES.BT_2DOWN });
        if (twoTod) categories.push({ category: "2tod", label: "2 ตัวโต๊ด", payout: PAYOUT_RATES.BT_2TOD });
      } else if (mode === "3digit") {
        if (threeAutoSwap) {
          numbersToCommit = generate3Permutations(nextInput);
        } else {
          numbersToCommit = [nextInput];
        }

        if (threeTop) categories.push({ category: "3top", label: "3 ตัวบน", payout: PAYOUT_RATES.BT_3TOP });
        if (threeTod) categories.push({ category: "3tod", label: "3 ตัวโต๊ด", payout: PAYOUT_RATES.BT_3TOD });
        if (threeDown) categories.push({ category: "3down", label: "3 ตัวล่าง", payout: PAYOUT_RATES.BT_3DOWN });
      } else if (mode === "run") {
        numbersToCommit = [nextInput];
        if (runTop) categories.push({ category: "runtop", label: "วิ่งบน", payout: PAYOUT_RATES.BT_RUNTOP });
        if (runDown) categories.push({ category: "rundown", label: "วิ่งล่าง", payout: PAYOUT_RATES.BT_RUNDOWN });
      } else if (mode === "19door") {
        if (doorType === "19door") {
          numbersToCommit = generate19Door(nextInput);
        } else if (doorType === "front") {
          numbersToCommit = generateRootFront(nextInput);
        } else {
          numbersToCommit = generateRootBack(nextInput);
        }

        if (doorTop) categories.push({ category: "2top", label: "2 ตัวบน", payout: PAYOUT_RATES.BT_2TOP });
        if (doorDown) categories.push({ category: "2down", label: "2 ตัวล่าง", payout: PAYOUT_RATES.BT_2DOWN });
      }

      if (categories.length === 0) {
        // Fallback default if user unselected all: select top
        if (mode === "2digit") categories.push({ category: "2top", label: "2 ตัวบน", payout: 95 });
        else if (mode === "3digit") categories.push({ category: "3top", label: "3 ตัวบน", payout: 900 });
        else categories.push({ category: "runtop", label: "วิ่งบน", payout: 3.2 });
      }

      commitNumbers(numbersToCommit, categories);
    },
    [
      inputDigits,
      requiredLength,
      mode,
      twoAutoSwap,
      twoTop,
      twoDown,
      twoTod,
      threeAutoSwap,
      threeTop,
      threeTod,
      threeDown,
      runTop,
      runDown,
      doorType,
      doorTop,
      doorDown,
      commitNumbers,
    ]
  );

  const handleBackspace = useCallback(() => {
    soundEngine.playDelete();
    setInputDigits((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    soundEngine.playDelete();
    setInputDigits("");
  }, []);

  const removeRowByNumber = useCallback((number: string) => {
    setItems((prev) => prev.filter((item) => item.number !== number));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const submitBatch = useCallback(
    (onSuccess?: (batch: TicketBatch) => void) => {
      if (items.length === 0) return null;

      const batch: TicketBatch = {
        id: `batch-${Date.now()}`,
        ticketName: ticketName || "ทั่วไป",
        adminId,
        createdBy: adminId,
        createdByName: "Admin Somchai",
        periodId: "period-20261101",
        items: [...items],
        aggregatedRows: [...aggregatedRows],
        grossAmount: grossBetTotal,
        commissionRate,
        commissionAmount,
        netAmount: netBetTotal,
        winAmount: 0,
        createdAt: new Date().toISOString(),
        status: "SUBMITTED",
      };

      setSubmittedBatches((prev) => [batch, ...prev]);
      clearCart();
      if (onSuccess) onSuccess(batch);
      return batch;
    },
    [
      items,
      aggregatedRows,
      ticketName,
      adminId,
      commissionRate,
      grossBetTotal,
      commissionAmount,
      netBetTotal,
      clearCart,
    ]
  );

  return {
    ticketName,
    setTicketName,
    adminId,
    commissionRate,
    setCommissionRate,
    mode,
    setMode,
    inputDigits,
    requiredLength,
    price,
    setPrice,
    // 2-digit toggles
    twoTop,
    setTwoTop,
    twoDown,
    setTwoDown,
    twoTod,
    setTwoTod,
    twoAutoSwap,
    setTwoAutoSwap,
    // 3-digit toggles
    threeTop,
    setThreeTop,
    threeTod,
    setThreeTod,
    threeDown,
    setThreeDown,
    threeAutoSwap,
    setThreeAutoSwap,
    // run toggles
    runTop,
    setRunTop,
    runDown,
    setRunDown,
    // 19door toggles
    doorType,
    setDoorType,
    doorTop,
    setDoorTop,
    doorDown,
    setDoorDown,
    // Cart state & feedback
    items,
    aggregatedRows,
    isFlashGreen,
    grossBetTotal,
    commissionAmount,
    netBetTotal,
    submittedBatches,
    // Action handlers
    handleDigitPress,
    handleBackspace,
    handleClear,
    removeRowByNumber,
    clearCart,
    submitBatch,
  };
}

