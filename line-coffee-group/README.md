# LINE Bot ร้านกาแฟ

ลูกค้าพิมพ์สั่งเครื่องดื่ม บอทจดรายการไว้ก่อน แล้วส่งปุ่มให้กดยืนยัน ออเดอร์ถูกส่งร้านเมื่อกดปุ่มเท่านั้น

```
ลูกค้า:  ลาเต้ 2 แก้ว หวานน้อย
บอท:    จดไว้แล้ว ลาเต้ x2 (หวานน้อย) รวม 130 บาท กดปุ่มยืนยันส่งออเดอร์ได้เลย
        [ปุ่ม ยืนยันส่งออเดอร์]
```

ไฟล์มี 3 ไฟล์

- `shop.py` เมนูและออเดอร์ใน SQLite
- `adk_agent.py` tools + Gemini agent + ฟังก์ชัน `reply`
- `main.py` รับ webhook ของ LINE และปุ่ม postback

## รัน

```bash
cp .env.example .env
uv sync
uv run functions-framework --target=callback --port=8080
```

ตั้ง `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_ACCESS_TOKEN` และ Gemini (`GOOGLE_GENAI_USE_VERTEXAI` หรือ `GEMINI_API_KEY`) ใน `.env`

Webhook URL คือ URL ของฟังก์ชัน เช่น `https://<host>/`
