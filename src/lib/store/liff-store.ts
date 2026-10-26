import { create } from "zustand";
import { LottoBetItem, calculateTotals } from "@/lib/engine/lotto-engine";
import { TicketBatch, UserRole } from "@/types/lottery";

export type LiffTab = "home" | "bet" | "history" | "results" | "profile";

export interface LotteryPeriod {
  id: string;
  name: string;
  drawDate: string;
  closeTime: string; // ISO string
  status: "OPEN" | "CLOSING_SOON" | "CLOSED";
}

export interface LottoOrderItem {
  type: string;
  number: string;
  price: number;
}

export interface LottoOrder {
  id: string;
  orderNo: string;
  periodName: string;
  createdAt: string;
  totalItems: number;
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  status: "PENDING" | "WON" | "LOST";
  prizeWon?: number;
  items: LottoOrderItem[];
}

const INITIAL_ORDERS: LottoOrder[] = [
  {
    id: "ord-1",
    orderNo: "ORD-98214",
    periodName: "1 พ.ย. 2569",
    createdAt: "วันนี้ 14:20 น.",
    totalItems: 4,
    totalAmount: 200,
    discountAmount: 24,
    netAmount: 176,
    status: "PENDING",
    items: [
      { type: "3 ตัวบน", number: "789", price: 50 },
      { type: "3 ตัวโต๊ด", number: "789", price: 50 },
      { type: "2 ตัวบน", number: "89", price: 50 },
      { type: "2 ตัวล่าง", number: "98", price: 50 },
    ],
  },
  {
    id: "ord-2",
    orderNo: "ORD-92104",
    periodName: "16 ต.ค. 2569",
    createdAt: "16 ต.ค. 2569 11:45 น.",
    totalItems: 2,
    totalAmount: 100,
    discountAmount: 12,
    netAmount: 88,
    status: "WON",
    prizeWon: 1900,
    items: [
      { type: "2 ตัวบน", number: "64", price: 50 },
      { type: "2 ตัวล่าง", number: "15", price: 50 },
    ],
  },
  {
    id: "ord-3",
    orderNo: "ORD-87321",
    periodName: "1 ต.ค. 2569",
    createdAt: "1 ต.ค. 2569 13:10 น.",
    totalItems: 3,
    totalAmount: 150,
    discountAmount: 18,
    netAmount: 132,
    status: "LOST",
    items: [
      { type: "3 ตัวบน", number: "123", price: 50 },
      { type: "2 ตัวบน", number: "23", price: 50 },
      { type: "2 ตัวล่าง", number: "32", price: 50 },
    ],
  },
];

interface LiffStoreState {
  activeTab: LiffTab;
  setActiveTab: (tab: LiffTab) => void;
  period: LotteryPeriod;
  memberBalance: number;
  discountRate: number; // percentage, e.g. 12 = 12%
  refreshBalance: () => void;

  // Basket State
  basket: LottoBetItem[];
  addToBasket: (items: LottoBetItem[]) => void;
  removeFromBasket: (id: string) => void;
  clearBasket: () => void;
  isBasketOpen: boolean;
  setIsBasketOpen: (open: boolean) => void;

  // Role & Agent-Centric Batches
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  ticketBatches: TicketBatch[];
  addTicketBatch: (batch: TicketBatch) => void;

  // Agent Cart State for Nav Bar
  cartItemCount: number;
  grossBetTotal: number;
  setCartSummary: (count: number, total: number) => void;
  isCartModalOpen: boolean;
  setIsCartModalOpen: (open: boolean) => void;

  // Order State
  orders: LottoOrder[];
  isConfirmModalOpen: boolean;
  setIsConfirmModalOpen: (open: boolean) => void;
  lastSubmittedOrder: LottoOrder | null;
  setLastSubmittedOrder: (order: LottoOrder | null) => void;
  submitOrder: () => { success: boolean; order?: LottoOrder; error?: string };
}

export const useLiffStore = create<LiffStoreState>((set, get) => ({
  activeTab: "home",
  setActiveTab: (tab) => set({ activeTab: tab }),
  period: {
    id: "period-2026-11-01",
    name: "งวดประจำวันที่ 1 พฤศจิกายน 2569",
    drawDate: "1 พ.ย. 2569",
    closeTime: new Date(Date.now() + 1000 * 60 * 60 * 4 + 1000 * 60 * 35).toISOString(),
    status: "OPEN",
  },
  memberBalance: 2500,
  discountRate: 12,
  refreshBalance: () => {
    set((state) => ({ memberBalance: state.memberBalance }));
  },

  // Basket Implementation
  basket: [],
  addToBasket: (newItems) =>
    set((state) => ({ basket: [...state.basket, ...newItems] })),
  removeFromBasket: (id) =>
    set((state) => ({
      basket: state.basket.filter((item) => item.id !== id),
    })),
  clearBasket: () => set({ basket: [] }),
  isBasketOpen: false,
  setIsBasketOpen: (open) => set({ isBasketOpen: open }),

  // Role & Batches
  currentRole: "ADMIN",
  setCurrentRole: (role) => set({ currentRole: role }),
  ticketBatches: [],
  addTicketBatch: (batch) =>
    set((state) => ({ ticketBatches: [batch, ...state.ticketBatches] })),

  // Agent Cart State for Nav
  cartItemCount: 0,
  grossBetTotal: 0,
  setCartSummary: (count, total) => set({ cartItemCount: count, grossBetTotal: total }),
  isCartModalOpen: false,
  setIsCartModalOpen: (open) => set({ isCartModalOpen: open }),

  // Order Management Implementation
  orders: INITIAL_ORDERS,
  isConfirmModalOpen: false,
  setIsConfirmModalOpen: (open) => set({ isConfirmModalOpen: open }),
  lastSubmittedOrder: null,
  setLastSubmittedOrder: (order) => set({ lastSubmittedOrder: order }),

  submitOrder: () => {
    const { basket, discountRate, memberBalance, period, orders } = get();
    if (basket.length === 0) {
      return { success: false, error: "ไม่มีรายการในตะกร้า" };
    }

    const { subtotal, discountAmount, netTotal } = calculateTotals(basket, discountRate);
    if (memberBalance < netTotal) {
      return {
        success: false,
        error: `ยอดเงินคงเหลือไม่เพียงพอ (ต้องการ ฿${netTotal.toLocaleString()} มีอยู่ ฿${memberBalance.toLocaleString()})`,
      };
    }

    const now = new Date();
    const timeStr = `วันนี้ ${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")} น.`;

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const newOrder: LottoOrder = {
      id: `ord-${Date.now()}`,
      orderNo: `ORD-${randomSuffix}`,
      periodName: period.drawDate,
      createdAt: timeStr,
      totalItems: basket.length,
      totalAmount: subtotal,
      discountAmount,
      netAmount: netTotal,
      status: "PENDING",
      items: basket.map((item) => ({
        type: item.subTypeLabel,
        number: item.number,
        price: item.price,
      })),
    };

    set({
      memberBalance: memberBalance - netTotal,
      basket: [],
      orders: [newOrder, ...orders],
      lastSubmittedOrder: newOrder,
      isBasketOpen: false,
      isConfirmModalOpen: false,
    });

    return { success: true, order: newOrder };
  },
}));
