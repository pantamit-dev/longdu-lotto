# 02. Database Schema, Partitioning & 4-Tier RBAC Specification
**Engine:** PostgreSQL 16+ (Supabase)  
**Security Model:** Row Level Security (RLS) + JWT Claims Auth  
**Performance Strategy:** Declarative Partitioning, Atomic Upsert, Composite Indexes

---

## 1. ฐานข้อมูลและตารางหลัก (24 Entities Migration)

ยกระดับโครงสร้างเดิมจาก Firebird 2.5 (`NUMBER.FDB`) และ MariaDB 10 (`data/number`) สู่ PostgreSQL ดังนี้:

### 1.1. ประเภทข้อมูลและตารางโครงสร้างองค์กร (Enums & Organizations)

```sql
-- 1. ประเภทบทบาทผู้ใช้งาน 4 ขั้น
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',   -- เจ้ามือหลัก / เจ้าของระบบ
    'SUPERVISOR',    -- ผู้จัดการสาขา / หัวหน้าสาย
    'OPERATOR',      -- พนักงานคีย์ / ตัวแทนเดินโพย
    'MEMBER'         -- ลูกค้าผู้ซื้อรายย่อย (LINE Member)
);

-- 2. วงจรชีวิตของงวดการแทง 7 สถานะ
CREATE TYPE period_status AS ENUM (
    'DRAFT',         -- สร้างงวดล่วงหน้า
    'OPEN',          -- เปิดรับแทง / บันทึกโพย
    'CUTOFF',        -- ถึงเวลาตัดยอดถือสู้
    'CLOSED',        -- ปิดรับแทงสิ้นเชิง
    'RESULT_DRAWN',  -- ผลรางวัลประกาศแล้ว
    'SETTLED',       -- คำนวณเงินได้-เสียสุทธิสำเร็จ
    'ARCHIVED'       -- ปิดงวดและสำรองข้อมูล
);

-- 3. ตารางบริษัทและสาขา (company & branch)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    comp_code VARCHAR(32) UNIQUE NOT NULL,
    comp_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_code VARCHAR(32) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, branch_code)
);

-- 4. ตารางข้อมูลโปรไฟล์และผูก LINE Identity
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id INT REFERENCES companies(id),
    branch_id INT REFERENCES branches(id),
    line_user_id VARCHAR(64) UNIQUE,
    user_code VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'MEMBER',
    telephone VARCHAR(32),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.2. ตารางงวด กฎเกณฑ์ และหมวดหมู่ตัวเลข (Rules & Settings)

```sql
-- 5. ตารางงวดการแทง (n_period)
CREATE TABLE n_period (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id INT NOT NULL REFERENCES companies(id),
    period_date DATE NOT NULL,
    status period_status NOT NULL DEFAULT 'DRAFT',
    cutoff_time TIMESTAMPTZ NOT NULL,
    close_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, period_date)
);

-- 6. ตารางหมวดหมู่ตัวเลข 22 หมวด (n_type)
CREATE TABLE n_type (
    id INT PRIMARY KEY,
    type_code VARCHAR(32) UNIQUE NOT NULL,
    type_name_th VARCHAR(64) NOT NULL,
    digits INT NOT NULL,
    description TEXT
);

-- 7. ตารางลูกค้า และกำหนดอัตราจ่าย/ส่วนลด (customer)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id INT NOT NULL REFERENCES branches(id),
    profile_id UUID REFERENCES profiles(id),
    cust_code VARCHAR(32) NOT NULL,
    cust_name VARCHAR(255) NOT NULL,
    telephone VARCHAR(32),
    -- Payout Rates
    rate_3top NUMERIC(10,2) DEFAULT 900.00,
    rate_3tod NUMERIC(10,2) DEFAULT 150.00,
    rate_3down NUMERIC(10,2) DEFAULT 450.00,
    rate_3front NUMERIC(10,2) DEFAULT 450.00,
    rate_2top NUMERIC(10,2) DEFAULT 95.00,
    rate_2down NUMERIC(10,2) DEFAULT 95.00,
    rate_2tod NUMERIC(10,2) DEFAULT 15.00,
    rate_runtop NUMERIC(10,2) DEFAULT 3.20,
    rate_rundown NUMERIC(10,2) DEFAULT 4.20,
    -- Discount Rates Level 1 (%)
    disc_3top NUMERIC(5,2) DEFAULT 30.00,
    disc_3tod NUMERIC(5,2) DEFAULT 30.00,
    disc_2top NUMERIC(5,2) DEFAULT 25.00,
    disc_2down NUMERIC(5,2) DEFAULT 25.00,
    disc_run NUMERIC(5,2) DEFAULT 12.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(branch_id, cust_code)
);

-- 8. ตารางเจ้ามือใหญ่ภายนอก (vendors)
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id INT NOT NULL REFERENCES companies(id),
    vendor_code VARCHAR(32) NOT NULL,
    vendor_name VARCHAR(255) NOT NULL,
    contact_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, vendor_code)
);

-- 9. ตารางเลขอั้นและเพดานรับเสี่ยง (n_batch_limit)
CREATE TABLE n_batch_limit (
    id SERIAL PRIMARY KEY,
    period_id UUID NOT NULL REFERENCES n_period(id) ON DELETE CASCADE,
    number_pattern VARCHAR(10) NOT NULL,
    type_id INT NOT NULL REFERENCES n_type(id),
    max_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00, -- 0 = งดรับเด็ดขาด
    is_half_payout BOOLEAN DEFAULT FALSE,           -- จ่ายครึ่งราคา
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3. สมุดรายการโพยหลัก และตารางตัดยอด (Ledger & Accumulator)

```sql
-- 10. ตารางโพยหลักแบบ Declarative Partitioning ตาม period_id (n_batch)
CREATE TABLE n_batch (
    id BIGSERIAL,
    period_id UUID NOT NULL REFERENCES n_period(id),
    branch_id INT NOT NULL REFERENCES branches(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    page_number INT NOT NULL DEFAULT 1,
    line_index INT NOT NULL,
    number_string VARCHAR(10) NOT NULL,
    -- คอลัมน์ยอดเงินแยกตามหมวดหมู่หลัก
    amt_3top NUMERIC(10,2) DEFAULT 0.00,
    amt_3tod NUMERIC(10,2) DEFAULT 0.00,
    amt_3down NUMERIC(10,2) DEFAULT 0.00,
    amt_3front NUMERIC(10,2) DEFAULT 0.00,
    amt_2top NUMERIC(10,2) DEFAULT 0.00,
    amt_2down NUMERIC(10,2) DEFAULT 0.00,
    amt_2tod NUMERIC(10,2) DEFAULT 0.00,
    amt_runtop NUMERIC(10,2) DEFAULT 0.00,
    amt_rundown NUMERIC(10,2) DEFAULT 0.00,
    amt_other NUMERIC(10,2) DEFAULT 0.00,
    total_amount NUMERIC(12,2) GENERATED ALWAYS AS (
        amt_3top + amt_3tod + amt_3down + amt_3front + 
        amt_2top + amt_2down + amt_2tod + amt_runtop + amt_rundown + amt_other
    ) STORED,
    is_send_vendor BOOLEAN DEFAULT FALSE,
    vendor_id UUID REFERENCES vendors(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (period_id, id)
) PARTITION BY LIST (period_id);

-- 11. ตารางควบคุมเลขหน้าโพย (n_pages)
CREATE TABLE n_pages (
    id SERIAL PRIMARY KEY,
    period_id UUID NOT NULL REFERENCES n_period(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    page_number INT NOT NULL,
    total_page_amount NUMERIC(12,2) DEFAULT 0.00,
    item_count INT DEFAULT 0,
    is_closed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(period_id, customer_id, page_number)
);

-- 12. ตารางตัดยอดสะสมความเร็วสูง (n_batch_cut)
CREATE TABLE n_batch_cut (
    id BIGSERIAL PRIMARY KEY,
    period_id UUID NOT NULL REFERENCES n_period(id) ON DELETE CASCADE,
    branch_id INT NOT NULL REFERENCES branches(id),
    type_id INT NOT NULL REFERENCES n_type(id),
    number_key VARCHAR(10) NOT NULL,
    total_sale NUMERIC(14,2) DEFAULT 0.00,  -- ยอดรับรวม
    total_keep NUMERIC(14,2) DEFAULT 0.00,  -- ยอดถือสู้
    total_send NUMERIC(14,2) DEFAULT 0.00,  -- ยอดตัดส่งเจ้ามือใหญ่
    total_wait NUMERIC(14,2) DEFAULT 0.00,  -- ยอดรอตัดสินใจ
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(period_id, branch_id, type_id, number_key)
);
```

### 1.4. ตารางบันทึกผลรางวัล และตารางดุลการเงิน (Settlement & Statements)

```sql
-- 13. ตารางผลการออกสลากกินแบ่งรัฐบาล (n_result)
CREATE TABLE n_result (
    id SERIAL PRIMARY KEY,
    period_id UUID UNIQUE NOT NULL REFERENCES n_period(id) ON DELETE CASCADE,
    draw_date DATE NOT NULL,
    first_prize VARCHAR(6) NOT NULL,
    num_3top VARCHAR(3) NOT NULL,
    num_2top VARCHAR(2) NOT NULL,
    num_2down VARCHAR(2) NOT NULL,
    num_3front1 VARCHAR(3) NOT NULL,
    num_3front2 VARCHAR(3) NOT NULL,
    num_3down1 VARCHAR(3) NOT NULL,
    num_3down2 VARCHAR(3) NOT NULL,
    num_3down3 VARCHAR(3) NOT NULL,
    num_3down4 VARCHAR(3) NOT NULL,
    -- Permutation 3 ตัวโต๊ด 6 ประตู
    todd_3top VARCHAR(3)[] NOT NULL,
    raw_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ตารางสรุปดุลบัญชีรายบุคคลของลูกค้าประจำงวด (n_batch_cust)
CREATE TABLE n_batch_cust (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES n_period(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    gross_sale NUMERIC(14,2) DEFAULT 0.00,
    total_discount NUMERIC(14,2) DEFAULT 0.00,
    net_sale NUMERIC(14,2) DEFAULT 0.00,
    win_reward NUMERIC(14,2) DEFAULT 0.00,
    net_balance NUMERIC(14,2) DEFAULT 0.00, -- บวก = ลูกค้าค้างจ่าย, ลบ = โต๊ะต้องจ่ายลูกค้า
    is_settled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(period_id, customer_id)
);

-- 15. ตารางสรุปการตัดส่งเจ้ามือใหญ่ (n_batch_vend)
CREATE TABLE n_batch_vend (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES n_period(id),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    gross_send NUMERIC(14,2) DEFAULT 0.00,
    total_comm NUMERIC(14,2) DEFAULT 0.00,
    net_send NUMERIC(14,2) DEFAULT 0.00,
    win_refund NUMERIC(14,2) DEFAULT 0.00,
    net_vendor_balance NUMERIC(14,2) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(period_id, vendor_id)
);
```

---

## 2. ดัชนีและการเพิ่มประสิทธิภาพ (Indexing & Performance Tuning)

```sql
-- ดัชนีค้นหาประวัติการซื้อเฉพาะหมายเลขอย่างรวดเร็ว
CREATE INDEX idx_nbatch_query ON n_batch (period_id, number_string, branch_id);
CREATE INDEX idx_nbatch_customer ON n_batch (period_id, customer_id, page_number);

-- ดัชนีจัดอันดับยอดซื้อสูง-ต่ำ บนตารางตัดยอด
CREATE INDEX idx_ncut_ranking ON n_batch_cut (period_id, type_id, total_sale DESC);

-- GIN Index สำหรับค้นหาผลรางวัลและ Log JSON
CREATE INDEX idx_nresult_todd ON n_result USING GIN (todd_3top);
CREATE INDEX idx_nresult_raw ON n_result USING GIN (raw_payload);
```

---

## 3. สิทธิ์การเข้าถึงข้อมูลระดับแถว (4-Tier Row Level Security - RLS)

เปิดใช้งาน RLS ทุกตาราง และเขียนเงื่อนไขตรวจสิทธิ์โดยอ้างอิงจาก JWT Claims `auth.jwt() ->> 'role'` และ `branch_id`:

```sql
ALTER TABLE n_batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE n_batch_cut ENABLE ROW LEVEL SECURITY;
ALTER TABLE n_batch_cust ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- นโยบายสำหรับตารางโพยหลัก (n_batch)
CREATE POLICY n_batch_policy ON n_batch
FOR ALL
USING (
    -- Tier 1: Super Admin เห็นทั้งหมด
    (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
    OR
    -- Tier 2: Supervisor เห็นเฉพาะสาขาของตนเอง
    (auth.jwt() ->> 'role' = 'SUPERVISOR' AND branch_id = (auth.jwt() ->> 'branch_id')::INT)
    OR
    -- Tier 3: Operator เห็นเฉพาะรายการที่ตนเองรับผิดชอบในสาขา
    (auth.jwt() ->> 'role' = 'OPERATOR' AND branch_id = (auth.jwt() ->> 'branch_id')::INT)
    OR
    -- Tier 4: Member เห็นเฉพาะโพยที่เป็นรหัสลูกค้าของตนเอง
    (auth.jwt() ->> 'role' = 'MEMBER' AND customer_id IN (
        SELECT id FROM customers WHERE profile_id = auth.uid()
    ))
);

-- นโยบายสำหรับตารางสรุปยอดลูกค้ารายบุคคล (n_batch_cust)
CREATE POLICY n_batch_cust_policy ON n_batch_cust
FOR ALL
USING (
    (auth.jwt() ->> 'role' = 'SUPER_ADMIN')
    OR
    (auth.jwt() ->> 'role' IN ('SUPERVISOR', 'OPERATOR') AND customer_id IN (
        SELECT id FROM customers WHERE branch_id = (auth.jwt() ->> 'branch_id')::INT
    ))
    OR
    (auth.jwt() ->> 'role' = 'MEMBER' AND customer_id IN (
        SELECT id FROM customers WHERE profile_id = auth.uid()
    ))
);
```

---

## 4. Trigger ซิงก์ผู้ใช้ LINE กับระบบ Authentication

```sql
-- Function จัดการสร้าง Profile อัตโนมัติเมื่อ User Authenticate เข้ามาครั้งแรก
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        line_user_id,
        user_code,
        full_name,
        role,
        avatar_url
    ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'line_user_id',
        COALESCE(NEW.raw_user_meta_data->>'user_code', 'U_' || SUBSTRING(NEW.id::TEXT, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'LINE Member'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'MEMBER'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```