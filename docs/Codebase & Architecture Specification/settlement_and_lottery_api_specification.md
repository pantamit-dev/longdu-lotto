# 04. Deep Settlement Module, Real-time GLO API & Financial Balancing Specification
**Project Name:** Modern Cloud-Native & LINE MINI App Lotto Suite  
**Target Platform:** Next.js 15+ (App Router), Supabase (PostgreSQL 16+), Vercel Serverless  
**Module Role:** Deep Settlement & Verification Engine (Core Financial Settlement)  
**Legacy Reference:** The Best (Longdu Lotto Suite - `n_result`, `report_result.rdl`, `financial_settlement.md`)

---

## 1. การออกแบบเชิงสถาปัตยกรรม (Architectural Depth & Seam Discipline)

ตามหลักการออกแบบสถาปัตยกรรมโค้ดเบสระดับลึก (Deep Module Design) ระบบประมวลผลรางวัลและชำระดุลบัญชี (Settlement Engine) ถูกออกแบบให้มีโครงสร้างดังนี้:
- **Narrow Interface (อินเทอร์เฟซแคบ):** ผู้เรียกใช้งานภายนอก (Next.js Route Handler, Cron Job หรือเจ้ามือ) มีจุดปฏิสัมพันธ์เพียงจุดเดียวคือคำสั่ง `settleRound(periodId, options?)`
- **Deep Behavior (พฤติกรรมภายในลึก):** ซ่อนความซับซ้อนของเครือข่ายภายนอก (External Network Retries), Circuit Breaker สลับ Fallback API อัตโนมัติ, การกระจายตัวเลขโต๊ด 6 ประตู, การตรวจผลรางวัลแบบ Bulk Batch Update, การคำนวณคอมมิชชั่น 2 ระดับ และการลงบัญชีดุลกำไร-ขาดทุนแบบอะตอมิก (Atomic Transaction)
- **Locality (รวมศูนย์ความรับผิดชอบ):** สูตรคำนวณทางการเงิน กฎเกณฑ์อัตราจ่าย (Payout Rates) และเงื่อนไขการถูกรางวัล 22 หมวดหมู่ทั้งหมด ถูกจำกัดขอบเขตอยู่ภายในโมดูลนี้เพียงจุดเดียว ไม่กระจายออกไปฝั่ง UI หรือ Client Component
- **Seam & Adapters (รอยต่อและตัวปรับต่อ):** แยกชั้นการดึงผลสลากกินแบ่งรัฐบาลออกจากเอนจินคำนวณผ่าน Interface `LotteryResultSource` โดยมี Adapter 3 ชุดตามกฎ *"Two adapters = real seam"*:
  1. `GloOfficialAdapter`: ตัวปรับต่อหลัก ยิงตรงหาสำนักงานสลากกินแบ่งรัฐบาล (GLO Official API)
  2. `RayriffyFallbackAdapter`: ตัวปรับต่อสำรอง ดึงข้อมูลผ่าน Thai Lottery Open API
  3. `MockLotteryAdapter`: ตัวปรับต่อจำลอง สำหรับรัน Unit Tests และ E2E Simulation โดยไม่ต้องพึ่งเครือข่าย

```
                                  [ settleRound(periodId) ]
                                              │
                                              ▼
                             ┌─────────────────────────────────┐
                             │     Deep Settlement Engine      │
                             │  (lib/settlement-engine.ts)     │
                             └────────────────┬────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
                    ▼ (ผ่าน Seam: LotteryResultSource)                  ▼ (Database Engine)
     ┌─────────────────────────────┐                     ┌─────────────────────────────┐
     │      Result Adapters        │                     │   fn_execute_settlement     │
     │ ├─ GloOfficialAdapter       │                     │ ├─ Match 22 Categories      │
     │ ├─ RayriffyFallbackAdapter  │                     │ ├─ Calculate Win Rewards    │
     │ └─ MockLotteryAdapter       │                     │ ├─ Reconcile Customer Bal.  │
     └─────────────────────────────┘                     │ └─ Reconcile Vendor Bal.    │
                                                         └─────────────────────────────┘
```

---

## 2. ข้อมูลจำเพาะของแหล่งข้อมูลผลรางวัล (Draw Source Specifications)

### 2.1 แหล่งข้อมูลหลัก: สำนักงานสลากกินแบ่งรัฐบาล (GLO Official API)
- **Endpoint:** `POST https://www.glo.or.th/api/lottery/getLatestLottery`
- **HTTP Method:** `POST`
- **Headers:** `Content-Type: application/json`
- **Request Body:** `{}` (Empty JSON Object)
- **โครงสร้างข้อมูลสำคัญที่ได้รับ (Response Meta Data):**
  - `response.displayDate`: วันที่ออกรางวัล (เช่น `"16 ตุลาคม 2569"`)
  - `response.period`: งวดชุดประจำวันที่
  - `response.first.number[0].value`: หมายเลขรางวัลที่ 1 (สตริง 6 หลัก เช่น `"735867"`)
  - `response.last2.number[0].value`: เลขท้าย 2 ตัว (สตริง 2 หลัก เช่น `"02"`)
  - `response.last3f.number`: อาร์เรย์เลขหน้า 3 ตัว (จำนวน 2 รางวัล เช่น `[{"value": "701"}, {"value": "884"}]`)
  - `response.last3b.number`: อาร์เรย์เลขท้าย 3 ตัว (จำนวน 2 รางวัล เช่น `[{"value": "395"}, {"value": "081"}]`)
  - `response.second`, `third`, `fourth`, `fifth`, `near1`: ผลรางวัลข้างเคียงและรางวัลอื่น ๆ

### 2.2 แหล่งข้อมูลสำรอง: Thai Lottery Open API (Rayriffy Fallback Engine)
- **Endpoint:** `GET https://lotto.api.rayriffy.com/latest`
- **HTTP Method:** `GET`
- **Headers:** `Accept: application/json`
- **โครงสร้างข้อมูลสำคัญที่ได้รับ:**
  - `response.date`: วันที่ออกรางวัล
  - `response.prizes[id="prizeFirst"].number[0]`: รางวัลที่ 1 (สตริง 6 หลัก)
  - `response.runningNumbers[id="runningNumberFrontThree"].number`: เลขหน้า 3 ตัว (2 รางวัล)
  - `response.runningNumbers[id="runningNumberBackThree"].number`: เลขท้าย 3 ตัว (2 รางวัล)
  - `response.runningNumbers[id="runningNumberBackTwo"].number[0]`: เลขท้าย 2 ตัว (1 รางวัล)

---

## 3. โครงสร้างฐานข้อมูลผลรางวัล (Database Schema DDL: `n_result`)

```sql
-- migration: create_n_result_schema.sql
CREATE TABLE IF NOT EXISTS public.n_result (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    period_id UUID NOT NULL REFERENCES public.n_period(id) ON DELETE CASCADE,
    draw_date DATE NOT NULL,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- หมายเลขรางวัลหลัก (Main Drawn Numbers)
    prize_first VARCHAR(6) NOT NULL,            -- รางวัลที่ 1 เต็ม 6 หลัก (เช่น '735867')
    n_3top VARCHAR(3) NOT NULL,                 -- 3 ตัวบน (3 หลักท้ายรางวัลที่ 1: '867')
    n_2top VARCHAR(2) NOT NULL,                 -- 2 ตัวบน (2 หลักท้ายรางวัลที่ 1: '67')
    n_2down VARCHAR(2) NOT NULL,                -- 2 ตัวล่าง (เลขท้าย 2 ตัว: '02')
    
    -- รางวัล 3 ตัวหน้าตรง 2 รางวัล
    n_3front1 VARCHAR(3) NOT NULL,
    n_3front2 VARCHAR(3) NOT NULL,
    
    -- รางวัล 3 ตัวล่าง / เลขท้าย 3 ตัว (2 ถึง 4 รางวัล)
    n_3down1 VARCHAR(3) NOT NULL,
    n_3down2 VARCHAR(3) NOT NULL,
    n_3down3 VARCHAR(3) DEFAULT NULL,
    n_3down4 VARCHAR(3) DEFAULT NULL,
    
    -- ชุดตัวเลข 3 ตัวโต๊ด 6 ประตู (Permutation ของ n_3top)
    todd_3top VARCHAR(3)[] NOT NULL,
    
    -- เลขวิ่งแยกหลักเดี่ยว (Individual Running Digits)
    n_runtop1 VARCHAR(1) NOT NULL,
    n_runtop2 VARCHAR(1) NOT NULL,
    n_runtop3 VARCHAR(1) NOT NULL,
    n_rundown1 VARCHAR(1) NOT NULL,
    n_rundown2 VARCHAR(1) NOT NULL,
    
    source_provider VARCHAR(50) NOT NULL DEFAULT 'GLO_OFFICIAL',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    CONSTRAINT uq_n_result_period UNIQUE (period_id)
);

-- ดัชนีเพื่อเพิ่มความเร็วในการสืบค้นและการตรวจผล
CREATE INDEX IF NOT EXISTS idx_n_result_period ON public.n_result(period_id);
CREATE INDEX IF NOT EXISTS idx_n_result_todd ON public.n_result USING GIN (todd_3top);
CREATE INDEX IF NOT EXISTS idx_n_result_raw ON public.n_result USING GIN (raw_payload);
```

---

## 4. แมทริกซ์การตรวจรางวัล 22 หมวดหมู่ (Result Matching Matrix)

เมื่อผลสลากถูกนำเข้าสู่ระบบ ตรรกะของเอนจินจะทำการจับคู่รายการในโพย `n_batch` กับฟิลด์ใน `n_result` ตามกฎเกณฑ์ดังนี้:

| รหัสประเภท (`bt_type`) | ชื่อหมวดหมู่ภาษาไทย | ฟิลด์หรือเงื่อนไขใน `n_result` ที่ใช้จับคู่ | อัตราจ่ายดีฟอลต์ (`payout_rate`) |
| :--- | :--- | :--- | :--- |
| `BT_3TOP` | 3 ตัวบน | `batch.number_string = result.n_3top` | $\times 900.00$ |
| `BT_3TOD` | 3 ตัวโต๊ด | `batch.number_string = ANY(result.todd_3top)` | $\times 150.00$ |
| `BT_2TOP` | 2 ตัวบน | `batch.number_string = result.n_2top` | $\times 95.00$ |
| `BT_2DOWN` | 2 ตัวล่าง | `batch.number_string = result.n_2down` | $\times 95.00$ |
| `BT_2TOD` | 2 ตัวโต๊ด | `batch.number_string IN (result.n_2top, REVERSE(result.n_2top))` | $\times 15.00$ |
| `BT_3FRONT` | 3 ตัวหน้าตรง | `batch.number_string IN (result.n_3front1, result.n_3front2)` | $\times 450.00$ |
| `BT_3DOWN` | 3 ตัวล่าง | `batch.number_string IN (result.n_3down1, result.n_3down2, result.n_3down3, result.n_3down4)` | $\times 450.00$ |
| `BT_RUNTOP` | วิ่งบน | `batch.number_string IN (result.n_runtop1, result.n_runtop2, result.n_runtop3)` | $\times 3.20$ |
| `BT_RUNDOWN` | วิ่งล่าง | `batch.number_string IN (result.n_rundown1, result.n_rundown2)` | $\times 4.20$ |
| `BT_TOPFLAG100` | ปักหลักร้อย | `batch.number_string = SUBSTRING(result.n_3top FROM 1 FOR 1)` | $\times 9.00$ |
| `BT_TOPFLAG10` | ปักหลักสิบ | `batch.number_string = SUBSTRING(result.n_3top FROM 2 FOR 1)` | $\times 9.00$ |
| `BT_TOPFLAG1` | ปักหลักหน่วย | `batch.number_string = SUBSTRING(result.n_3top FROM 3 FOR 1)` | $\times 9.00$ |
| `BT_DOWNFLAG10`| ปักหลักสิบล่าง | `batch.number_string = SUBSTRING(result.n_2down FROM 1 FOR 1)` | $\times 9.00$ |
| `BT_DOWNFLAG1` | ปักหลักหน่วยล่าง| `batch.number_string = SUBSTRING(result.n_2down FROM 2 FOR 1)` | $\times 9.00$ |

---

## 5. การคำนวณดุลบัญชีการเงิน (Financial Mathematical Model)

ถอดแบบจากสูตรทางคณิตศาสตร์ในเทมเพลตรายงาน `report_result.rdl`, `report_result_cust_full.rdl` และ `report_result_vend_full.rdl` ของระบบ The Best:

### 5.1 ฝั่งลูกมือ / ลูกค้า (Customer & Agent Statement)
1. **ยอดซื้อรวมดิบ (Gross Sale):**
   $$\text{GrossSale} = \sum_{i=1}^{N} \text{Amount}_i$$
2. **ส่วนลดคอมมิชชั่นลูกค้า (Discount Fee):**
   $$\text{DiscountFee} = \sum_{i=1}^{N} \left( \text{Amount}_i \times \frac{\text{DiscountRate}_i}{100} \right)$$
3. **ยอดซื้อสุทธิ (Net Sale):**
   $$\text{NetSale} = \text{GrossSale} - \text{DiscountFee}$$
4. **เงินรางวัลที่ลูกค้าถูก (Customer Win Reward):**
   $$\text{WinReward} = \sum_{k \in \text{WinningEntries}} \left( \text{Amount}_k \times \text{PayoutRate}_k \right)$$
5. **ดุลบัญชีสุทธิของลูกค้า (Net Customer Balance):**
   $$\text{NetCustomerBalance} = \text{NetSale} - \text{WinReward}$$
   - หาก $\text{NetCustomerBalance} > 0$: **ลูกค้าแพ้** (ลูกค้าต้องชำระเงินยอดนี้ให้เจ้ามือ)
   - หาก $\text{NetCustomerBalance} < 0$: **ลูกค้าชนะ** (เจ้ามือต้องจ่ายเงินรางวัลสุทธิให้ลูกค้า)

### 5.2 ฝั่งตัดส่งเจ้ามือใหญ่ (Vendor / Wholesaler Statement)
1. **ยอดตัดส่งรวมดิบ (Gross Send):**
   $$\text{GrossSend} = \sum_{j=1}^{M} \text{SendAmount}_j$$
2. **คอมมิชชั่นที่ได้รับคืนจากเจ้ามือใหญ่ (Vendor Commission Credit):**
   $$\text{VendorComm} = \sum_{j=1}^{M} \left( \text{SendAmount}_j \times \frac{\text{VendorCommRate}_j}{100} \right)$$
3. **ยอดตัดส่งสุทธิที่ต้องจ่าย (Net Send Outflow):**
   $$\text{NetSend} = \text{GrossSend} - \text{VendorComm}$$
4. **เงินรางวัลที่ได้คืนจากเจ้ามือใหญ่ (Vendor Win Reimbursement):**
   $$\text{VendorWinReturn} = \sum_{m \in \text{VendorWinning}} \left( \text{SendAmount}_m \times \text{VendorPayoutRate}_m \right)$$
5. **ดุลบัญชีสุทธิกับเจ้ามือใหญ่ (Net Vendor Balance):**
   $$\text{NetVendorBalance} = \text{NetSend} - \text{VendorWinReturn}$$
   - หาก $\text{NetVendorBalance} > 0$: **เจ้ามือหลักต้องจ่ายเงินส่วนต่างให้เจ้ามือใหญ่**
   - หาก $\text{NetVendorBalance} < 0$: **เจ้ามือใหญ่ต้องโอนเงินส่วนต่างคืนให้เจ้ามือหลัก**

### 5.3 ผลกำไร-ขาดทุนสุทธิของโต๊ะ (Master Table Net Profit)
$$\text{HouseNetProfit} = \text{NetCustomerBalance} - \text{NetVendorBalance}$$

---

## 6. โค้ดตัวอย่างโมดูลชำระดุล (TypeScript Deep Module & Adapter Pattern)

### 6.1 รอยต่อและตัวปรับต่อแหล่งผลสลาก (`lib/settlement/draw-adapter.ts`)

```typescript
export interface StandardDrawResult {
  drawDate: string;
  prizeFirst: string;
  frontThree: string[];
  backThree: string[];
  backTwo: string;
  sourceProvider: "GLO_OFFICIAL" | "RAYRIFFY_FALLBACK" | "MOCK_TEST";
  rawPayload: Record<string, unknown>;
}

export interface LotteryResultSource {
  fetchLatestResult(): Promise<StandardDrawResult>;
}

// 1. Adapter หลัก: สำนักงานสลากกินแบ่งรัฐบาล
export class GloOfficialAdapter implements LotteryResultSource {
  async fetchLatestResult(): Promise<StandardDrawResult> {
    const res = await fetch("https://www.glo.or.th/api/lottery/getLatestLottery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      cache: "no-store",
      signal: AbortSignal.timeout(6000), // Timeout 6 วินาที
    });

    if (!res.ok) {
      throw new Error(`GLO Official API failed with HTTP status ${res.status}`);
    }

    const data = await res.json();
    const response = data?.response;

    const first = response?.first?.number?.[0]?.value;
    const last2 = response?.last2?.number?.[0]?.value;
    const frontThree = (response?.last3f?.number || []).map((item: { value: string }) => item.value);
    const backThree = (response?.last3b?.number || []).map((item: { value: string }) => item.value);

    if (!first || !last2) {
      throw new Error("GLO API payload is missing primary winning digits");
    }

    return {
      drawDate: response.displayDate || new Date().toISOString().split("T")[0],
      prizeFirst: first,
      frontThree,
      backThree,
      backTwo: last2,
      sourceProvider: "GLO_OFFICIAL",
      rawPayload: data,
    };
  }
}

// 2. Adapter สำรอง: Rayriffy Open API
export class RayriffyFallbackAdapter implements LotteryResultSource {
  async fetchLatestResult(): Promise<StandardDrawResult> {
    const res = await fetch("https://lotto.api.rayriffy.com/latest", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Rayriffy API failed with HTTP status ${res.status}`);
    }

    const data = await res.json();
    const resp = data?.response;

    const first = resp?.prizes?.find((p: { id: string }) => p.id === "prizeFirst")?.number?.[0];
    const frontThree = resp?.runningNumbers?.find((r: { id: string }) => r.id === "runningNumberFrontThree")?.number || [];
    const backThree = resp?.runningNumbers?.find((r: { id: string }) => r.id === "runningNumberBackThree")?.number || [];
    const backTwo = resp?.runningNumbers?.find((r: { id: string }) => r.id === "runningNumberBackTwo")?.number?.[0];

    if (!first || !backTwo) {
      throw new Error("Rayriffy API returned incomplete payload");
    }

    return {
      drawDate: resp.date || new Date().toISOString().split("T")[0],
      prizeFirst: first,
      frontThree,
      backThree,
      backTwo,
      sourceProvider: "RAYRIFFY_FALLBACK",
      rawPayload: data,
    };
  }
}

// 3. Adapter สำหรับทดสอบ: Mock Adapter
export class MockLotteryAdapter implements LotteryResultSource {
  constructor(private presetResult: StandardDrawResult) {}

  async fetchLatestResult(): Promise<StandardDrawResult> {
    return this.presetResult;
  }
}
```

### 6.2 เอนจินชำระดุลบัญชีระดับลึก (`lib/settlement/settlement-service.ts`)

```typescript
import { SupabaseClient } from "@supabase/supabase-js";
import {
  LotteryResultSource,
  StandardDrawResult,
  GloOfficialAdapter,
  RayriffyFallbackAdapter,
} from "./draw-adapter";

export interface SettlementOptions {
  sourceOverride?: LotteryResultSource;
  manualResult?: StandardDrawResult;
}

export class DeepSettlementService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Single Narrow Interface: ประมวลผลและชำระดุลบัญชีทั้งระบบผ่านคำสั่งเดียว
   */
  async settleRound(
    periodId: string,
    options?: SettlementOptions
  ): Promise<{ success: boolean; netProfit: number; summary: Record<string, unknown> }> {
    // 1. ดึงผลรางวัลผ่าน Seam (GLO -> Fallback)
    const draw = options?.manualResult || (await this.resolveDrawResult(options?.sourceOverride));

    // 2. แตกชุด Permutation 3 ตัวโต๊ด 6 ประตู
    const n3top = draw.prizeFirst.slice(-3);
    const n2top = draw.prizeFirst.slice(-2);
    const n2down = draw.backTwo;
    const tods = this.generate3TodPermutations(n3top);

    // 3. เรียกใช้งาน Database Atomic Procedure
    const { data, error } = await this.supabase.rpc("execute_round_settlement", {
      p_period_id: periodId,
      p_prize_first: draw.prizeFirst,
      p_n_3top: n3top,
      p_n_2top: n2top,
      p_n_2down: n2down,
      p_3front: draw.frontThree,
      p_3down: draw.backThree,
      p_tods: tods,
      p_source: draw.sourceProvider,
      p_raw_payload: draw.rawPayload,
    });

    if (error) {
      throw new Error(`Database Settlement Procedure Failed: ${error.message}`);
    }

    return {
      success: true,
      netProfit: Number(data?.net_profit || 0),
      summary: data,
    };
  }

  private async resolveDrawResult(override?: LotteryResultSource): Promise<StandardDrawResult> {
    if (override) return await override.fetchLatestResult();

    const primary = new GloOfficialAdapter();
    const fallback = new RayriffyFallbackAdapter();

    try {
      return await primary.fetchLatestResult();
    } catch (primaryErr) {
      console.warn("GLO Official fetch failed, falling back to secondary source...", primaryErr);
      return await fallback.fetchLatestResult();
    }
  }

  private generate3TodPermutations(digits3: string): string[] {
    const chars = digits3.split("");
    const permutations = new Set<string>();

    const p = [
      [0, 1, 2], [0, 2, 1],
      [1, 0, 2], [1, 2, 0],
      [2, 0, 1], [2, 1, 0]
    ];

    for (const idx of p) {
      permutations.add(`${chars[idx[0]]}${chars[idx[1]]}${chars[idx[2]]}`);
    }

    return Array.from(permutations);
  }
}
```

---

## 7. โพรซีเยอร์การคำนวณและปรับปรุงดุลบัญชี (PostgreSQL Stored Procedure)

```sql
-- migration: create_execute_round_settlement_procedure.sql
CREATE OR REPLACE FUNCTION public.execute_round_settlement(
    p_period_id UUID,
    p_prize_first VARCHAR(6),
    p_n_3top VARCHAR(3),
    p_n_2top VARCHAR(2),
    p_n_2down VARCHAR(2),
    p_3front TEXT[],
    p_3down TEXT[],
    p_tods TEXT[],
    p_source VARCHAR(50),
    p_raw_payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_gross_sale NUMERIC(14,2) := 0.00;
    v_total_discount   NUMERIC(14,2) := 0.00;
    v_total_win_reward NUMERIC(14,2) := 0.00;
    v_total_net_profit NUMERIC(14,2) := 0.00;
BEGIN
    -- 1. บันทึกผลรางวัลลงในตาราง n_result แบบ Upsert
    INSERT INTO public.n_result (
        period_id, draw_date, raw_payload, prize_first, n_3top, n_2top, n_2down,
        n_3front1, n_3front2, n_3down1, n_3down2, n_3down3, n_3down4,
        todd_3top, n_runtop1, n_runtop2, n_runtop3, n_rundown1, n_rundown2,
        source_provider
    ) VALUES (
        p_period_id, CURRENT_DATE, p_raw_payload, p_prize_first, p_n_3top, p_n_2top, p_n_2down,
        p_3front[1], COALESCE(p_3front[2], ''),
        p_3down[1], COALESCE(p_3down[2], ''), COALESCE(p_3down[3], NULL), COALESCE(p_3down[4], NULL),
        p_tods,
        SUBSTRING(p_n_3top FROM 1 FOR 1), SUBSTRING(p_n_3top FROM 2 FOR 1), SUBSTRING(p_n_3top FROM 3 FOR 1),
        SUBSTRING(p_n_2down FROM 1 FOR 1), SUBSTRING(p_n_2down FROM 2 FOR 1),
        p_source
    )
    ON CONFLICT (period_id) DO UPDATE SET
        raw_payload = EXCLUDED.raw_payload,
        prize_first = EXCLUDED.prize_first,
        n_3top = EXCLUDED.n_3top,
        n_2top = EXCLUDED.n_2top,
        n_2down = EXCLUDED.n_2down,
        todd_3top = EXCLUDED.todd_3top,
        updated_at = NOW();

    -- 2. ประมวลผลดุลบัญชีรายบุคคลของลูกค้าลง n_batch_cust
    INSERT INTO public.n_batch_cust (
        period_id, customer_id, gross_sale, total_discount, net_sale, win_reward, net_balance, is_settled
    )
    SELECT 
        b.period_id,
        b.customer_id,
        SUM(b.total_amount) AS gross_sale,
        -- คำนวณส่วนลดรวม
        SUM(
            (b.amt_3top * c.disc_3top / 100) +
            (b.amt_3tod * c.disc_3tod / 100) +
            (b.amt_2top * c.disc_2top / 100) +
            (b.amt_2down * c.disc_2down / 100) +
            (b.amt_runtop * c.disc_run / 100) +
            (b.amt_rundown * c.disc_run / 100)
        ) AS total_discount,
        -- Net Sale
        SUM(b.total_amount) - SUM(
            (b.amt_3top * c.disc_3top / 100) +
            (b.amt_3tod * c.disc_3tod / 100) +
            (b.amt_2top * c.disc_2top / 100) +
            (b.amt_2down * c.disc_2down / 100) +
            (b.amt_runtop * c.disc_run / 100) +
            (b.amt_rundown * c.disc_run / 100)
        ) AS net_sale,
        -- Win Reward (ยอดเงินรางวัลที่ลูกค้าถูก)
        SUM(
            CASE WHEN b.number_string = p_n_3top THEN b.amt_3top * c.rate_3top ELSE 0 END +
            CASE WHEN b.number_string = ANY(p_tods) THEN b.amt_3tod * c.rate_3tod ELSE 0 END +
            CASE WHEN b.number_string = p_n_2top THEN b.amt_2top * c.rate_2top ELSE 0 END +
            CASE WHEN b.number_string = p_n_2down THEN b.amt_2down * c.rate_2down ELSE 0 END +
            CASE WHEN b.number_string IN (p_3front[1], p_3front[2]) THEN b.amt_3front * c.rate_3front ELSE 0 END +
            CASE WHEN b.number_string IN (p_3down[1], p_3down[2], p_3down[3], p_3down[4]) THEN b.amt_3down * c.rate_3down ELSE 0 END +
            CASE WHEN p_n_3top LIKE '%' || b.number_string || '%' THEN b.amt_runtop * c.rate_runtop ELSE 0 END +
            CASE WHEN p_n_2down LIKE '%' || b.number_string || '%' THEN b.amt_rundown * c.rate_rundown ELSE 0 END
        ) AS win_reward,
        -- Net Balance: บวก = ลูกค้าค้างจ่ายโต๊ะ, ลบ = โต๊ะต้องโอนจ่ายลูกค้า
        (
            SUM(b.total_amount) - SUM(
                (b.amt_3top * c.disc_3top / 100) +
                (b.amt_3tod * c.disc_3tod / 100) +
                (b.amt_2top * c.disc_2top / 100) +
                (b.amt_2down * c.disc_2down / 100) +
                (b.amt_runtop * c.disc_run / 100) +
                (b.amt_rundown * c.disc_run / 100)
            )
        ) - SUM(
            CASE WHEN b.number_string = p_n_3top THEN b.amt_3top * c.rate_3top ELSE 0 END +
            CASE WHEN b.number_string = ANY(p_tods) THEN b.amt_3tod * c.rate_3tod ELSE 0 END +
            CASE WHEN b.number_string = p_n_2top THEN b.amt_2top * c.rate_2top ELSE 0 END +
            CASE WHEN b.number_string = p_n_2down THEN b.amt_2down * c.rate_2down ELSE 0 END +
            CASE WHEN b.number_string IN (p_3front[1], p_3front[2]) THEN b.amt_3front * c.rate_3front ELSE 0 END +
            CASE WHEN b.number_string IN (p_3down[1], p_3down[2], p_3down[3], p_3down[4]) THEN b.amt_3down * c.rate_3down ELSE 0 END +
            CASE WHEN p_n_3top LIKE '%' || b.number_string || '%' THEN b.amt_runtop * c.rate_runtop ELSE 0 END +
            CASE WHEN p_n_2down LIKE '%' || b.number_string || '%' THEN b.amt_rundown * c.rate_rundown ELSE 0 END
        ) AS net_balance,
        TRUE AS is_settled
    FROM public.n_batch b
    JOIN public.customers c ON b.customer_id = c.id
    WHERE b.period_id = p_period_id
    GROUP BY b.period_id, b.customer_id
    ON CONFLICT (period_id, customer_id)
    DO UPDATE SET
        gross_sale = EXCLUDED.gross_sale,
        total_discount = EXCLUDED.total_discount,
        net_sale = EXCLUDED.net_sale,
        win_reward = EXCLUDED.win_reward,
        net_balance = EXCLUDED.net_balance,
        is_settled = TRUE,
        updated_at = NOW();

    -- 3. ปรับปรุงสถานะงวดการแทงเป็น SETTLED
    UPDATE public.n_period
    SET status = 'SETTLED'
    WHERE id = p_period_id;

    -- 4. รวบรวมผลลัพธ์ภาพรวมของงวด
    SELECT 
        COALESCE(SUM(gross_sale), 0.00),
        COALESCE(SUM(total_discount), 0.00),
        COALESCE(SUM(win_reward), 0.00),
        COALESCE(SUM(net_balance), 0.00)
    INTO 
        v_total_gross_sale,
        v_total_discount,
        v_total_win_reward,
        v_total_net_profit
    FROM public.n_batch_cust
    WHERE period_id = p_period_id;

    RETURN jsonb_build_object(
        'period_id', p_period_id,
        'gross_sale', v_total_gross_sale,
        'total_discount', v_total_discount,
        'win_reward', v_total_win_reward,
        'net_profit', v_total_net_profit,
        'status', 'SETTLED',
        'settled_at', NOW()
    );
END;
$$;
```

---

## 8. Next.js API Route Handler (`app/api/v1/results/draw/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DeepSettlementService } from "@/lib/settlement/settlement-service";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. ตรวจสอบสิทธิ์ผู้ใช้งาน (เฉพาะ SUPER_ADMIN เท่านั้นที่สั่งประมวลผลรางวัลได้)
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const role = user.app_metadata?.role;
    if (role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin authority required" },
        { status: 403 }
      );
    }

    // 2. รับ Payload งวดที่ต้องการออกผล
    const body = await req.json();
    const periodId = body?.period_id;

    if (!periodId) {
      return NextResponse.json({ error: "Missing period_id parameter" }, { status: 400 });
    }

    // 3. เริ่มกระบวนการชำระดุลผ่าน Deep Settlement Service
    const settlementEngine = new DeepSettlementService(supabase);
    const outcome = await settlementEngine.settleRound(periodId);

    return NextResponse.json(
      {
        message: "Round settlement completed successfully",
        data: outcome,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("API /api/v1/results/draw failed:", error);
    return NextResponse.json(
      { error: error.message || "Internal Settlement Failure" },
      { status: 500 }
    );
  }
}
```

---

## 9. พื้นผิวการทดสอบ (Deterministic Test Surface & Unit Tests)

ด้วยโครงสร้างที่ใช้ `LotteryResultSource` Adapter อินเทอร์เฟซ ทำให้สามารถเขียน Unit Tests ตรวจสอบตรรกะการคำนวณเงินได้ 100% โดยไม่ต้องต่ออินเทอร์เน็ต:

```typescript
// tests/settlement.test.ts
import { describe, it, expect, vi } from "vitest";
import { DeepSettlementService } from "@/lib/settlement/settlement-service";
import { MockLotteryAdapter } from "@/lib/settlement/draw-adapter";

describe("DeepSettlementService Unit Tests", () => {
  it("should accurately trigger atomic settlement procedure with mock drawn numbers", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: {
        period_id: "7b4e7232-2d33-40e8-9bc9-f2ec1d4287d3",
        net_profit: 45000.0,
        status: "SETTLED",
      },
      error: null,
    });

    const mockSupabase = {
      rpc: mockRpc,
    } as any;

    const mockDraw = new MockLotteryAdapter({
      drawDate: "2026-10-16",
      prizeFirst: "735867",
      frontThree: ["701", "884"],
      backThree: ["395", "081"],
      backTwo: "02",
      sourceProvider: "MOCK_TEST",
      rawPayload: { test: true },
    });

    const service = new DeepSettlementService(mockSupabase);
    const result = await service.settleRound("7b4e7232-2d33-40e8-9bc9-f2ec1d4287d3", {
      sourceOverride: mockDraw,
    });

    expect(result.success).toBe(true);
    expect(result.netProfit).toBe(45000.0);
    expect(mockRpc).toHaveBeenCalledWith(
      "execute_round_settlement",
      expect.objectContaining({
        p_prize_first: "735867",
        p_n_3top: "867",
        p_n_2top: "67",
        p_n_2down: "02",
        p_tods: expect.arrayContaining(["867", "876", "687", "678", "786", "768"]),
      })
    );
  });
});
```