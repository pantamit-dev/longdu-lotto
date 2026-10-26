# AGENT TASK EXECUTION PROMPT: MODERN CLOUD-NATIVE LOTTO SUITE
**Target:** Autonomous AI Coding Agent / Senior Full-Stack Implementation Agent  
**Framework & Stack:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase PostgreSQL, Web Audio API, @tanstack/react-virtual  
**File Output:** `agent-task-prompt.md`

---

## 1. System Identity & Mission

You are an **Autonomous Senior Software Architect & Full-Stack Implementation Engineer**. Your mission is to implement, refactor, and harden the **Modern Cloud-Native Lotto Suite** (derived from the legacy Win32 / .NET 4.0 WCF / Firebird / MariaDB "The Best / Longdu Lotto Suite"). 

The architecture pivots from an end-buyer (B2C) model to an **Agent-Centric (B2B2C)** paradigm, establishing the **Admin (คนกลาง / ผู้ดูแล)** as the core system operator who bridges end-customers with the bookmaker (**Hearder / เจ้ามือ**).

You are strictly responsible for:
1. Reviewing existing domain assets and specifications.
2. Formulating systematic ticket plans and test checklists before touching code.
3. Writing type-safe, modular, production-ready code.
4. Enforcing strict automated verification gates (100% pass) per ticket before advancing.
5. Reporting progress clearly and concisely.

---

## 2. Core Business Logic & Strategic Pivot

### 2.1 The Agent-Centric Model (Admin as Primary User)
```
[ลูกค้ารายย่อย (Buyer)] 
       │  (ส่งรายการแทง / โพยกระดาษ / ข้อความ)
       ▼
[คนกลาง (Admin / ผู้ใช้งานหลัก)]  <── บันทึกชื่อโพย / จัดการเครดิตงวดที่แล้ว-งวดนี้
       │  (ส่งต่อยอดแทงสุทธิหลังหักส่วนแบ่งคอมมิชชั่น)
       ▼
[เจ้ามือ (Hearder)]  <── มอนิเตอร์ภาพรวม, ฟิลเตอร์ราย Admin, ตรวจสอบยอดรายตัวเลข
```

- **Ticket Naming (`ticket_name`):** Admin can assign an arbitrary tag/name to each ticket batch (e.g., *"ป้าสมศรี หน้าร้าน"*, *"วินมอเตอร์ไซค์ปากซอย"*) to isolate and manage billing per customer.
- **Rolling Credit Settlement ("ซื้อรอบนี้ จ่ายรอบถัดไป"):**
  - **ยอดค้างงวดที่แล้ว (Previous Round Balance):** หนี้ค้างชำระยกยอดมาจากงวดก่อน
  - **ยอดแทงสุทธิงวดนี้ (Current Net Bet):**
    $$\text{Current Net Bet} = \text{Gross Bet (ยอดแทงรวมดิบ)} - \text{Commission (ส่วนแบ่ง \% ของ Admin)}$$
    ยอดนี้จะเป็นยอดที่ Admin มีภาระต้องนำส่งจริงในงวดถัดไป
  - **ดุลเงินรางวัลและการเคลียร์ยอดงวดปัจจุบัน (Immediate Win Balancing):**
    หากลูกค้ารายย่อยถูกรางวัล เจ้ามือ (Hearder) จะต้องเคลียร์ยอดในงวดปัจจุบันทันที:
    $$\text{Hearder Settlement Balance} = \text{Total Win (ยอดถูกสุทธิ)} - \text{Current Net Bet (ยอดแทงสุทธิงวดนี้)}$$
    - **ผลลัพธ์เป็นบวก ($> 0$):** ยอดถูกรางวัลสูงกว่ายอดแทง เจ้ามือ (Hearder) โอนส่วนต่างให้ Admin ทันที เพื่อให้ Admin นำไปจ่ายต่อให้ลูกค้ารายย่อย
    - **ผลลัพธ์เป็นลบ ($< 0$):** ยอดแทงสูงกว่ายอดถูกรางวัล ผลต่างนี้จะถูกยกยอดไปเป็นยอดรอชำระในรอบถัดไป

---

### 2.2 Betting Classification & Verification Rules

#### หมวดหมู่ตัวเลข (Bet Types)
1. **รูปแบบ 2 ตัว (00–99):**
   - **2 ตัวบน:** ตรงกับ 2 หลักท้ายของรางวัลที่ 1
   - **2 ตัวล่าง:** ตรงกับรางวัลเลขท้าย 2 ตัว
   - **2 ตัวโต๊ด:** ตรวจเทียบกับผล 3 ตัวบน (ดูรายละเอียดด้านล่าง)
   - **กลับอัตโนมัติ (2 กลับ):** สลับหลักสิบและหน่วย ($\{0\}\{1\}$ และ $\{1\}\{0\}$) ยกเว้นเลขเบิ้ล (เช่น `11` จะนับเป็น 1 รายการ)
2. **รูปแบบ 3 ตัว (000–999):**
   - **3 ตัวบน:** ตรงกับ 3 หลักท้ายของรางวัลที่ 1
   - **3 ตัวล่าง:** ตรงกับเลขท้าย 3 ตัว
   - **3 ตัวโต๊ด:** สลับตำแหน่งได้ทุกหลักของ 3 ตัวบน
   - **กลับอัตโนมัติ:**
     - **3 กลับ:** สำหรับเลขหาม/เลขเบิ้ล เช่น `112` แตกได้ `112`, `121`, `211`
     - **6 กลับ:** สำหรับเลขต่าง เช่น `123` แตกได้ 6 ประตู
3. **รูปแบบเลขวิ่ง (0–9):**
   - **วิ่งบน:** มีตัวเลขนั้นปรากฏใน 3 ตัวบนอย่างน้อย 1 หลัก
   - **วิ่งล่าง:** มีตัวเลขนั้นปรากฏใน 2 ตัวล่างอย่างน้อย 1 หลัก

#### กฎการตรวจ 2 ตัวโต๊ด (Two-Digit Tod Engine)
- ตรวจเทียบกับผลลัพธ์ **3 ตัวบน** (3 หลักท้ายของรางวัลที่ 1)
- ตัวเลขทั้ง 2 หลักที่ซื้อ จะต้องปรากฏอยู่ในเลข 3 ตัวบนครบทั้งสองตัว โดยอยู่ตำแหน่งใดก็ได้
  - *ตัวอย่าง:* ซื้อ `13` (2 ตัวโต๊ด)
    - 3 ตัวบนออก `211` $\rightarrow$ **ไม่ถูกรางวัล** (มี 1 แต่ขาด 3)
    - 3 ตัวบนออก `123` $\rightarrow$ **ถูกรางวัล** (มีทั้ง 1 และ 3)
    - 3 ตัวบนออก `319` หรือ `311` $\rightarrow$ **ถูกรางวัล** (มีทั้ง 1 และ 3)
  - *กรณีเลขเบิ้ล:* ซื้อ `11` (2 ตัวโต๊ด) จะถูกรางวัลก็ต่อเมื่อในผล 3 ตัวบนมีเลข `1` อย่างน้อย 2 ตัว (เช่น `121` หรือ `111`)

```typescript
export function check2TodWin(betNumber: string, top3Result: string): boolean {
  if (betNumber.length !== 2 || top3Result.length !== 3) return false;
  const digitA = betNumber[0];
  const digitB = betNumber[1];
  
  if (digitA === digitB) {
    const occurrences = top3Result.split('').filter(d => d === digitA).length;
    return occurrences >= 2;
  }
  return top3Result.includes(digitA) && top3Result.includes(digitB);
}
```

---

## 3. Four-Tier RBAC Architecture

| Role | นิยามและขอบเขตสิทธิ์ | สิทธิ์การเข้าถึงข้อมูล (Data Scope) | หน้าจอหลัก (Primary View) |
| :--- | :--- | :--- | :--- |
| **Owner** | ผู้พัฒนาระบบ | ดูแลระบบ, โครงสร้างฐานข้อมูล, จัดการ Tenant และ System Logs | System Administration & Audit Portal |
| **Hearder** | เจ้าของ / เจ้ามือ | ดู Overview ยอดแทงรวมทั้งระบบ, **ฟิลเตอร์รายชื่อ Admin**, **ส่องดูยอดเงินแยกตามตัวเลข**, กำหนดเพดานอั้น และเคลียร์บัญชีการเงิน | Hearder Risk Overview & Inspection Dashboard |
| **Admin** | คนกลาง (ผู้ใช้งานหลัก) | คีย์โพยส่งเจ้ามือ, ระบุชื่อโพย/ลูกค้า, ดูบัญชีการเงินตนเอง (ยอดงวดที่แล้ว, งวดนี้, คอมมิชชั่น, ยอดถูกรางวัล), จัดการผู้ช่วย (Stuff) | High-Speed Touch Numpad & Cart Ledger |
| **Stuff** | ผู้ช่วย Admin | คีย์ตัวเลขความเร็วสูง ข้อมูลทุกบิลจะถูกผูก Tag `admin_id` โดยอัตโนมัติ **(ซ่อนข้อมูลการเงิน ดุลกำไร และอัตราคอมมิชชั่น)** | Simplified Numpad Entry Screen (No Financials) |

---

## 4. UI/UX Specifications

### 4.1 Admin Touch Numpad & Auto-Commit Flow
- **Ticket Name Header:** ช่องระบุชื่อโพย/ชื่อลูกค้า (Auto-focused / Dropdown เลือกลูกค้าเดิม หรือพิมพ์ชื่อใหม่)
- **Preset Mode Toggles:** แถบเลือกประเภทแทง (`[2 ตัว]`, `[3 ตัว]`, `[เลขวิ่ง]`, `[19 ประตู/รูด]`) และตัวเลือกย่อย เช่น `[✓ 2 ตัวบน]`, `[✓ 2 ตัวล่าง]`, `[✓ 2 ตัวโต๊ด]`, `[✨ กลับเลขอัตโนมัติ]`
- **Quick Price Selector:** ช่องราคาต่อตัว พร้อมปุ่มลัด `+10`, `+20`, `+50`, `+100`
- **Auto-Commit Trigger:** 
  - ระบบตรวจสอบความยาวตัวเลขที่ป้อนเข้าสล็อต:
    - โหมดวิ่ง: ป้อนครบ **1 หลัก** $\rightarrow$ บันทึกลงตะกร้าทันที
    - โหมด 2 ตัว: ป้อนครบ **2 หลัก** $\rightarrow$ บันทึกลงตะกร้าทันที
    - โหมด 3 ตัว: ป้อนครบ **3 หลัก** $\rightarrow$ บันทึกลงตะกร้าทันที
  - หากเปิด `✨ กลับเลขอัตโนมัติ` ให้กระจายชุด Permutation (2 กลับ, 3 กลับ หรือ 6 กลับ) ลงตะกร้าพร้อมกัน
  - แสดง Visual Flash สีเขียว (150ms) + เล่นเสียงขาน Web Audio API (`0.wav`-`9.wav` และเสียงโหมด `up/low/tod.wav`)
  - เคลียร์ช่องสล็อตเพื่อรับตัวเลขชุดถัดไปทันทีโดยไม่ต้องกดปุ่มยืนยันซ้ำ

### 4.2 Modal Panel Preview (`modal_panel_preview`)
หน้าต่างแสดงรายการในตะกร้าแบบ 4 คอลัมน์มาตรฐาน:
$$\text{Columns: } [\text{ตัวเลข}] \quad [\text{บน}] \quad [\text{ล่าง}] \quad [\text{โต๊ด}]$$

- **Row Aggregation Rule:** หากป้อนตัวเลขเดียวกันหลายหมวด (เช่น `123` บน 100 และ `123` โต๊ด 50) ต้องรวมเป็น 1 แถวในตาราง
- **Column Mapping:**
  - **1 หลัก (0–9):** `[บน]` = วิ่งบน, `[ล่าง]` = วิ่งล่าง, `[โต๊ด]` = `-`
  - **2 หลัก (00–99):** `[บน]` = 2 ตัวบน, `[ล่าง]` = 2 ตัวล่าง, `[โต๊ด]` = 2 ตัวโต๊ด
  - **3 หลัก (000–999):** `[บน]` = 3 ตัวบน, `[ล่าง]` = 3 ตัวล่าง, `[โต๊ด]` = 3 ตัวโต๊ด
- **Summary Footer Widget:**
  - ยอดแทงดิบรวม (Gross Bet)
  - ส่วนลดคอมมิชชั่น Admin (Commission Rate & THB)
  - ยอดสุทธิต้องส่งเจ้ามือ (Net Bet to Hearder)

### 4.3 Hearder Overview Dashboard
- **Global Counters (Tabular Nums):** ยอดแทงรวมแยกประเภท: 2 ตัวบน, 2 ตัวล่าง, 2 ตัวโต๊ด, 3 ตัวบน, 3 ตัวล่าง, 3 ตัวโต๊ด, วิ่งบน, วิ่งล่าง
- **Filter by Admin:** เมนูดร็อปดาวน์คัดกรองข้อมูลรายคนกลาง แสดงยอดแทงดิบ, ส่วนแบ่งคอมมิชชั่น, และยอดสุทธิของ Admin คนนั้น
- **Number Volume Inspector (ส่องยอดรายตัวเลข):** ช่องค้นหาตัวเลข (เช่น `789` หรือ `45`) เพื่อดูยอดแทงรวมของเลขนั้น และแจกแจงว่ามาจาก Admin หรือโพยใบใดบ้าง

---

## 5. Structured Ticket Backlog

```
TICKET-001 (PostgreSQL & RBAC) ──> TICKET-002 (Engine & 2-Tod Logic)
                                               │
                      ┌────────────────────────┴────────────────────────┐
                      ▼                                                 ▼
         TICKET-003 (Touch Numpad UI)                      TICKET-005 (Hearder Dashboard)
                      │
                      ▼
         TICKET-004 (4-Column Cart Modal)
```

---

### `TICKET-001`: PostgreSQL Schema Migration & 4-Tier RBAC Policies
- **File Target:** `supabase/migrations/20261026_agent_centric_schema.sql`
- **Scope:**
  1. Define user role ENUM: `'OWNER'`, `'HEARDER'`, `'ADMIN'`, `'STUFF'`.
  2. Alter `profiles` table: add `admin_id UUID REFERENCES profiles(id)`.
  3. Alter `n_batch` / `tickets` table:
     - Add `ticket_name VARCHAR(100) NOT NULL DEFAULT 'ทั่วไป'`
     - Add `admin_id UUID NOT NULL REFERENCES profiles(id)`
     - Add `created_by UUID NOT NULL REFERENCES profiles(id)`
     - Add `commission_rate NUMERIC(5,2) DEFAULT 0.00`
  4. Create `admin_round_balances` table:
     - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
     - `period_id UUID NOT NULL`
     - `admin_id UUID NOT NULL REFERENCES profiles(id)`
     - `previous_balance NUMERIC(12,2) DEFAULT 0.00`
     - `current_gross_bet NUMERIC(12,2) DEFAULT 0.00`
     - `current_commission NUMERIC(12,2) DEFAULT 0.00`
     - `current_net_bet NUMERIC(12,2) DEFAULT 0.00`
     - `current_win_reward NUMERIC(12,2) DEFAULT 0.00`
     - `settlement_status VARCHAR(20) DEFAULT 'PENDING'`
  5. Configure RLS Policies:
     - Stuff can INSERT batches tagged with their Admin's `admin_id`, but cannot SELECT `admin_round_balances`.
     - Admin can only access tickets and balances where `admin_id = auth.uid()`.
     - Hearder has full SELECT access and can filter by any `admin_id`.
- **Verification Gate:**
  - Run `supabase db lint` or apply migration locally without errors.
  - Verify RLS security via SQL query assertion: Stuff querying `admin_round_balances` returns 0 rows.

---

### `TICKET-002`: Betting Permutation Engine & 2-Digit Tod Verification Module
- **File Targets:**
  - `lib/lottery/engine.ts`
  - `lib/lottery/settlement.ts`
  - `__tests__/lottery-engine.test.ts`
- **Scope:**
  1. Implement permutation functions:
     - `generate2Permutations(num: string): string[]` (handles doubles e.g. `11` $\rightarrow$ `['11']`, `12` $\rightarrow$ `['12', '21']`).
     - `generate3Permutations(num: string): string[]` (handles 3-swaps e.g. `112` $\rightarrow$ 3 permutations, 6-swaps e.g. `123` $\rightarrow$ 6 permutations).
  2. Implement `check2TodWin(betNumber: string, top3Result: string): boolean`.
  3. Implement rolling settlement calculation:
     $$\text{Current Net Bet} = \text{Gross Bet} \times (1 - \text{Commission Rate})$$
     $$\text{Settlement Balance} = \text{Win Reward} - \text{Current Net Bet}$$
- **Verification Gate:**
  - 100% test coverage for `check2TodWin`:
    - `check2TodWin('13', '211')` === `false`
    - `check2TodWin('13', '123')` === `true`
    - `check2TodWin('13', '319')` === `true`
    - `check2TodWin('11', '121')` === `true`
    - `check2TodWin('11', '123')` === `false`
  - Permutation count assertions for all standard and double numbers.

---

### `TICKET-003`: Admin Touch Numpad with Auto-Commit Engine
- **File Targets:**
  - `components/numpad/TouchNumpadEntry.tsx`
  - `components/numpad/DigitSlotDisplay.tsx`
  - `hooks/useLotteryCart.ts`
- **Scope:**
  1. Build Touch Numpad interface matching mobile-friendly layout:
     - Top selector: `ticket_name` field.
     - Mode selection tabs: `[2 ตัว]`, `[3 ตัว]`, `[เลขวิ่ง]`.
     - Bet type toggle buttons: `2 ตัวบน`, `2 ตัวล่าง`, `2 ตัวโต๊ด`, `✨ กลับเลขอัตโนมัติ`.
     - Price chips: Quick increments `+10`, `+20`, `+50`, `+100`.
     - Keypad: 0-9, Clear (ล้าง), Backspace (⌫).
  2. Implement Auto-Commit logic:
     - Detect digit completion (1 digit for Run, 2 for 2-digit, 3 for 3-digit).
     - Automatically dispatch bet items to Cart State (expanding permutations if auto-swap is ON).
     - Trigger Web Audio API (`0.wav`-`9.wav`, mode chime).
     - Clear input slots immediately with a brief green feedback flash.
  3. Floating bottom bar showing item count, total THB, and `[ 👁️ ดูรายการโพย ]` button.
- **Verification Gate:**
  - Component unit test: Entering `4`, `5` in 2-digit mode commits to cart and resets slots to empty without clicking submit.
  - Component accessibility: ARIA labels on buttons, touch target size $\ge 48\text{px} \times 48\text{px}$.

---

### `TICKET-004`: 4-Column Cart Modal Preview (`modal_panel_preview`)
- **File Targets:**
  - `components/numpad/CartPreviewModal.tsx`
  - `types/lottery.ts`
- **Scope:**
  1. Create modal preview component displaying staged bets.
  2. Render 4 columns: `[ตัวเลข]`, `[บน]`, `[ล่าง]`, `[โต๊ด]`.
  3. Implement row aggregation logic (merging bets on the same number into a unified row).
  4. Display rolling financial breakdown:
     - Gross Bet Total
     - Admin Commission Amount (THB)
     - Net Payable to Hearder (THB)
  5. Action buttons: `[ + คีย์เพิ่มต่อ ]`, `[ 🗑️ ล้างตะกร้า ]`, and `[ 🚀 ยืนยันส่งโพยให้เจ้ามือ ]`.
- **Verification Gate:**
  - Submitting cart invokes the database transaction, tags records with `ticket_name` and `admin_id`, and flushes local cart state on success.
  - Snapshot test for 4-column layout rendering.

---

### `TICKET-005`: Hearder Dashboard, Admin Filter & Number Exposure Inspector
- **File Targets:**
  - `app/hearder/dashboard/page.tsx`
  - `components/hearder/OverviewMetricsGrid.tsx`
  - `components/hearder/NumberInspectionModal.tsx`
  - `app/api/v1/hearder/analytics/route.ts`
- **Scope:**
  1. Build Hearder Overview Dashboard:
     - Metrics grid displaying volume for: 2-Top, 2-Bottom, 2-Tod, 3-Top, 3-Bottom, 3-Tod, Run-Top, Run-Bottom.
  2. Implement Multi-Dimension Admin Filter:
     - Dropdown to select specific Admin.
     - Dynamically recalculates volume, commission, and net bet for the selected Admin.
  3. Implement Number Volume Inspector:
     - Search input for any specific number (e.g., `789`).
     - Display total aggregated volume and list of contributing tickets/Admins.
- **Verification Gate:**
  - Integration test: Selecting `Admin A` updates dashboard cards to reflect only `Admin A`'s bets.
  - Searching a number accurately returns aggregated sum across all categories.

---

## 6. Execution Rules & Verification Protocol

For each ticket in the backlog, the AI Agent must follow this deterministic flow:

```
[1. Explore Baseline] ──> [2. Formulate Ticket Plan & Test Specs]
                                        │
                                        ▼
[4. Verify Gate (100% Pass)] <── [3. Execute Minimal Code Changes]
          │
          ├── (Fail) ──> [Diagnose Root Cause & Fix] ──> Loop back to Step 4
          │
          └── (Pass) ──> [5. Commit / Generate Progress Report] ──> Next Ticket
```

1. **No Spec Deviation:** Never alter business calculations, financial formulas, or RBAC role permissions without explicit direction.
2. **Tabular Numbers Standard:** Apply `tabular-nums` / `font-mono` on all financial figures and ticket numbers to avoid layout shift.
3. **Audio Safety:** Wrap Web Audio API calls in user-gesture-safe try/catch blocks to avoid browser autoplay restrictions.
4. **All-or-Nothing Transactions:** Ticket batch submissions must execute within atomic PostgreSQL transactions (`BEGIN ... COMMIT`) to ensure data integrity.

---

## 7. Final Deliverables & Sign-Off

Upon completing all tickets, produce a final verification summary containing:
- Confirmation of Admin-Centric architecture adoption.
- Checklist of all completed tickets (`TICKET-001` through `TICKET-005`).
- List of modified and created files.
- Automated test run output showing 100% pass rate.
- Manual test procedure for testing the Touch Numpad, Auto-Commit, and Cart Preview Modal.