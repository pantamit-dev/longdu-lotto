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
    "other": "ข้อความอื่นที่ไม่ใช่การสั่งเครื่องดื่ม การดูออเดอร์ หรือการขอดูเมนู",
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


def jev_classify_intent(user_text: str) -> str:
    """Return the intent name. A low-confidence read comes back as other."""
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
            },
        )
    except Exception:
        return "other"

    intent = result.choices.get("intent")
    if intent is None or float(intent.confidence or 0) < CONFIDENCE_THRESHOLD:
        return "other"
    return intent.choice or "other"


def jev_read_order(user_text: str) -> dict:
    """Read the menu item, cup count, and sweetness from an order message."""
    try:
        result = _jev().system_one(
            state={"channel": "line", "message": user_text},
            questions={
                "item": Choice(
                    instructions="ลูกค้าสั่งเครื่องดื่มรายการไหนจากเมนู ถ้าไม่ได้สั่งให้เลือก none",
                    criteria=_item_criteria(),
                ),
                "qty": Choice(
                    instructions="จำนวนแก้วที่สั่งในข้อความนี้ ถ้าไม่ได้บอกจำนวนให้เลือก unspecified",
                    criteria={
                        "unspecified": "ไม่ได้บอกจำนวนแก้ว นับเป็น 1 แก้ว",
                        **{str(n): f"{n} แก้ว" for n in range(1, 11)},
                    },
                ),
                "note": Choice(
                    instructions="ระดับความหวานของแก้วนี้ ถ้าไม่ได้ระบุให้เลือก none",
                    criteria={
                        **{level: level for level in shop.SWEETNESS},
                        "none": "ไม่ได้ระบุความหวาน ให้ถือว่าหวานปกติ",
                    },
                ),
            },
        )
    except Exception:
        return {"item": None, "qty": 1, "note": "หวานปกติ"}

    note = _picked(result.choices.get("note"))
    if not note or note == "none":
        note = "หวานปกติ"
    qty_choice = _picked(result.choices.get("qty"), skip="unspecified")
    return {
        "item": _picked(result.choices.get("item"), skip="none"),
        "qty": int(qty_choice) if qty_choice else 1,
        "note": note,
    }
