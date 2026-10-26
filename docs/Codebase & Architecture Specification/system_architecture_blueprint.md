# 01. System Architecture Blueprint & Project Topology
**Project Name:** Modern Cloud-Native & LINE MINI App Lotto Suite  
**Target Platform:** Next.js 15+ (App Router), Supabase (PostgreSQL 16+), Tailwind CSS, LINE SDK/LIFF, LINE OA, Vercel  
**Legacy Reference:** The Best (Longdu Lotto Suite - Win32, .NET 4.0 WCF, Firebird 2.5, MariaDB 10)

---

## 1. Executive Summary & Legacy Transition

ระบบ **The Best (Longdu Lotto Suite)** เดิมถูกออกแบบบนสถาปัตยกรรม Windows Desktop Client-Server พึ่งพา `BESTServiceLib.dll` (WCF Contract) และเอนจินฐานข้อมูลคู่ (Firebird 2.5 สำหรับธุรกรรมท้องถิ่น และ MariaDB 10 สำหรับตารางตัดยอดขนาดใหญ่ 117 MB)

ในการพัฒนาระบบใหม่สู่ Cloud-Native เต็มรูปแบบบนแพลตฟอร์ม **Next.js + Supabase + Vercel + LINE Platform**:
- ยุบรวมการประมวลผลและการจัดเก็บข้อมูลสู่ **Supabase PostgreSQL 16+** จุดเดียว พร้อมเปิดใช้งาน **Declarative Partitioning** และ **Row Level Security (RLS)**
- ย้าย UI สู่ **Next.js App Router (React Server Components + Client Boundary)** รองรับ **Mobile-First LINE MINI App (WebView)**, iPad Touch Grid และ Desktop Keyboard-First Layout
- ปรับโครงสร้างโค้ดตามหลักสถาปัตยกรรมเชิงลึก (Deep Modules Architecture) เพื่อป้องกันปัญหา Serverless Round-Trip Latency และขจัดปัญหาข้อมูลไม่สอดคล้องกัน (Race Conditions) ในช่วงปิดรับแทง

---

## 2. High-Level Architecture Diagram

```
+---------------------------------------------------------------------------------------------------+
|                                     PRESENTATION CLIENTS                                          |
|  +--------------------------------+  +---------------------------+  +--------------------------+  |
|  | LINE MINI App (LIFF WebView)   |  | iPad / Tablet (Touch UI)  |  | Desktop (4-Col Ledger)   |  |
|  | - LINE Profile Auto Login      |  | - 2/4 Column Touch Grid   |  | - Keyboard-First Numpad  |  |
|  | - Single Thumb Numpad          |  | - Visual Action Shortcuts |  | - Web Audio Synthesizer  |  |
|  +--------------------------------+  +---------------------------+  +--------------------------+  |
+-------------------------------------------------+-------------------------------------------------+
                                                  | HTTPS / WSS
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                  COMPUTE & PROXY LAYER (Vercel)                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Next.js Middleware & Proxy: RBAC Token Check, Session Cookie Refresh, Line Deauth Catch     |  |
|  +---------------------------------------------------------------------------------------------+  |
|  | Server Actions & Route Handlers (/api/v1/*):                                                |  |
|  | - [Deep Ingestion Module]: Ingest, Parse, Validate Limits, Atomic Permutation Insert       |  |
|  | - [Deep Settlement Module]: Dual GLO Draw Adapter, 22-Cat Matcher, Balance Reconciliation    |  |
|  | - [High-Leverage Risk Engine]: In-Memory/Aggregate High-Low Volume, Cutoff Vendor Export     |  |
|  | - [@vercel/og Image Generator]: Real-time Dynamic Ticket & Statement Image Streaming        |  |
|  +---------------------------------------------------------------------------------------------+  |
+----------------------------------+------------------------------+---------------------------------+
                                   |                              |
                                   v                              v
+----------------------------------------------------+  +-------------------------------------------+
|          DATABASE & STORAGE (Supabase)             |  |        EXTERNAL INTEGRATIONS              |
|  - PostgreSQL 16+ (Partitioned n_batch, n_cut)     |  |  - LINE Messaging / Service Message API   |
|  - Row Level Security (4-Tier RBAC via JWT Claims) |  |  - GLO Official API (getLatestLottery)    |
|  - Supabase Auth (LINE OpenID Token Bridge)        |  |  - Thai Lottery API (Fallback Adapter)    |
|  - Supabase Storage (Receipts, Profile Avatars)    |  +-------------------------------------------+
+----------------------------------------------------+
```

---

## 3. Deep Modules Boundaries & Responsibilities

เพื่อเพิ่ม **พลังทวี (Leverage)** และรวมศูนย์ **ตำแหน่งความรับผิดชอบ (Locality)** สถาปัตยกรรมถูกออกแบบให้มีโมดูลระดับลึก (Deep Modules) 4 แกนหลัก:

### 3.1. Deep Ingestion Module (`lib/ingestion/`)
- **แคบทางอินเทอร์เฟซ (Narrow Interface):** รับ DTO บิลเดียว `submitTicket(ticketPayload)`
- **ลึกทางพฤติกรรม (Deep Behavior):** ซ่อนตรรกะการแยกไวยากรณ์ 22 หมวดหมู่, อัลกอริทึมกลับเลข 2–5 ประตู, การตรวจสอบเพดานเลขอั้น (`n_batch_limit`), และการบันทึกลง `n_batch` พร้อมบวกยอดสะสมลง `n_batch_cut` ภายใน Atomic Database Transaction เดียว

### 3.2. Deep Settlement Module (`lib/settlement/`)
- **แคบทางอินเทอร์เฟซ:** `settleRound(periodId, options?)`
- **ลึกทางพฤติกรรม:** ทำงานผ่าน Adapter Seam (GLO Official API, Rayriffy Fallback, Mock Result Engine สำหรับ Unit Test), ทำ Batch Evaluation ตรวจสอบ 22 หมวดหมู่, คำนวณเงินรางวัลสุทธิ, หักส่วนลด 2 ขั้น (`CUST_*_`, `CUST_*__`), และคำนวณดุลส่งเจ้ามือใหญ่

### 3.3. Deep Identity & RBAC Module (`lib/identity/`)
- **แคบทางอินเทอร์เฟซ:** `resolveIdentity(context)`
- **ลึกทางพฤติกรรม:** ยืนยันตัวตนจาก LINE LIFF Access Token / ID Token, ผูกเข้ากับ Supabase `auth.users`, ฝัง Custom JWT Claims (`role`, `branch_id`, `company_id`) เพื่อให้ Database Engine ตรวจสอบผ่าน RLS ได้ทันทีโดยไม่ต้องยิงคิวรี Join ข้ามตาราง

### 3.4. High-Leverage Risk & Cutoff Engine (`lib/risk/`)
- **แคบทางอินเทอร์เฟซ:** `getRiskMatrix(periodId, category)`, `exportCutoff(periodId, vendorId)`
- **ลึกทางพฤติกรรม:** วิเคราะห์สถิติยอดซื้อสูง-ต่ำ (High/Low Volume) ด้วย PostgreSQL Window Functions, ดึงยอดถือสู้เทียบเพดาน และสร้างบิลตัดยอดส่ง (`n_batch_vend`) ให้อัตโนมัติ

---

## 4. โครงสร้างไดเรกทอรีมาตรฐาน (Project Directory Structure)

```
├── .env.example
├── .env.local
├── middleware.ts                   # RBAC Router & LINE Session Gateway
├── next.config.ts
├── tailwind.config.ts
├── package.json
├── docs/                           # รายละเอียดเอกสารทางเทคนิค 5 ฉบับ
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # LIFF Client Login & Quick-fill Callback
│   │   └── deauth/route.ts         # LINE Mini App Deauthorization Webhook
│   ├── (dashboard)/
│   │   ├── layout.tsx              # App Shell (Responsive Breakpoints + Roles)
│   │   ├── page.tsx                # Overview & Financial Profit Dashboard
│   │   ├── entry/page.tsx          # Data Entry Ledger (Mobile/Tablet/Desktop)
│   │   ├── risk-cutoff/page.tsx    # High/Low Statistics & Vendor Cutoff
│   │   ├── statements/page.tsx     # Filter by Customer / Specific Numbers
│   │   └── results/page.tsx        # Draw Management & Realtime Evaluation
│   └── api/
│       ├── v1/
│       │   ├── batches/
│       │   │   └── entry/route.ts  # Ticket Ingestion Endpoint
│       │   ├── cutoff/
│       │   │   ├── matrix/route.ts
│       │   │   └── export/route.ts
│       │   ├── results/
│       │   │   └── draw/route.ts   # Real-time Draw Trigger & Settlement
│       │   └── line/
│       │       └── notify/route.ts # Service Message Dispatcher
│       └── og/
│           └── ticket/route.ts     # @vercel/og Receipt Dynamic Image
├── lib/
│   ├── identity/                   # Deep Identity Module
│   │   ├── liff.ts
│   │   └── rbac.ts
│   ├── ingestion/                  # Deep Ingestion Module
│   │   ├── parser.ts
│   │   ├── permutation.ts
│   │   └── ingestion-service.ts
│   ├── settlement/                 # Deep Settlement Module
│   │   ├── glo-adapter.ts
│   │   ├── rayriffy-adapter.ts
│   │   ├── result-matcher.ts
│   │   └── settlement-service.ts
│   ├── risk/                       # High-Leverage Risk Engine
│   │   └── cutoff-service.ts
│   ├── audio/                      # Web Audio API Synthesizer
│   │   └── sound-synthesizer.ts
│   └── supabase/
│       ├── client.ts               # Browser Client
│       ├── server.ts               # Server Component & Server Action Client
│       └── proxy.ts                # Middleware Context Client
└── supabase/
    ├── migrations/                 # PostgreSQL DDL, Indexes & RLS Scripts
    │   ├── 20261026000001_core_schema.sql
    │   ├── 20261026000002_partitioned_ledgers.sql
    │   └── 20261026000003_rbac_rls_policies.sql
    └── seed.sql                    # Initial 22 Categories & System Configurations
```

---

## 5. การตั้งค่าสภาพแวดล้อม (Environment Configuration)

ไฟล์ `.env.local` ต้องกำหนดค่าตัวแปรกำกับความปลอดภัยและกุญแจเชื่อมต่อดังนี้:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# LINE MINI App & Channel Credentials
NEXT_PUBLIC_LIFF_ID=2000000000-xxxxxxx
LINE_CHANNEL_ID=2000000000
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LINE_SERVICE_MESSAGE_TEMPLATE_ID=lotto_ticket_confirm_th

# External Lottery APIs
GLO_API_URL=https://www.glo.or.th/api/lottery/getLatestLottery
RAYRIFFY_API_URL=https://lotto.api.rayriffy.com/latest

# App Base URL
NEXT_PUBLIC_SITE_URL=https://lotto.example.com
```

---

## 6. แนวทางปฏิบัติสำหรับ AI Agent ในการพัฒนา (Agent Operating Rules)
1. **ห้ามละเมิดขอบเขตรอยต่อ (Seam Encapsulation):** ห้ามนำสูตรคำนวณเงินรางวัลหรือคอมมิชชั่นไปวางกระจัดกระจายในฝั่ง Client Component โดยเด็ดขาด ทั้งหมดต้องเรียกผ่าน `lib/settlement` หรือ Database Stored Procedure
2. **ขจัด Race Condition ด้วย Atomic Transaction:** ทุกการบันทึกรายการโพยและการอัปเดตยอดถือสู้/ตัดส่ง ต้องทำงานภายใต้ธุรกรรมเดียว (`rpc('submit_ticket_atomic')`) เสมอ
3. **การเข้าถึงฐานข้อมูลต้องผ่าน RLS:** แม้จะเป็น Route Handlers ห้ามใช้ `service_role` พร่ำเพรื่อ เว้นแต่เป็นงาน System Cron หรือ Hook ของระบบแจ้งเตือนภายนอก