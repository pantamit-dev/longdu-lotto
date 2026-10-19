"""Jev decides what a LINE message means. The shop code then acts on that intent."""

import os

from dotenv import load_dotenv
from typesafe_sdk import Choice, TypeSafeClient

import coffee_shop as shop

load_dotenv()

CONFIDENCE_THRESHOLD = 0.55

INTENT_CRITERIA = {
    "order": "สั่งเครื่องดื่ม หรือบอกชื่อกาแฟ จำนวน ความหวาน เช่น สั่งกาแฟ, อเมริกาโน่, ลาเต้ 2 แก้วหวานน้อย",
    "summary": "ขอดูออเดอร์ที่จดไว้ เช่น สรุปออเดอร์, สรุป, ดูออเดอร์",
    "view_menu": "อยากดูเมนูกาแฟของร้าน BEAT COFFEE หรือถามว่ามีกาแฟอะไรบ้าง เช่น ขอดูเมนูกาแฟ, มีกาแฟ BEAT COFFEE อะไรบ้าง",
    "store_hours": "ถามเวลาเปิดหรือปิดร้าน BEAT COFFEE เช่น ร้านเปิดกี่โมง, วันนี้ปิดกี่โมง",
    "promotion": "ถามโปรโมชั่น ส่วนลด หรือการสะสมแต้ม เช่น มีโปรอะไรบ้าง, ตอนนี้มีส่วนลดไหม, สะสมครบ 10 ฟรีไหม",
    "location": "ถามตำแหน่งร้าน เช่น ร้านอยู่ที่ไหน, ร้านอยู่ที่กรุงเทพมหานครหรือสุรินทร์",
    "contact": "ถามวิธีติดต่อร้าน เช่น วิธีติดต่อร้าน, โทรศัพท์ร้าน",
    "other": "ข้อความอื่นที่ไม่ใช่การสั่งเครื่องดื่ม การดูออเดอร์ เมนู เวลาเปิดร้าน โปรโมชั่น การสะสมแต้ม ที่ตั้งร้าน หรือการติดต่อ",
}

# Facts the bot can say without asking a language model. Edit these to match the shop.
REPLIES = {
    "store_hours": "BEAT COFFEE เปิดทุกวัน 08:00-20:00 น.",
    "promotion": "สะสมครบ 10 แก้ว ฟรี 1 แก้ว",
    "location": "BEAT COFFEE มีสาขาที่กรุงเทพมหานครและสุรินทร์",
    "contact": "ทักสั่งและสอบถามได้ในแชท LINE นี้",
}

_client: TypeSafeClient | None = None


def _jev() -> TypeSafeClient:
    global _client
    if _client is None:
        _client = TypeSafeClient(api_key=os.environ["JEV_API_KEY"], model="jev-latest")
    return _client


def _item_criteria() -> dict:
    aliases: dict[str, list[str]] = {}
    for alias, name in shop.ALIASES.items():
        aliases.setdefault(name, []).append(alias)
    criteria = {}
    for name, price in shop.MENU.items():
        words = [name, shop.DISPLAY.get(name, name), *aliases.get(name, []), f"{price} บาท"]
        criteria[name] = ", ".join(dict.fromkeys(words))
    criteria["none"] = "ไม่ได้สั่งเครื่องดื่มในเมนู"
    return criteria


def _picked(answer, skip: str | None = None) -> str | None:
    if answer is None:
        return None
    choice = answer.choice
    if not choice or float(answer.confidence or 0) < CONFIDENCE_THRESHOLD:
        return None
    if skip is not None and choice == skip:
        return None
    return choice


def jev_classify_intent(user_text: str) -> dict:
    """Read intent and, when it is an order, which menu item, quantity, and note."""
    try:
        result = _jev().system_one(
            state={"channel": "line", "message": user_text},
            questions={
                "intent": Choice(
                    instructions=(
                        "เลือก intent ที่ตรงกับข้อความลูกค้าของร้านกาแฟ BEAT COFFEE มากที่สุด "
                        "ถ้าไม่เข้า intent ที่มีอยู่ ให้เลือก other"
                    ),
                    criteria=INTENT_CRITERIA,
                ),
                "item": Choice(
                    instructions="ลูกค้าสั่งเครื่องดื่มรายการไหนจากเมนู ถ้าไม่ได้สั่งให้เลือก none",
                    criteria=_item_criteria(),
                ),
                "qty": Choice(
                    instructions="จำนวนแก้วที่สั่งในข้อความนี้ ถ้าไม่ได้บอกจำนวนให้เลือก unspecified",
                    criteria={
                        "unspecified": "ไม่ได้บอกจำนวนแก้ว",
                        **{str(n): f"{n} แก้ว" for n in range(1, 11)},
                    },
                ),
                "note": Choice(
                    instructions="ระดับความหวานของแก้วนี้ ถ้าไม่ได้ระบุให้เลือก none",
                    criteria={
                        **{level: level for level in shop.SWEETNESS},
                        "none": "ไม่ได้ระบุความหวาน",
                    },
                ),
            },
        )
    except Exception:
        return {"intent": "other", "confidence": 0.0, "item": None, "qty": None, "note": None}

    intent = result.choices.get("intent")
    item = _picked(result.choices.get("item"), skip="none")
    qty_choice = _picked(result.choices.get("qty"), skip="unspecified")
    note = _picked(result.choices.get("note"))
    if note == "none":
        note = ""
    return {
        "intent": intent.choice if intent is not None else "other",
        "confidence": float(intent.confidence or 0) if intent is not None else 0.0,
        "item": item,
        "qty": int(qty_choice) if qty_choice else None,
        "note": note,
    }


def shop_answer(intent: str) -> str | None:
    """Text for a shop question. An order is not answered here."""
    if intent == "view_menu":
        return shop.menu_text()
    return REPLIES.get(intent)
