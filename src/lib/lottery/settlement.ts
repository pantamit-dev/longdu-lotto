/**
 * Rolling Credit Settlement Engine
 * Implements TICKET-002: Rolling Credit Settlement Calculation
 */

export interface SettlementResult {
  grossBet: number;
  commissionRate: number; // percentage e.g. 15 for 15%
  commissionAmount: number;
  currentNetBet: number;
  winReward: number;
  settlementBalance: number;
  settlementStatus: 'HEARDER_PAYS_ADMIN' | 'ROLL_OVER_NEXT_ROUND' | 'EVEN';
}

/**
 * Calculate net bet after admin commission
 * Current Net Bet = Gross Bet * (1 - Commission Rate)
 */
export function calculateNetBet(grossBet: number, commissionRatePercent: number): number {
  const rateFraction = commissionRatePercent > 1 ? commissionRatePercent / 100 : commissionRatePercent;
  const net = grossBet * (1 - rateFraction);
  return Math.round(net * 100) / 100;
}

/**
 * Calculate rolling settlement balance
 * Settlement Balance = Win Reward - Current Net Bet
 */
export function calculateSettlementBalance(winReward: number, currentNetBet: number): number {
  return Math.round((winReward - currentNetBet) * 100) / 100;
}

/**
 * Execute full settlement calculation
 */
export function executeSettlement(
  grossBet: number,
  commissionRatePercent: number,
  winReward: number = 0
): SettlementResult {
  const rateFraction = commissionRatePercent > 1 ? commissionRatePercent / 100 : commissionRatePercent;
  const commissionAmount = Math.round(grossBet * rateFraction * 100) / 100;
  const currentNetBet = Math.round((grossBet - commissionAmount) * 100) / 100;
  const settlementBalance = calculateSettlementBalance(winReward, currentNetBet);

  let settlementStatus: SettlementResult['settlementStatus'] = 'EVEN';
  if (settlementBalance > 0) {
    settlementStatus = 'HEARDER_PAYS_ADMIN';
  } else if (settlementBalance < 0) {
    settlementStatus = 'ROLL_OVER_NEXT_ROUND';
  }

  return {
    grossBet,
    commissionRate: commissionRatePercent,
    commissionAmount,
    currentNetBet,
    winReward,
    settlementBalance,
    settlementStatus,
  };
}
