/**
 * Lottery Type Definitions
 * Spec: Modern Cloud-Native Lotto Suite (Agent-Centric B2B2C)
 */

export type UserRole = 'OWNER' | 'HEARDER' | 'ADMIN' | 'STUFF' | 'MEMBER';

export type LottoMode = '2digit' | '3digit' | 'run' | '19door';

export type BetCategory =
  | '2top'
  | '2down'
  | '2tod'
  | '3top'
  | '3down'
  | '3tod'
  | 'runtop'
  | 'rundown';

export interface CartBetItem {
  id: string;
  number: string;
  category: BetCategory;
  categoryLabel: string;
  price: number;
  payoutRate: number;
}

/**
 * 4-Column Aggregated Table Row (modal_panel_preview)
 * Columns: [ตัวเลข] [บน] [ล่าง] [โต๊ด]
 */
export interface AggregatedBetRow {
  number: string;
  digitsLength: number;
  topAmount: number;   // บน (2top, 3top, runtop)
  downAmount: number;  // ล่าง (2down, 3down, rundown)
  todAmount: number;   // โต๊ด (2tod, 3tod)
  totalRowAmount: number;
}

export interface TicketBatch {
  id: string;
  ticketName: string;
  adminId: string;
  createdBy: string;
  createdByName?: string;
  periodId: string;
  items: CartBetItem[];
  aggregatedRows: AggregatedBetRow[];
  grossAmount: number;
  commissionRate: number; // e.g. 15 for 15%
  commissionAmount: number;
  netAmount: number;
  winAmount: number;
  createdAt: string;
  status: 'PENDING' | 'SUBMITTED' | 'WON' | 'LOST';
}

export interface AdminRoundBalance {
  id: string;
  periodId: string;
  adminId: string;
  adminName: string;
  previousBalance: number;
  currentGrossBet: number;
  currentCommission: number;
  currentNetBet: number;
  currentWinReward: number;
  settlementStatus: 'PENDING' | 'HEARDER_PAYS_ADMIN' | 'ROLL_OVER_NEXT_ROUND' | 'EVEN';
}

export interface HearderMetricSummary {
  twoTopTotal: number;
  twoDownTotal: number;
  twoTodTotal: number;
  threeTopTotal: number;
  threeDownTotal: number;
  threeTodTotal: number;
  runTopTotal: number;
  runDownTotal: number;
  totalGrossBet: number;
  totalCommission: number;
  totalNetBet: number;
}
