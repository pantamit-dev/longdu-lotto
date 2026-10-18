# LINE Bot ชวนปาร์ตี้

ในกลุ่ม พิมพ์ `+1` เมื่อไป และ `-1` เมื่อไม่ไป บอทส่งการ์ดผู้เข้าร่วมทุกครั้งที่รายชื่อเปลี่ยน ถ้าแก้ข้อความเดิมจาก `+1` เป็น `-1` บอทรับ `messageEdited` แล้วขึ้นว่าเปลี่ยนใจและขอถอนตัว

```bash
cp .env.example .env
uv sync
uv run functions-framework --target=callback --port=8080
```

ตั้ง `LINE_CHANNEL_SECRET` และ `LINE_CHANNEL_ACCESS_TOKEN` ใน `.env` Webhook URL คือ `https://<host>/`
