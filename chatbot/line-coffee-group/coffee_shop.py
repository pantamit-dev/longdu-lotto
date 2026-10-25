"""Coffee shop menu and orders, stored in SQLite.

Ordered items are first saved with status open, and are sent
to the shop only when the confirm button (postback confirm) is pressed.
"""

import contextlib
import os
import re
import sqlite3
from collections.abc import Iterator

MENU = {
    "เอสเปรสโซ": 45,
    "อเมริกาโน": 55,
    "ลาเต้": 65,
    "คาปูชิโน": 65,
    "มอคค่า": 70,
    "ชาไทย": 50,
    "ชาเขียว": 50,
    "โกโก้": 55,
}

ALIASES = {
    "espresso": "เอสเปรสโซ",
    "americano": "อเมริกาโน",
    "latte": "ลาเต้",
    "cappuccino": "คาปูชิโน",
    "mocha": "มอคค่า",
    "cocoa": "โกโก้",
    "green tea": "ชาเขียว",
}

DISPLAY = {
    "อเมริกาโน": "อเมริกาโน่",
}

SWEETNESS = (
    "หวานน้อย",
    "หวานปานกลาง",
    "หวานปกติ",
    "หวานมาก",
    "ไม่หวาน",
)

NOTES = SWEETNESS + (
    "ไม่ใส่นม",
    "ไม่ใส่น้ำแข็ง",
    "น้ำแข็งน้อย",
    "เพิ่มช็อต",
)


def db_path() -> str:
    return os.getenv("DB_PATH", os.path.join("data", "coffee.db"))


@contextlib.contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    path = db_path()
    if path != ":memory:":
        folder = os.path.dirname(os.path.abspath(path))
        if folder:
            os.makedirs(folder, exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id TEXT NOT NULL,
            user_name TEXT,
            item TEXT NOT NULL,
            qty INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            note TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT 'open'
        )"""
    )
    columns = {row[1] for row in conn.execute("PRAGMA table_info(orders)")}
    if "user_id" not in columns:
        conn.execute("ALTER TABLE orders ADD COLUMN user_id TEXT NOT NULL DEFAULT ''")
    if "message_id" not in columns:
        conn.execute("ALTER TABLE orders ADD COLUMN message_id TEXT NOT NULL DEFAULT ''")
    if "edited_at" not in columns:
        conn.execute("ALTER TABLE orders ADD COLUMN edited_at INTEGER NOT NULL DEFAULT 0")
    if "picture_url" not in columns:
        conn.execute("ALTER TABLE orders ADD COLUMN picture_url TEXT NOT NULL DEFAULT ''")
    conn.execute(
        """CREATE TABLE IF NOT EXISTS rounds (
            chat_id TEXT PRIMARY KEY,
            status TEXT NOT NULL
        )"""
    )
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def menu_text() -> str:
    return ", ".join(f"{name} {price} บาท" for name, price in MENU.items())


def find_item(name: str) -> str | None:
    key = name.strip().casefold()
    if key in ALIASES:
        return ALIASES[key]
    for item in MENU:
        folded = item.casefold()
        if key == folded or folded in key or key in folded:
            return item
    return None


def find_item_in_text(text: str) -> str | None:
    key = re.sub(r"\s+", "", text).casefold()
    best = None
    best_len = 0
    pairs = [(alias, name) for alias, name in ALIASES.items()]
    pairs += [(name, name) for name in MENU]
    for needle, name in pairs:
        folded = needle.casefold()
        if folded and folded in key and len(folded) > best_len:
            best = name
            best_len = len(folded)
    return best


def parse_order(text: str) -> dict | None:
    raw = text.strip()
    if not raw:
        return None
    compact = re.sub(r"\s+", "", raw)
    note = ""
    for word in sorted(NOTES, key=len, reverse=True):
        if word in compact:
            note = word
            compact = compact.replace(word, "", 1)
            break
    numbers = re.findall(r"\d+", compact)
    qty = int(numbers[-1]) if numbers else None
    item = find_item_in_text(raw)
    if item is None and not note and qty is None:
        return None
    return {
        "item": item,
        "qty": qty,
        "note": note,
        "mentions_item": item is not None,
        "mentions_note": bool(note),
        "force_add": "อีกแก้ว" in raw or bool(re.search(r"เพิ่ม(?!ช็อต)", raw)),
    }


def open_round(chat_id: str) -> None:
    _set_round(chat_id, "open")


def close_round(chat_id: str) -> None:
    _set_round(chat_id, "closed")


def round_is_open(chat_id: str) -> bool:
    with connect() as conn:
        row = conn.execute("SELECT status FROM rounds WHERE chat_id = ?", (chat_id,)).fetchone()
    return row is not None and row["status"] == "open"


def _set_round(chat_id: str, status: str) -> None:
    with connect() as conn:
        conn.execute(
            """INSERT INTO rounds (chat_id, status) VALUES (?, ?)
               ON CONFLICT(chat_id) DO UPDATE SET status = excluded.status""",
            (chat_id, status),
        )


def _row(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "item": row["item"],
        "qty": row["qty"],
        "price": row["unit_price"],
        "note": row["note"],
        "user_name": row["user_name"],
        "user_id": row["user_id"] if "user_id" in row.keys() else "",
        "message_id": row["message_id"] if "message_id" in row.keys() else "",
        "edited_at": row["edited_at"] if "edited_at" in row.keys() else 0,
        "picture_url": row["picture_url"] if "picture_url" in row.keys() else "",
        "status": row["status"] if "status" in row.keys() else "open",
        "line_total": round(row["qty"] * row["unit_price"], 2),
    }


def drink_label(row: dict) -> str:
    """อเมริกาโน่ - หวานน้อย - x2 แก้ว."""
    drink = DISPLAY.get(row["item"], row["item"])
    qty = int(row.get("qty") or 1)
    note = (row.get("note") or "").strip()
    parts = [drink]
    if note:
        parts.append(note)
    parts.append(f"x{qty} แก้ว")
    return " - ".join(parts)


def list_menu() -> dict:
    return {"menu": [{"name": name, "price": price} for name, price in MENU.items()]}


def add_item(
    chat_id: str,
    user_name: str,
    item: str,
    qty: int = 1,
    note: str = "",
    user_id: str = "",
    message_id: str = "",
    picture_url: str = "",
) -> dict:
    found = find_item(item)
    if found is None:
        return {"status": "error", "message": f"ไม่มี {item} ในเมนู", "menu": list(MENU)}
    try:
        qty = int(qty)
    except (TypeError, ValueError):
        return {"status": "error", "message": "จำนวนต้องเป็นตัวเลข"}
    if qty < 1:
        return {"status": "error", "message": "จำนวนต้องอย่างน้อย 1"}
    note = note.strip()
    price = MENU[found]
    with connect() as conn:
        existing = None
        if not message_id and user_id:
            existing = conn.execute(
                "SELECT * FROM orders WHERE chat_id = ? AND status = 'open'"
                " AND item = ? AND note = ? AND user_id = ?",
                (chat_id, found, note, user_id),
            ).fetchone()
        elif not message_id:
            existing = conn.execute(
                "SELECT * FROM orders WHERE chat_id = ? AND status = 'open'"
                " AND item = ? AND note = ? AND user_name = ? AND user_id = ''",
                (chat_id, found, note, user_name),
            ).fetchone()
        if existing:
            qty = existing["qty"] + qty
            conn.execute(
                "UPDATE orders SET qty = ?, picture_url = ? WHERE id = ?",
                (qty, picture_url or existing["picture_url"], existing["id"]),
            )
            order_id = existing["id"]
        else:
            cur = conn.execute(
                """INSERT INTO orders
                   (chat_id, user_name, user_id, item, qty, unit_price, note, message_id, picture_url)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (chat_id, user_name, user_id, found, qty, price, note, message_id, picture_url),
            )
            order_id = cur.lastrowid
    return {
        "status": "success",
        "saved": {
            "id": order_id,
            "item": found,
            "qty": qty,
            "price": price,
            "note": note,
            "user_name": user_name,
            "user_id": user_id,
        },
        "order": open_order(chat_id),
        "note": "จดไว้แล้ว ยังไม่ส่งร้าน จนกว่าลูกค้าจะกดยืนยัน",
    }


def open_order(chat_id: str) -> dict:
    with connect() as conn:
        rows = [
            _row(row)
            for row in conn.execute(
                "SELECT * FROM orders WHERE chat_id = ? AND status = 'open' ORDER BY id",
                (chat_id,),
            )
        ]
    return {
        "items": rows,
        "total": round(sum(row["line_total"] for row in rows), 2),
    }


def update_item(
    chat_id: str,
    order_id: int,
    item: str | None = None,
    qty: int | None = None,
    note: str | None = None,
) -> dict:
    """Edit an unconfirmed item. qty is the new total, not an amount to add."""
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM orders WHERE chat_id = ? AND id = ? AND status = 'open'",
            (chat_id, int(order_id)),
        ).fetchone()
        if row is None:
            return {"status": "error", "message": f"ไม่พบรายการ id {order_id}"}
        new_item = row["item"]
        new_price = row["unit_price"]
        new_qty = row["qty"]
        new_note = row["note"] if note is None else note.strip()
        if item is not None and item.strip():
            found = find_item(item)
            if found is None:
                return {"status": "error", "message": f"ไม่มี {item} ในเมนู", "menu": list(MENU)}
            new_item = found
            new_price = MENU[found]
        if qty is not None:
            try:
                new_qty = int(qty)
            except (TypeError, ValueError):
                return {"status": "error", "message": "จำนวนต้องเป็นตัวเลข"}
            if new_qty < 1:
                return {"status": "error", "message": "จำนวนต้องอย่างน้อย 1"}
        saved = {
            "id": row["id"],
            "item": new_item,
            "qty": new_qty,
            "price": new_price,
            "note": new_note,
            "user_name": row["user_name"],
            "user_id": row["user_id"],
        }
        if new_item == row["item"] and new_qty == row["qty"] and new_note == row["note"]:
            pass
        elif row["message_id"]:
            conn.execute(
                "UPDATE orders SET item = ?, qty = ?, unit_price = ?, note = ? WHERE id = ?",
                (new_item, new_qty, new_price, new_note, row["id"]),
            )
        else:
            owner = "user_id = ?" if row["user_id"] else "user_name = ? AND user_id = ''"
            owner_value = row["user_id"] or row["user_name"]
            other = conn.execute(
                f"""SELECT * FROM orders
                    WHERE chat_id = ? AND status = 'open'
                      AND item = ? AND note = ? AND id != ? AND {owner}""",
                (chat_id, new_item, new_note, row["id"], owner_value),
            ).fetchone()
            if other:
                new_qty = other["qty"] + new_qty
                conn.execute("UPDATE orders SET qty = ? WHERE id = ?", (new_qty, other["id"]))
                conn.execute("DELETE FROM orders WHERE id = ?", (row["id"],))
                saved["id"] = other["id"]
                saved["qty"] = new_qty
                saved["user_name"] = other["user_name"]
                saved["user_id"] = other["user_id"]
            else:
                conn.execute(
                    "UPDATE orders SET item = ?, qty = ?, unit_price = ?, note = ? WHERE id = ?",
                    (new_item, new_qty, new_price, new_note, row["id"]),
                )
    return {
        "status": "success",
        "saved": saved,
        "order": open_order(chat_id),
        "note": "แก้รายการแล้ว ยังไม่ส่งร้าน จนกว่าลูกค้าจะกดยืนยัน",
    }


def apply_user_order(chat_id: str, user_id: str, user_name: str, parsed: dict) -> dict:
    """A person who already has an item edits it; a new person, or an explicit extra order, adds an item."""
    own = [row for row in open_order(chat_id)["items"] if row["user_id"] == user_id]
    if own and not parsed["force_add"]:
        target = own[-1]
        item = parsed["item"] or target["item"]
        qty = parsed["qty"] if parsed["qty"] is not None else target["qty"]
        note = parsed["note"] if parsed["mentions_item"] or parsed["mentions_note"] else target["note"]
        result = update_item(chat_id, target["id"], item=item, qty=qty, note=note)
        if result["status"] == "success":
            result["action"] = "updated"
        return result
    if not parsed["item"]:
        return {"status": "error", "message": "พิมพ์ชื่อกาแฟที่ต้องการได้เลย"}
    result = add_item(
        chat_id,
        user_name,
        parsed["item"],
        parsed["qty"] or 1,
        parsed["note"],
        user_id,
    )
    if result["status"] == "success":
        result["action"] = "added"
    return result


def _touch(order_id: int, timestamp: int) -> None:
    with connect() as conn:
        conn.execute(
            "UPDATE orders SET edited_at = ? WHERE id = ?",
            (int(timestamp), int(order_id)),
        )


def order_by_message(chat_id: str, message_id: str) -> dict | None:
    """The order row tied to a LINE message, including one already sent to the shop."""
    if not message_id:
        return None
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM orders WHERE chat_id = ? AND message_id = ?",
            (chat_id, message_id),
        ).fetchone()
    return None if row is None else _row(row)


def _by_message(chat_id: str, message_id: str) -> dict | None:
    row = order_by_message(chat_id, message_id)
    if row is None or row["status"] != "open":
        return None
    return row


def remove_message_order(chat_id: str, message_id: str) -> dict:
    """Drop the open order that came from this message. A sent order stays."""
    row = _by_message(chat_id, message_id)
    if row is None:
        return {"status": "missing"}
    with connect() as conn:
        conn.execute("DELETE FROM orders WHERE id = ?", (row["id"],))
    order = open_order(chat_id)
    if not order["items"]:
        close_round(chat_id)
    return {"status": "success", "removed": row, "order": order}


def _set_picture(order_id: int, picture_url: str) -> None:
    if not picture_url:
        return
    with connect() as conn:
        conn.execute(
            "UPDATE orders SET picture_url = ? WHERE id = ?",
            (picture_url, int(order_id)),
        )


def save_message_order(
    chat_id: str,
    user_id: str,
    user_name: str,
    item: str,
    message_id: str,
    timestamp: int,
    picture_url: str = "",
    qty: int = 1,
    note: str = "",
) -> dict:
    """Record an order from a MessageEvent, linked to that message's id."""
    if not item:
        return {"status": "ignore"}
    existing = _by_message(chat_id, message_id) if message_id else None
    if existing is not None:
        return edit_message_order(
            chat_id, user_id, user_name, item, message_id, timestamp, picture_url, qty, note
        )
    result = add_item(
        chat_id,
        user_name,
        item,
        qty or 1,
        note,
        user_id,
        message_id,
        picture_url,
    )
    if result["status"] != "success":
        return result
    _touch(result["saved"]["id"], timestamp)
    result["action"] = "added"
    result["order"] = open_order(chat_id)
    return result


def edit_message_order(
    chat_id: str,
    user_id: str,
    user_name: str,
    item: str,
    message_id: str,
    timestamp: int,
    picture_url: str = "",
    qty: int | None = None,
    note: str | None = None,
) -> dict:
    """Update the existing order when LINE sends messageEdited for the same message id.

    Events whose timestamp is not newer than the stored one do not overwrite the latest state.
    A missing item, quantity, or note keeps the value already stored.
    """
    row = _by_message(chat_id, message_id)
    if row is None:
        return {"status": "missing"}
    if int(timestamp) <= int(row["edited_at"] or 0):
        return {"status": "stale"}
    if not item and qty is None and note is None:
        return {"status": "error", "message": "แก้ข้อความแล้ว แต่ยังไม่เห็นชื่อกาแฟในเมนู"}
    before = drink_label(row)
    result = update_item(
        chat_id,
        row["id"],
        item=item or row["item"],
        qty=row["qty"] if qty is None else qty,
        note=row["note"] if note is None else note,
    )
    if result["status"] != "success":
        return result
    _touch(result["saved"]["id"], timestamp)
    _set_picture(result["saved"]["id"], picture_url)
    after = drink_label(result["saved"])
    result["action"] = "updated"
    result["order"] = open_order(chat_id)
    result["saved"]["user_name"] = user_name or result["saved"]["user_name"]
    result["saved"]["user_id"] = user_id or result["saved"]["user_id"]
    if before != after:
        result["change"] = {"user_name": row["user_name"] or user_name, "after": after}
    return result


def summary_text(order: dict) -> str:
    if not order["items"]:
        return "☕ Beat Coffee — Order Summary\n\nยังไม่มีรายการ"
    blocks = []
    for row in order["items"]:
        blocks.append(f"{row['user_name']}: {drink_label(row)}")
    return "☕ Beat Coffee — Order Summary\n\n" + "\n\n".join(blocks)


def remove_item(chat_id: str, order_id: int) -> dict:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM orders WHERE chat_id = ? AND id = ? AND status = 'open'",
            (chat_id, int(order_id)),
        ).fetchone()
        if row is None:
            return {"status": "error", "message": f"ไม่พบรายการ id {order_id}"}
        conn.execute("DELETE FROM orders WHERE id = ?", (row["id"],))
    return {"status": "success", "removed": _row(row), "order": open_order(chat_id)}


def confirm_order(chat_id: str) -> dict:
    draft = open_order(chat_id)
    if not draft["items"]:
        return {"status": "error", "message": "ไม่มีออเดอร์ที่รอส่ง"}
    with connect() as conn:
        conn.execute(
            "UPDATE orders SET status = 'sent' WHERE chat_id = ? AND status = 'open'",
            (chat_id,),
        )
    close_round(chat_id)
    return {"status": "success", **draft}


def clear_open(chat_id: str) -> dict:
    draft = open_order(chat_id)
    with connect() as conn:
        conn.execute(
            "DELETE FROM orders WHERE chat_id = ? AND status = 'open'",
            (chat_id,),
        )
    close_round(chat_id)
    return {"status": "success", "count": len(draft["items"])}
