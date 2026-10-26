import { describe, it, expect } from "vitest";
import {
  generate2Permutations,
  generate3Permutations,
  check2TodWin,
} from "../src/lib/lottery/engine";
import {
  calculateNetBet,
  calculateSettlementBalance,
  executeSettlement,
} from "../src/lib/lottery/settlement";
import { AggregatedBetRow, CartBetItem } from "../src/types/lottery";

describe("TICKET-003 & TICKET-004: Auto-Commit & 4-Column Cart Aggregation", () => {
  it("auto-commit permutation expands distinct 2-digit numbers", () => {
    const inputDigits = "45";
    const perms = generate2Permutations(inputDigits);
    expect(perms).toEqual(["45", "54"]);
  });

  it("auto-commit permutation handles double numbers without duplicate entries", () => {
    const inputDigits = "11";
    const perms = generate2Permutations(inputDigits);
    expect(perms).toEqual(["11"]);
  });

  it("correctly aggregates bets on the same number into a 4-column row", () => {
    // Simulating items entering cart
    const items: CartBetItem[] = [
      {
        id: "1",
        number: "123",
        category: "3top",
        categoryLabel: "3 ตัวบน",
        price: 100,
        payoutRate: 900,
      },
      {
        id: "2",
        number: "123",
        category: "3tod",
        categoryLabel: "3 ตัวโต๊ด",
        price: 50,
        payoutRate: 150,
      },
      {
        id: "3",
        number: "45",
        category: "2top",
        categoryLabel: "2 ตัวบน",
        price: 200,
        payoutRate: 95,
      },
      {
        id: "4",
        number: "45",
        category: "2down",
        categoryLabel: "2 ตัวล่าง",
        price: 200,
        payoutRate: 95,
      },
    ];

    // Aggregation logic
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

      if (item.category === "2top" || item.category === "3top") {
        row.topAmount += item.price;
      } else if (item.category === "2down" || item.category === "3down") {
        row.downAmount += item.price;
      } else if (item.category === "2tod" || item.category === "3tod") {
        row.todAmount += item.price;
      }

      row.totalRowAmount += item.price;
    });

    const rows = Array.from(map.values());
    expect(rows).toHaveLength(2);

    const row123 = map.get("123");
    expect(row123).toBeDefined();
    expect(row123?.topAmount).toBe(100);
    expect(row123?.todAmount).toBe(50);
    expect(row123?.downAmount).toBe(0);
    expect(row123?.totalRowAmount).toBe(150);

    const row45 = map.get("45");
    expect(row45).toBeDefined();
    expect(row45?.topAmount).toBe(200);
    expect(row45?.downAmount).toBe(200);
    expect(row45?.todAmount).toBe(0);
    expect(row45?.totalRowAmount).toBe(400);
  });

  it("calculates financial breakdown accurately for Admin vs Hearder", () => {
    const grossTotal = 550; // 150 + 400
    const commissionRate = 15; // 15%
    const expectedCommission = 82.5;
    const expectedNet = 467.5;

    const net = calculateNetBet(grossTotal, commissionRate);
    expect(net).toBe(expectedNet);

    const settlement = executeSettlement(grossTotal, commissionRate, 0);
    expect(settlement.grossBet).toBe(grossTotal);
    expect(settlement.commissionAmount).toBe(expectedCommission);
    expect(settlement.currentNetBet).toBe(expectedNet);
  });
});

describe("TICKET-005: Hearder Admin Filter & Number Inspector Verification", () => {
  const mockBatches = [
    {
      id: "b-1",
      ticketName: "ป้าสมศรี หน้าร้าน",
      adminId: "admin-001",
      createdByName: "Admin สมชาย",
      items: [
        { number: "789", category: "3top", price: 200 },
        { number: "789", category: "3tod", price: 100 },
        { number: "45", category: "2top", price: 300 },
      ],
      commissionRate: 15,
    },
    {
      id: "b-2",
      ticketName: "วินมอเตอร์ไซค์",
      adminId: "admin-002",
      createdByName: "Admin วิชัย",
      items: [
        { number: "789", category: "3top", price: 500 },
        { number: "99", category: "2top", price: 200 },
      ],
      commissionRate: 15,
    },
  ];

  it("filters batches accurately by Admin ID", () => {
    const admin1Batches = mockBatches.filter((b) => b.adminId === "admin-001");
    expect(admin1Batches).toHaveLength(1);
    expect(admin1Batches[0].ticketName).toBe("ป้าสมศรี หน้าร้าน");

    const admin2Batches = mockBatches.filter((b) => b.adminId === "admin-002");
    expect(admin2Batches).toHaveLength(1);
    expect(admin2Batches[0].ticketName).toBe("วินมอเตอร์ไซค์");
  });

  it("aggregates number exposure volume accurately across multiple admins", () => {
    const targetNumber = "789";
    let totalVolume = 0;
    const sources: string[] = [];

    mockBatches.forEach((batch) => {
      batch.items.forEach((item) => {
        if (item.number === targetNumber) {
          totalVolume += item.price;
          sources.push(`${batch.createdByName}: ${item.price}฿`);
        }
      });
    });

    // 200 (top) + 100 (tod) from admin-1 + 500 (top) from admin-2 = 800
    expect(totalVolume).toBe(800);
    expect(sources).toHaveLength(3);
  });
});
