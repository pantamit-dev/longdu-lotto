"""RSVP ในกลุ่ม: +1 คือไป, -1 คือไม่ไป. เก็บหนึ่งคนต่อหนึ่งสถานะ."""

import contextlib
import os
import sqlite3
from collections.abc import Iterator

def db_path() -> str:
    return os.getenv("DB_PATH", os.path.join("data", "rsvp.db"))


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
        """CREATE TABLE IF NOT EXISTS rsvps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            picture_url TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL,
            message_id TEXT NOT NULL DEFAULT '',
            edited_at INTEGER NOT NULL DEFAULT 0,
            UNIQUE (chat_id, user_id)
        )"""
    )
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def parse_rsvp(text: str) -> str | None:
    """รับเฉพาะข้อความ +1 หรือ -1 เท่านั้น."""
    compact = text.strip()
    if compact == "+1":
        return "in"
    if compact == "-1":
        return "out"
    return None


def going(chat_id: str) -> list[dict]:
    with connect() as conn:
        rows = conn.execute(
            """SELECT * FROM rsvps
               WHERE chat_id = ? AND status = 'in'
               ORDER BY id""",
            (chat_id,),
        ).fetchall()
    return [_person(row) for row in rows]


def _person(row: sqlite3.Row) -> dict:
    return {
        "user_id": row["user_id"],
        "user_name": row["user_name"],
        "picture_url": row["picture_url"],
    }


def _find_user(chat_id: str, user_id: str) -> dict | None:
    with connect() as conn:
        row = conn.execute(
            "SELECT * FROM rsvps WHERE chat_id = ? AND user_id = ?",
            (chat_id, user_id),
        ).fetchone()
        if row is None:
            return None
        return {
            "status": row["status"],
            "picture_url": row["picture_url"],
            "edited_at": row["edited_at"],
            "message_id": row["message_id"],
            "user_name": row["user_name"],
        }


def apply_rsvp(
    chat_id: str,
    user_id: str,
    user_name: str,
    text: str,
    message_id: str,
    timestamp: int,
    picture_url: str = "",
) -> dict:
    choice = parse_rsvp(text)
    if choice is None:
        return {"status": "ignore"}
    current = _find_user(chat_id, user_id)
    if current is not None and int(timestamp) <= int(current["edited_at"] or 0):
        return {"status": "stale"}
    previous = current["status"] if current is not None else None
    picture = picture_url or (current["picture_url"] if current is not None else "")
    with connect() as conn:
        if current is None:
            conn.execute(
                """INSERT INTO rsvps
                   (chat_id, user_id, user_name, picture_url, status, message_id, edited_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (chat_id, user_id, user_name, picture, choice, message_id, int(timestamp)),
            )
        else:
            conn.execute(
                """UPDATE rsvps
                   SET user_name = ?, picture_url = ?, status = ?, message_id = ?, edited_at = ?
                   WHERE chat_id = ? AND user_id = ?""",
                (
                    user_name,
                    picture,
                    choice,
                    message_id,
                    int(timestamp),
                    chat_id,
                    user_id,
                ),
            )
    people = going(chat_id)
    if previous == choice:
        return {"status": "unchanged", "people": people}
    if choice == "in" and previous == "out":
        action = "rejoined"
    elif choice == "in":
        action = "joined"
    elif previous == "in":
        action = "withdrew"
    else:
        action = "declined"
    change = None
    if action == "withdrew":
        change = {"user_name": user_name, "label": "ขอถอนตัว", "color": "#E53935"}
    elif action == "rejoined":
        change = {"user_name": user_name, "label": "ไปด้วย", "color": "#14A44D"}
    return {"status": "success", "action": action, "people": people, "change": change}
