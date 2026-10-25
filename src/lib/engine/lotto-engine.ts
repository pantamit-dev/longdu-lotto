/**
 * Longdu Lotto Core Engine
 * Standard Thai Lottery Permutations, 19-Door Expansion, and Pricing Algorithms
 * Grounded on the official Longdu Lotto Suite specification.
 */

export type LottoMode = "2digit" | "3digit" | "19door" | "run";

export type LottoSubType =
  | "BT_2TOP" // 2 ตัวบน
  | "BT_2DOWN" // 2 ตัวล่าง
  | "BT_2TOD" // 2 ตัวโต๊ด
  | "BT_3TOP" // 3 ตัวบน
  | "BT_3TOD" // 3 ตัวโต๊ด
  | "BT_3FRONT" // 3 ตัวหน้า
  | "BT_3DOWN" // 3 ตัวล่าง (ท้าย)
  | "BT_RUNTOP" // วิ่งบน
  | "BT_RUNDOWN"; // วิ่งล่าง

export interface LottoBetItem {
  id: string;
  subType: LottoSubType;
  subTypeLabel: string;
  number: string;
  price: number;
  payoutRate: number;
}

export const PAYOUT_RATES: Record<LottoSubType, number> = {
  BT_3TOP: 900,
  BT_3TOD: 150,
  BT_3FRONT: 450,
  BT_3DOWN: 450,
  BT_2TOP: 95,
  BT_2DOWN: 95,
  BT_2TOD: 12,
  BT_RUNTOP: 3.2,
  BT_RUNDOWN: 4.2,
};

export const SUBTYPE_LABELS: Record<LottoSubType, string> = {
  BT_3TOP: "3 ตัวบน",
  BT_3TOD: "3 ตัวโต๊ด",
  BT_3FRONT: "3 ตัวหน้า",
  BT_3DOWN: "3 ตัวท้าย",
  BT_2TOP: "2 ตัวบน",
  BT_2DOWN: "2 ตัวล่าง",
  BT_2TOD: "2 ตัวโต๊ด",
  BT_RUNTOP: "วิ่งบน",
  BT_RUNDOWN: "วิ่งล่าง",
};

/**
 * 2-Digit Permutations (กลับเลข 2 ตัว)
 * Distinct digits: ["12", "21"] (2 sets)
 * Double digits: ["11"] (1 set)
 */
export function generate2DigitPermutations(num: string): string[] {
  if (!/^\d{2}$/.test(num)) return [];
  const [d1, d2] = num.split("");
  if (d1 === d2) return [num];
  return [num, `${d2}${d1}`];
}

/**
 * 3-Digit Permutations (6 กลับ / 3 กลับ)
 * Distinct digits (e.g. 123): 6 sets
 * Pair digits (e.g. 112): 3 sets
 * Triple digits (e.g. 111): 1 set
 */
export function generate3DigitPermutations(num: string): string[] {
  if (!/^\d{3}$/.test(num)) return [];
  const chars = num.split("");
  const results = new Set<string>();

  const permute = (arr: string[], m: string[] = []) => {
    if (arr.length === 0) {
      results.add(m.join(""));
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  };

  permute(chars);
  return Array.from(results).sort();
}

/**
 * 19 ประตู (19-Door Expansion)
 * Expands a single digit (0-9) into 19 distinct 2-digit numbers
 * Tens: D0 to D9 (10 numbers)
 * Units: 0D to 9D (10 numbers, DD shared -> 19 total)
 */
export function generate19Door(digit: string): string[] {
  if (!/^\d$/.test(digit)) return [];
  const d = parseInt(digit, 10);
  const set = new Set<string>();

  // Tens (รูดหน้า)
  for (let i = 0; i <= 9; i++) {
    set.add(`${d}${i}`);
  }

  // Units (รูดหลัง)
  for (let i = 0; i <= 9; i++) {
    set.add(`${i}${d}`);
  }

  return Array.from(set).sort();
}

/**
 * รูดหน้า (Tens place is fixed to digit, 10 items)
 */
export function generateRootFront(digit: string): string[] {
  if (!/^\d$/.test(digit)) return [];
  const results: string[] = [];
  for (let i = 0; i <= 9; i++) {
    results.push(`${digit}${i}`);
  }
  return results;
}

/**
 * รูดหลัง (Units place is fixed to digit, 10 items)
 */
export function generateRootBack(digit: string): string[] {
  if (!/^\d$/.test(digit)) return [];
  const results: string[] = [];
  for (let i = 0; i <= 9; i++) {
    results.push(`${i}${digit}`);
  }
  return results;
}

/**
 * Calculates financial breakdown for a list of items
 */
export function calculateTotals(items: LottoBetItem[], discountRatePercent: number) {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = Math.round((subtotal * discountRatePercent) / 100);
  const netTotal = Math.max(0, subtotal - discountAmount);
  return {
    subtotal,
    discountAmount,
    netTotal,
    itemCount: items.length,
  };
}

/**
 * GLO Draw Matching Engine
 */
export interface OfficialDrawResult {
  period: string;
  firstPrize: string; // e.g. "285664"
  frontThree: string[]; // e.g. ["025", "482"]
  backThree: string[]; // e.g. ["113", "726"]
  backTwo: string; // e.g. "15"
}

export interface MatchResultItem {
  orderNo: string;
  type: string;
  number: string;
  price: number;
  payoutRate: number;
  prizeAmount: number;
  ruleExplanation: string;
}

export interface AutoCheckReport {
  totalOrdersChecked: number;
  totalTicketsChecked: number;
  winningTicketsCount: number;
  totalPrizeWon: number;
  winningItems: MatchResultItem[];
}

export function matchTicketsAgainstDraw(
  orders: { orderNo: string; items: { type: string; number: string; price: number }[] }[],
  draw: OfficialDrawResult
): AutoCheckReport {
  const winningItems: MatchResultItem[] = [];
  let totalTicketsChecked = 0;

  const top3 = draw.firstPrize.slice(-3);
  const top2 = draw.firstPrize.slice(-2);
  const todPermutations = generate3DigitPermutations(top3);

  for (const order of orders) {
    for (const item of order.items) {
      totalTicketsChecked++;
      let won = false;
      let rate = 0;
      let reason = "";

      if (item.type.includes("3 ตัวบน") && item.number === top3) {
        won = true;
        rate = PAYOUT_RATES.BT_3TOP;
        reason = `ตรงกับ 3 ตัวท้ายรางวัลที่ 1 (${top3})`;
      } else if (item.type.includes("3 ตัวโต๊ด") && todPermutations.includes(item.number)) {
        won = true;
        rate = PAYOUT_RATES.BT_3TOD;
        reason = `ตรงกับโต๊ดรางวัลที่ 1 (${top3})`;
      } else if (item.type.includes("3 ตัวหน้า") && draw.frontThree.includes(item.number)) {
        won = true;
        rate = PAYOUT_RATES.BT_3FRONT;
        reason = `ตรงกับรางวัลเลขหน้า 3 ตัว (${item.number})`;
      } else if (item.type.includes("3 ตัวท้าย") && draw.backThree.includes(item.number)) {
        won = true;
        rate = PAYOUT_RATES.BT_3DOWN;
        reason = `ตรงกับรางวัลเลขท้าย 3 ตัว (${item.number})`;
      } else if (item.type.includes("2 ตัวบน") && item.number === top2) {
        won = true;
        rate = PAYOUT_RATES.BT_2TOP;
        reason = `ตรงกับ 2 ตัวท้ายรางวัลที่ 1 (${top2})`;
      } else if (item.type.includes("2 ตัวล่าง") && item.number === draw.backTwo) {
        won = true;
        rate = PAYOUT_RATES.BT_2DOWN;
        reason = `ตรงกับรางวัลเลขท้าย 2 ตัว (${draw.backTwo})`;
      } else if (item.type.includes("วิ่งบน") && top3.includes(item.number)) {
        won = true;
        rate = PAYOUT_RATES.BT_RUNTOP;
        reason = `มีเลข ${item.number} ใน 3 ตัวท้ายรางวัลที่ 1 (${top3})`;
      } else if (item.type.includes("วิ่งล่าง") && draw.backTwo.includes(item.number)) {
        won = true;
        rate = PAYOUT_RATES.BT_RUNDOWN;
        reason = `มีเลข ${item.number} ในเลขท้าย 2 ตัว (${draw.backTwo})`;
      }

      if (won) {
        winningItems.push({
          orderNo: order.orderNo,
          type: item.type,
          number: item.number,
          price: item.price,
          payoutRate: rate,
          prizeAmount: Math.round(item.price * rate),
          ruleExplanation: reason,
        });
      }
    }
  }

  const totalPrizeWon = winningItems.reduce((sum, item) => sum + item.prizeAmount, 0);

  return {
    totalOrdersChecked: orders.length,
    totalTicketsChecked,
    winningTicketsCount: winningItems.length,
    totalPrizeWon,
    winningItems,
  };
}
