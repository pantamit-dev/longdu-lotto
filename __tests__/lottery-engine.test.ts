import { describe, it, expect } from 'vitest';
import {
  check2TodWin,
  check3TodWin,
  generate2Permutations,
  generate3Permutations,
} from '../src/lib/lottery/engine';
import {
  calculateNetBet,
  calculateSettlementBalance,
  executeSettlement,
} from '../src/lib/lottery/settlement';

describe('TICKET-002: Betting Permutation & 2-Digit Tod Engine', () => {
  describe('check2TodWin Verification Gate', () => {
    it('returns false for 13 on 211 (contains 1 but missing 3)', () => {
      expect(check2TodWin('13', '211')).toBe(false);
    });

    it('returns true for 13 on 123 (contains both 1 and 3)', () => {
      expect(check2TodWin('13', '123')).toBe(true);
    });

    it('returns true for 13 on 319 (contains both 1 and 3)', () => {
      expect(check2TodWin('13', '319')).toBe(true);
    });

    it('returns true for double 11 on 121 (contains two 1s)', () => {
      expect(check2TodWin('11', '121')).toBe(true);
    });

    it('returns false for double 11 on 123 (contains only one 1)', () => {
      expect(check2TodWin('11', '123')).toBe(false);
    });

    it('returns true for double 11 on 111 (contains three 1s)', () => {
      expect(check2TodWin('11', '111')).toBe(true);
    });

    it('handles invalid input lengths safely', () => {
      expect(check2TodWin('1', '123')).toBe(false);
      expect(check2TodWin('123', '123')).toBe(false);
      expect(check2TodWin('12', '12')).toBe(false);
    });
  });

  describe('Permutation Generators', () => {
    it('generates 2-digit double permutation as 1 item', () => {
      expect(generate2Permutations('11')).toEqual(['11']);
      expect(generate2Permutations('99')).toEqual(['99']);
    });

    it('generates 2-digit distinct permutations as 2 items', () => {
      const perms = generate2Permutations('12');
      expect(perms).toHaveLength(2);
      expect(perms).toContain('12');
      expect(perms).toContain('21');
    });

    it('generates 3-digit triplet permutation as 1 item', () => {
      expect(generate3Permutations('111')).toEqual(['111']);
    });

    it('generates 3-digit double/ham permutations as 3 items', () => {
      const perms = generate3Permutations('112');
      expect(perms).toHaveLength(3);
      expect(perms).toEqual(['112', '121', '211'].sort());
    });

    it('generates 3-digit distinct permutations as 6 items (6 กลับ)', () => {
      const perms = generate3Permutations('123');
      expect(perms).toHaveLength(6);
      expect(perms).toEqual(['123', '132', '213', '231', '312', '321'].sort());
    });
  });

  describe('3-Digit Tod Verification', () => {
    it('checks 3-digit tod win accurately across all permutations', () => {
      expect(check3TodWin('123', '321')).toBe(true);
      expect(check3TodWin('123', '123')).toBe(true);
      expect(check3TodWin('123', '124')).toBe(false);
      expect(check3TodWin('112', '211')).toBe(true);
      expect(check3TodWin('112', '122')).toBe(false);
    });
  });

  describe('Settlement Engine Calculations', () => {
    it('calculates Net Bet correctly with commission discount', () => {
      // Gross Bet = 1000, Commission = 15% -> Net Bet = 850
      expect(calculateNetBet(1000, 15)).toBe(850);
      expect(calculateNetBet(500, 20)).toBe(400);
      expect(calculateNetBet(100, 0)).toBe(100);
    });

    it('determines Hearder Settlement Balance when win exceeds net bet', () => {
      // Win Reward = 5000, Net Bet = 850 -> Balance = +4150 (Hearder pays Admin)
      const res = executeSettlement(1000, 15, 5000);
      expect(res.grossBet).toBe(1000);
      expect(res.commissionAmount).toBe(150);
      expect(res.currentNetBet).toBe(850);
      expect(res.winReward).toBe(5000);
      expect(res.settlementBalance).toBe(4150);
      expect(res.settlementStatus).toBe('HEARDER_PAYS_ADMIN');
    });

    it('determines Rolling Balance when net bet exceeds win', () => {
      // Win Reward = 0, Net Bet = 850 -> Balance = -850 (Rolled over to next round)
      const res = executeSettlement(1000, 15, 0);
      expect(res.settlementBalance).toBe(-850);
      expect(res.settlementStatus).toBe('ROLL_OVER_NEXT_ROUND');
    });
  });
});

