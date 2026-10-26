/**
 * Lottery Permutation and Verification Engine
 * Implements TICKET-002: Betting Permutation Engine & 2-Digit Tod Verification Module
 */

/**
 * Generate 2-digit permutations (สลับหลักสิบและหลักหน่วย)
 * Handles doubles (e.g. '11' -> ['11']) and distinct pairs (e.g. '12' -> ['12', '21'])
 */
export function generate2Permutations(num: string): string[] {
  if (num.length !== 2) return [num];
  const d0 = num[0];
  const d1 = num[1];
  if (d0 === d1) {
    return [num];
  }
  return [num, `${d1}${d0}`];
}

/**
 * Generate 3-digit permutations
 * Handles triplets e.g. '111' -> ['111'] (1)
 * Handles double/ham e.g. '112' -> ['112', '121', '211'] (3)
 * Handles distinct digits e.g. '123' -> 6 permutations
 */
export function generate3Permutations(num: string): string[] {
  if (num.length !== 3) return [num];
  const digits = num.split('');
  const uniquePerms = new Set<string>();

  function permute(arr: string[], m: string[] = []) {
    if (arr.length === 0) {
      uniquePerms.add(m.join(''));
    } else {
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next));
      }
    }
  }

  permute(digits);
  return Array.from(uniquePerms).sort();
}

/**
 * Check 2-Digit Tod Win (กฎการตรวจ 2 ตัวโต๊ด)
 * - ตรวจเทียบกับผลลัพธ์ 3 ตัวบน (3 หลักท้ายของรางวัลที่ 1)
 * - ตัวเลขทั้ง 2 หลักที่ซื้อ จะต้องปรากฏอยู่ในเลข 3 ตัวบนครบทั้งสองตัว โดยอยู่ตำแหน่งใดก็ได้
 * - กรณีเลขเบิ้ล (เช่น '11'): จะถูกรางวัลก็ต่อเมื่อในผล 3 ตัวบนมีเลข '1' อย่างน้อย 2 ตัว
 */
export function check2TodWin(betNumber: string, top3Result: string): boolean {
  if (betNumber.length !== 2 || top3Result.length !== 3) return false;
  const digitA = betNumber[0];
  const digitB = betNumber[1];

  if (digitA === digitB) {
    const occurrences = top3Result.split('').filter((d) => d === digitA).length;
    return occurrences >= 2;
  }
  return top3Result.includes(digitA) && top3Result.includes(digitB);
}

/**
 * Check 3-Digit Tod Win
 */
export function check3TodWin(betNumber: string, top3Result: string): boolean {
  if (betNumber.length !== 3 || top3Result.length !== 3) return false;
  const sortedBet = betNumber.split('').sort().join('');
  const sortedResult = top3Result.split('').sort().join('');
  return sortedBet === sortedResult;
}
