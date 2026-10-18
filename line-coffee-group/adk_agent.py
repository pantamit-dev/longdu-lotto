"""ผู้ช่วยร้านกาแฟ: tools บาง ๆ + agent + ฟังก์ชันตอบกลับ."""

import asyncio
from contextvars import ContextVar

from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai.types import Content, Part

import coffee_shop as shop

APP_NAME = "coffee_shop"
MODEL = "gemini-3.6-flash"
NO_REPLY = "NO_REPLY"

_customer: ContextVar[str] = ContextVar("customer", default="")
_chat: ContextVar[str] = ContextVar("chat", default="playground")


def list_menu() -> dict:
    """รายการเครื่องดื่มและราคา."""
    return shop.list_menu()


def add_item(item: str, qty: int = 1, note: str = "") -> dict:
    """จดเครื่องดื่มที่ลูกค้าสั่ง ยังไม่ส่งร้าน. note เช่น หวานน้อย ไม่ใส่นม."""
    return shop.add_item(_chat.get(), _customer.get(), item, qty, note)


def show_order() -> dict:
    """ออเดอร์ที่จดไว้และยังไม่กดยืนยัน."""
    return shop.open_order(_chat.get())


def update_item(order_id: int, item: str = "", qty: int = -1) -> dict:
    """แก้รายการที่จดไว้แล้วยังไม่ยืนยัน. ใช้ id จาก show_order.
    item คือชื่อเมนูใหม่ ว่างไว้ถ้าไม่เปลี่ยนชื่อ.
    qty คือจำนวนแก้วใหม่ทั้งก้อน เช่น แก้เป็น 2 ให้ใส่ 2. ใส่ -1 ถ้าไม่เปลี่ยนจำนวน.
    """
    return shop.update_item(
        _chat.get(),
        order_id,
        item=item or None,
        qty=None if qty < 0 else qty,
    )


def remove_item(order_id: int) -> dict:
    """เอารายการที่ยังไม่ยืนยันออก ด้วย id จาก show_order."""
    return shop.remove_item(_chat.get(), order_id)


root_agent = Agent(
    model=MODEL,
    name="coffee_shop_agent",
    description="ผู้ช่วยรับออเดอร์ร้านกาแฟใน LINE",
    instruction=f"""\
คุณเป็นบาริสต้าร้านกาแฟ ตอบภาษาไทย สั้น เป็นกันเอง
เมนู: {shop.menu_text()}

ลูกค้าสั่งเครื่องดื่ม ให้เรียก add_item ทีละรายการ เพื่อจดไว้ก่อน
จำนวนไม่บอก = 1 แก้ว หวาน นม หรือหมายเหตุอื่นใส่ใน note
ถ้าในข้อความเดียวกันสั่งแล้วแก้จำนวนหรือแก้ชื่อ ให้จดค่าสุดท้ายครั้งเดียว
เช่น "อเมริกาโน่ 1 แก้เป็น 2" ให้ add_item อเมริกาโน่ qty 2
เช่น "อเมริกาโน่ แก้ชื่อเป็นลาเต้" ให้ add_item ลาเต้
ชื่อเมนูต้องอยู่ในรายการด้านบน ถ้าไม่ชัดให้ถาม ยังไม่จด
หลังจดแล้ว สรุปว่าจดอะไรไว้บ้างและยอดรวม แล้วบอกให้กดปุ่ม "ยืนยันส่งออเดอร์"
ห้ามบอกว่าส่งออเดอร์ให้ร้านแล้ว การส่งเกิดเมื่อลูกค้ากดปุ่มเท่านั้น
ถ้าลูกค้าพิมพ์ว่ายืนยัน ให้บอกให้กดปุ่มยืนยันส่งออเดอร์
ขอดูออเดอร์ให้เรียก show_order
ขอเอาออกให้เรียก show_order หา id แล้วเรียก remove_item
ลูกค้าแก้รายการที่จดไว้แล้ว ให้เรียก show_order แล้วเรียก update_item
แก้จำนวน เช่น "แก้เป็น 2" ให้ใส่ qty เป็นจำนวนใหม่ทั้งก้อน ห้ามเรียก add_item เพราะจะบวกเพิ่ม
แก้ชื่อเมนู เช่น "แก้ชื่อเป็นลาเต้" หรือ "เปลี่ยนเป็นลาเต้" ให้ใส่ item เป็นชื่อใหม่
มีรายการเดียวให้แก้รายการนั้น หลายรายการและไม่บอกว่าแก้ข้อไหน ให้ถามก่อน
ถามเมนูให้เรียก list_menu
ห้ามใช้ markdown
ถ้าข้อความไม่เกี่ยวกับร้านกาแฟ ให้ตอบคำว่า {NO_REPLY} เท่านั้น
""",
    tools=[list_menu, add_item, show_order, update_item, remove_item],
)
session_service = InMemorySessionService()
runner = Runner(
    app_name=APP_NAME,
    session_service=session_service,
    agent=root_agent,
)


async def _reply(user_message: str, user_id: str, customer_name: str) -> str:
    _customer.set(customer_name)
    _chat.set(user_id)
    ids = {"app_name": APP_NAME, "user_id": user_id, "session_id": user_id}
    session = await session_service.get_session(**ids) or await session_service.create_session(**ids)
    message = Content(role="user", parts=[Part(text=f"จาก {customer_name}: {user_message}")])
    async for event in runner.run_async(
        user_id=user_id, session_id=session.id, new_message=message
    ):
        if not event.is_final_response() or not event.content or not event.content.parts:
            continue
        for part in event.content.parts:
            if part.text:
                return part.text
    return "ลองพิมพ์ใหม่อีกครั้งค่ะ"


def reply(user_message: str, user_id: str, customer_name: str) -> str:
    return asyncio.run(_reply(user_message, user_id, customer_name))
