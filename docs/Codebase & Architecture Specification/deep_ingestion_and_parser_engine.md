# 03. Deep Ingestion Module, Syntax Parser & Permutation Engine
**Interface Boundary:** `lib/ingestion/ingestion-service.ts`  
**Core Logic:** TypeScript Ports of `validateData`, `listNumber2-5`, and Atomic Bulk Insert  
**Legacy Reference:** `BESTServiceLib.dll` (.NET 4.0 WCF)

---

## 1. การจัดหมวดหมู่ตัวเลข 22 หมวด (Classification Matrix)

ระบบ The Best จัดหมวดหมู่ตัวเลขตามจำนวนหลัก เครื่องหมายกำกับ และ `entrymode` ดังนี้:

| รหัสประเภท (`n_type`) | ชื่อหมวดหมู่ | ความยาวหลัก | รูปแบบข้อความนำเข้า (`text1`) | นิพจน์ราคา (`text2`) | คำอธิบาย |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `1` (`BT_3TOP`) | 3 ตัวบน | 3 | `123` | `100` หรือ `100*50` | สามตัวท้ายตรงกับรางวัลที่ 1 |
| `2` (`BT_3TOD`) | 3 ตัวโต๊ด | 3 | `123` | `*50` หรือตำแหน่งที่ 2 ใน `100*50` | สลับหลัก 3 ตัวบน |
| `3` (`BT_3DOWN`) | 3 ตัวล่าง | 3 | `123/` หรือ `/123` | `50` | หมุน 3 ตัวล่าง 4 ครั้ง |
| `4` (`BT_3FRONT`) | 3 ตัวหน้าตรง | 3 | `123-` หรือ `-123` | `50` | หมุน 3 ตัวหน้า 2 ครั้ง |
| `5` (`BT_2TOP`) | 2 ตัวบน | 2 | `23` | `100` หรือ `100*100` | สองตัวท้ายรางวัลที่ 1 |
| `6` (`BT_2TOD`) | 2 ตัวโต๊ด | 2 | `23` (Mode 3) | `50` | สลับหลัก 2 ตัวบน |
| `7` (`BT_2DOWN`) | 2 ตัวล่าง | 2 | `45` | ตำแหน่งที่ 2 ใน `100*50` หรือมี `/` | เลขท้าย 2 ตัวสลากกินแบ่ง |
| `8` (`BT_RUNTOP`) | วิ่งบน | 1 | `5` | `100` หรือ `100*` | ปรากฏใน 3 ตัวบน 1 ตำแหน่ง |
| `9` (`BT_RUNDOWN`) | วิ่งล่าง | 1 | `5` | `*100` หรือตำแหน่งที่ 2 | ปรากฏใน 2 ตัวล่าง 1 ตำแหน่ง |
| `10` (`BT_4TOD`) | 4 ตัวโต๊ด | 4 | `1234` | `20` | สลับตำแหน่ง 4 ตัวตรง |
| `11` (`BT_5TOD`) | 5 ตัวโต๊ด | 5 | `12345` | `20` | สลับตำแหน่ง 5 ตัวตรง |
| `12` (`TOPFLAG100`) | ปักหลักร้อย | 1 | `H1` หรือ `1..` | `50` | ระบุเจาะจงหลักร้อย |
| `13` (`TOPFLAG10`) | ปักหลักสิบ | 1 | `T2` หรือ `.2.` | `50` | ระบุเจาะจงหลักสิบ |
| `14` (`TOPFLAG1`) | ปักหลักหน่วย | 1 | `U3` หรือ `..3` | `50` | ระบุเจาะจงหลักหน่วย |
| `15` (`DOWNFLAG10`) | ปักล่างสิบ | 1 | `DT4` | `50` | ระบุหลักสิบล่าง |
| `16` (`DOWNFLAG1`) | ปักล่างหน่วย | 1 | `DU5` | `50` | ระบุหลักหน่วยล่าง |

---

## 2. อัลกอริทึมวิเคราะห์ไวยากรณ์ (Syntax Parser Implementation)

พอร์ตตรรกะจาก `validateData` ใน `BESTServiceLib.dll`:

```typescript
// lib/ingestion/parser.ts

export interface ParsedItem {
  rawNumber: string;
  cleanNumber: string;
  category: string;
  typeId: number;
  amount: number;
}

export interface ParseResult {
  isValid: boolean;
  items: ParsedItem[];
  errorMessage?: string;
}

export function parseEntrySyntax(
  text1: string,
  text2: string,
  entryMode: number = 0
): ParseResult {
  const cleanT1 = text1.trim();
  const cleanT2 = text2.trim();

  if (!cleanT1 || !cleanT2) {
    return { isValid: false, items: [], errorMessage: "กรุณาระบุตัวเลขและราคา" };
  }

  // แยกราคากรณีมีตัวคั่น * หรือ / เช่น "100*50", "20/20"
  const priceParts = cleanT2.split(/[*\/]/).map((p) => parseFloat(p) || 0);
  const p1 = priceParts[0] || 0;
  const p2 = priceParts[1] || 0;
  const p3 = priceParts[2] || 0;

  const items: ParsedItem[] = [];

  // 1. หมวดตัวเลข 1 หลัก (เลขวิ่ง / ปักหลัก)
  if (/^\d{1}$/.test(cleanT1)) {
    if (p1 > 0) {
      items.push({ rawNumber: cleanT1, cleanNumber: cleanT1, category: "RUNTOP", typeId: 8, amount: p1 });
    }
    if (p2 > 0) {
      items.push({ rawNumber: cleanT1, cleanNumber: cleanT1, category: "RUNDOWN", typeId: 9, amount: p2 });
    }
  }

  // 2. หมวดตัวเลข 2 หลัก
  else if (/^\d{2}$/.test(cleanT1)) {
    if (entryMode === 3) {
      // โหมด 2 ตัวโต๊ด
      items.push({ rawNumber: cleanT1, cleanNumber: cleanT1, category: "2TOD", typeId: 6, amount: p1 });
    } else {
      if (p1 > 0) {
        items.push({ rawNumber: cleanT1, cleanNumber: cleanT1, category: "2TOP", typeId: 5, amount: p1 });
      }
      if (p2 > 0) {
        items.push({ rawNumber: cleanT1, cleanNumber: cleanT1, category: "2DOWN", typeId: 7, amount: p2 });
      }
    }
  }

  // 3. หมวดตัวเลข 3 หลัก
  else if (/^\d{3}$/.test(cleanT1)) {
    if (p1 > 0) {
      items.push({ rawNumber: cleanT1, cleanNumber: cleanT1, category: "3TOP", typeId: 1, amount: p1 });
    }
    if (p2 > 0) {
      items.push({ rawNumber: cleanT1, cleanNumber: cleanT1, category: "3TOD", typeId: 2, amount: p2 });
    }
    if (p3 > 0) {
      items.push({ rawNumber: cleanT1, cleanNumber: cleanT1, category: "3DOWN", typeId: 3, amount: p3 });
    }
  }

  // 4. หมวด 3 ตัวหน้าตรง (มีเครื่องหมายลบนำหน้าหรือตามหลัง เช่น "123-", "-123")
  else if (/^(\d{3}-|-\d{3})$/.test(cleanT1)) {
    const num = cleanT1.replace("-", "");
    items.push({ rawNumber: cleanT1, cleanNumber: num, category: "3FRONT", typeId: 4, amount: p1 });
  }

  // 5. หมวด 3 ตัวล่าง (มีเครื่องหมายทับ เช่น "/123", "123/")
  else if (/^(\/\d{3}|\d{3}\/)$/.test(cleanT1)) {
    const num = cleanT1.replace("/", "");
    items.push({ rawNumber: cleanT1, cleanNumber: num, category: "3DOWN", typeId: 3, amount: p1 });
  }

  // 6. หมวด 4 ตัว และ 5 ตัวโต๊ด
  else if (/^\d{4}$/.test(cleanT1)) {
    items.push({ rawNumber: cleanT1, cleanNumber: cleanT1, category: "4TOD", typeId: 10, amount: p1 });
  } else if (/^\d{5}$/.test(cleanT1)) {
    items.push({ rawNumber: cleanT1, cleanNumber: cleanT1, category: "5TOD", typeId: 11, amount: p1 });
  } else {
    return { isValid: false, items: [], errorMessage: `รูปแบบตัวเลขไม่ถูกต้อง: ${cleanT1}` };
  }

  return { isValid: true, items };
}
```

---

## 3. อัลกอริทึมการกลับตัวเลข (Permutation Algorithms)

พอร์ตฟังก์ชัน `listNumber2` ถึง `listNumber5` กรองเลขเบิ้ลและเลขหามซ้ำซ้อนอัตโนมัติ:

```typescript
// lib/ingestion/permutation.ts

export function permuteNumber(input: string): string[] {
  const chars = input.split("");
  const len = chars.length;
  const resultSet = new Set<string>();

  // 1. กรณีเลข 2 หลัก (สูงสุด 2 ประตู เช่น "12" -> ["12", "21"], "11" -> ["11"])
  if (len === 2) {
    resultSet.add(`${chars[0]}${chars[1]}`);
    resultSet.add(`${chars[1]}${chars[0]}`);
  }
  // 2. กรณีเลข 3 หลัก (3 หรือ 6 ประตู เช่น "123" -> 6 ประตู, "112" -> 3 ประตู)
  else if (len === 3) {
    const p = [
      [0, 1, 2], [0, 2, 1],
      [1, 0, 2], [1, 2, 0],
      [2, 0, 1], [2, 1, 0]
    ];
    for (const idx of p) {
      resultSet.add(`${chars[idx[0]]}${chars[idx[1]]}${chars[idx[2]]}`);
    }
  }
  // 3. กรณีเลข 4-5 หลัก (Recursive Heap's Algorithm)
  else if (len >= 4 && len <= 5) {
    const heapPermute = (n: number, arr: string[]) => {
      if (n === 1) {
        resultSet.add(arr.join(""));
        return;
      }
      for (let i = 0; i < n; i++) {
        heapPermute(n - 1, arr);
        const swapIdx = n % 2 === 0 ? i : 0;
        const tmp = arr[swapIdx];
        arr[swapIdx] = arr[n - 1];
        arr[n - 1] = tmp;
      }
    };
    heapPermute(len, [...chars]);
  } else {
    resultSet.add(input);
  }

  return Array.from(resultSet);
}
```

---

## 4. รอยต่อประมวลผลและการบันทึกแบบอะตอมิก (Deep Ingestion Service)

กระบวนการตรวจสอบเลขอั้นและบันทึกโพยลงตาราง `n_batch` และสะสมยอดลง `n_batch_cut` ผ่าน Single Stored Procedure:

```sql
-- supabase/migrations/20261026000004_ingestion_rpc.sql

CREATE OR REPLACE FUNCTION public.submit_ticket_atomic(
    p_period_id UUID,
    p_branch_id INT,
    p_customer_id UUID,
    p_page_number INT,
    p_items JSONB, -- อาร์เรย์ของ [{line_idx, number, type_id, amount}]
    p_created_by UUID
)
RETURNS JSONB AS $$
DECLARE
    v_item JSONB;
    v_limit RECORD;
    v_total_page NUMERIC(12,2) := 0.00;
BEGIN
    -- 1. ตรวจสอบสถานะงวดการแทง
    IF NOT EXISTS (
        SELECT 1 FROM n_period 
        WHERE id = p_period_id AND status = 'OPEN' AND now() < close_time
    ) THEN
        RAISE EXCEPTION 'งวดนี้ปิดรับแทงแล้ว ไม่สามารถส่งโพยได้';
    END IF;

    -- 2. วนลูปตรวจสอบเลขอั้น (n_batch_limit)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        SELECT * INTO v_limit FROM n_batch_limit
        WHERE period_id = p_period_id 
          AND type_id = (v_item->>'type_id')::INT
          AND number_pattern = (v_item->>'number');

        IF FOUND AND v_limit.max_amount = 0 THEN
            RAISE EXCEPTION 'เลข % ปิดรับแทงเด็ดขาด (เลขอั้น)', (v_item->>'number');
        END IF;
    END LOOP;

    -- 3. ทำ Bulk Insert ลง n_batch
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        INSERT INTO n_batch (
            period_id, branch_id, customer_id, page_number, 
            line_index, number_string,
            amt_3top, amt_3tod, amt_3down, amt_3front,
            amt_2top, amt_2down, amt_2tod,
            amt_runtop, amt_rundown, created_by
        ) VALUES (
            p_period_id, p_branch_id, p_customer_id, p_page_number,
            (v_item->>'line_idx')::INT,
            v_item->>'number',
            CASE WHEN (v_item->>'type_id')::INT = 1 THEN (v_item->>'amount')::NUMERIC ELSE 0 END,
            CASE WHEN (v_item->>'type_id')::INT = 2 THEN (v_item->>'amount')::NUMERIC ELSE 0 END,
            CASE WHEN (v_item->>'type_id')::INT = 3 THEN (v_item->>'amount')::NUMERIC ELSE 0 END,
            CASE WHEN (v_item->>'type_id')::INT = 4 THEN (v_item->>'amount')::NUMERIC ELSE 0 END,
            CASE WHEN (v_item->>'type_id')::INT = 5 THEN (v_item->>'amount')::NUMERIC ELSE 0 END,
            CASE WHEN (v_item->>'type_id')::INT = 7 THEN (v_item->>'amount')::NUMERIC ELSE 0 END,
            CASE WHEN (v_item->>'type_id')::INT = 6 THEN (v_item->>'amount')::NUMERIC ELSE 0 END,
            CASE WHEN (v_item->>'type_id')::INT = 8 THEN (v_item->>'amount')::NUMERIC ELSE 0 END,
            CASE WHEN (v_item->>'type_id')::INT = 9 THEN (v_item->>'amount')::NUMERIC ELSE 0 END,
            p_created_by
        );

        -- 4. สะสมยอดลงตารางตัดยอด (n_batch_cut) แบบ Upsert
        INSERT INTO n_batch_cut (
            period_id, branch_id, type_id, number_key, total_sale, total_keep
        ) VALUES (
            p_period_id, p_branch_id, (v_item->>'type_id')::INT, v_item->>'number',
            (v_item->>'amount')::NUMERIC, (v_item->>'amount')::NUMERIC
        )
        ON CONFLICT (period_id, branch_id, type_id, number_key)
        DO UPDATE SET
            total_sale = n_batch_cut.total_sale + EXCLUDED.total_sale,
            total_keep = n_batch_cut.total_keep + EXCLUDED.total_keep,
            updated_at = NOW();

        v_total_page := v_total_page + (v_item->>'amount')::NUMERIC;
    END LOOP;

    -- 5. อัปเดตข้อมูลหัวหน้าโพย (n_pages)
    INSERT INTO n_pages (period_id, customer_id, page_number, total_page_amount, item_count)
    VALUES (p_period_id, p_customer_id, p_page_number, v_total_page, jsonb_array_length(p_items))
    ON CONFLICT (period_id, customer_id, page_number)
    DO UPDATE SET
        total_page_amount = n_pages.total_page_amount + EXCLUDED.total_page_amount,
        item_count = n_pages.item_count + EXCLUDED.item_count,
        updated_at = NOW();

    RETURN jsonb_build_object('success', true, 'total_page_amount', v_total_page);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```