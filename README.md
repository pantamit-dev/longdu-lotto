# LINE Group Chatbots

บอท LINE สำหรับแชทกลุ่ม เขียนด้วย Python แต่ละโฟลเดอร์เป็นบอทคนละตัว รับ webhook ผ่าน [Functions Framework](https://github.com/GoogleCloudPlatform/functions-framework-python) และตอบกลับด้วย [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/)

| โฟลเดอร์ | ทำอะไร |
| --- | --- |
| [`line-coffee-group`](line-coffee-group) | จดออเดอร์เครื่องดื่มในกลุ่ม แล้วส่งร้านเมื่อกดยืนยัน |
| [`line-groups-party-rsvp`](line-groups-party-rsvp) | รับ `+1` / `-1` ในกลุ่ม แล้วแสดงการ์ดผู้เข้าร่วม |
| [`line-group-features`](line-group-features) | ที่ว่างสำหรับฟีเจอร์กลุ่มชุดถัดไป |

## ร้านกาแฟ

ลูกค้าพิมพ์สั่งเครื่องดื่ม บอทจดรายการไว้ก่อน แล้วส่งปุ่มให้กดยืนยัน ออเดอร์ถูกส่งร้านเมื่อกดปุ่มเท่านั้น ใช้ Gemini ช่วยอ่านข้อความสั่ง และเก็บรายการใน SQLite

```bash
cd line-coffee-group
cp .env.example .env
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
functions-framework --target=callback --port=8080
```

ตั้งค่าใน `.env`

- `LINE_CHANNEL_SECRET` และ `LINE_CHANNEL_ACCESS_TOKEN` จาก LINE Developers Console
- Gemini ผ่าน Vertex AI (`GOOGLE_GENAI_USE_VERTEXAI`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`) หรือ `GEMINI_API_KEY`

รายละเอียดอยู่ใน [line-coffee-group/README.md](line-coffee-group/README.md)

## ชวนปาร์ตี้

ในกลุ่ม พิมพ์ `+1` เมื่อไป และ `-1` เมื่อไม่ไป บอทส่งการ์ดผู้เข้าร่วมทุกครั้งที่รายชื่อเปลี่ยน ถ้าแก้ข้อความเดิมจาก `+1` เป็น `-1` บอทรับ `messageEdited` แล้วขึ้นว่าเปลี่ยนใจ

```bash
cd line-groups-party-rsvp
cp .env.example .env
uv sync
uv run functions-framework --target=callback --port=8080
```

ตั้ง `LINE_CHANNEL_SECRET` และ `LINE_CHANNEL_ACCESS_TOKEN` ใน `.env` รายละเอียดอยู่ใน [line-groups-party-rsvp/README.md](line-groups-party-rsvp/README.md)

## Webhook

ใน LINE Developers Console เปิด Use webhook แล้วใส่ URL ของเซิร์ฟเวอร์ที่รันฟังก์ชัน `callback` เช่น `https://<host>/` ต้องใช้ HTTPS ที่ LINE เข้าถึงได้

อย่า commit ไฟล์ `.env` ค่าลับอยู่ใน `.env.example` เป็นตัวอย่างเท่านั้น
