import { NextResponse } from "next/server";
import { HearderMetricSummary } from "@/types/lottery";

// Mock data store for Hearder Analytics
const MOCK_ADMINS = [
  { id: "admin-all", name: "ทั้งหมด (All Admins)" },
  { id: "admin-001", name: "Admin สมชาย (สาขาหน้าร้าน)" },
  { id: "admin-002", name: "Admin วิชัย (สายวินมอเตอร์ไซค์)" },
  { id: "admin-003", name: "Admin กานดา (ตลาดสด)" },
];

const MOCK_BATCHES = [
  {
    id: "b-101",
    ticketName: "ป้าสมศรี หน้าร้าน",
    adminId: "admin-001",
    createdByName: "Admin สมชาย",
    periodId: "period-20261101",
    createdAt: "2026-10-26T14:20:00Z",
    items: [
      { number: "789", category: "3top", categoryLabel: "3 ตัวบน", price: 200 },
      { number: "789", category: "3tod", categoryLabel: "3 ตัวโต๊ด", price: 100 },
      { number: "45", category: "2top", categoryLabel: "2 ตัวบน", price: 500 },
      { number: "45", category: "2down", categoryLabel: "2 ตัวล่าง", price: 500 },
    ],
    commissionRate: 15,
  },
  {
    id: "b-102",
    ticketName: "วินมอเตอร์ไซค์ เบอร์ 12",
    adminId: "admin-002",
    createdByName: "Admin วิชัย",
    periodId: "period-20261101",
    createdAt: "2026-10-26T15:05:00Z",
    items: [
      { number: "789", category: "3top", categoryLabel: "3 ตัวบน", price: 300 },
      { number: "99", category: "2top", categoryLabel: "2 ตัวบน", price: 200 },
      { number: "7", category: "runtop", categoryLabel: "วิ่งบน", price: 1000 },
    ],
    commissionRate: 15,
  },
  {
    id: "b-103",
    ticketName: "เจ๊ณี ตลาดสด โพย 1",
    adminId: "admin-003",
    createdByName: "Admin กานดา",
    periodId: "period-20261101",
    createdAt: "2026-10-26T16:10:00Z",
    items: [
      { number: "123", category: "3top", categoryLabel: "3 ตัวบน", price: 100 },
      { number: "123", category: "3tod", categoryLabel: "3 ตัวโต๊ด", price: 50 },
      { number: "45", category: "2top", categoryLabel: "2 ตัวบน", price: 200 },
      { number: "3", category: "rundown", categoryLabel: "วิ่งล่าง", price: 500 },
    ],
    commissionRate: 15,
  },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterAdminId = searchParams.get("admin_id");

  const filteredBatches =
    filterAdminId && filterAdminId !== "admin-all"
      ? MOCK_BATCHES.filter((b) => b.adminId === filterAdminId)
      : MOCK_BATCHES;

  const metrics: HearderMetricSummary = {
    twoTopTotal: 0,
    twoDownTotal: 0,
    twoTodTotal: 0,
    threeTopTotal: 0,
    threeDownTotal: 0,
    threeTodTotal: 0,
    runTopTotal: 0,
    runDownTotal: 0,
    totalGrossBet: 0,
    totalCommission: 0,
    totalNetBet: 0,
  };

  filteredBatches.forEach((batch) => {
    let batchGross = 0;
    batch.items.forEach((item) => {
      batchGross += item.price;
      if (item.category === "2top") metrics.twoTopTotal += item.price;
      else if (item.category === "2down") metrics.twoDownTotal += item.price;
      else if (item.category === "2tod") metrics.twoTodTotal += item.price;
      else if (item.category === "3top") metrics.threeTopTotal += item.price;
      else if (item.category === "3down") metrics.threeDownTotal += item.price;
      else if (item.category === "3tod") metrics.threeTodTotal += item.price;
      else if (item.category === "runtop") metrics.runTopTotal += item.price;
      else if (item.category === "rundown") metrics.runDownTotal += item.price;
    });

    const commAmount = batchGross * (batch.commissionRate / 100);
    metrics.totalGrossBet += batchGross;
    metrics.totalCommission += commAmount;
    metrics.totalNetBet += batchGross - commAmount;
  });

  return NextResponse.json({
    success: true,
    filterAdminId: filterAdminId || "admin-all",
    admins: MOCK_ADMINS,
    metrics,
    batches: filteredBatches,
  });
}

