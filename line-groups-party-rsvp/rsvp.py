"""One RSVP row per person. status is "in" or "out"."""

import os
import sqlite3


def connect() -> sqlite3.Connection:
    path = os.getenv("DB_PATH", os.path.join("data", "rsvp.db"))
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
    return conn


def reset() -> None:
    """Delete every RSVP row."""
    conn = connect()
    try:
        conn.execute("DELETE FROM rsvps")
        conn.commit()
    finally:
        conn.close()


def going(chat_id: str) -> list[dict]:
    conn = connect()
    try:
        return going_in(conn, chat_id)
    finally:
        conn.close()


def going_in(conn: sqlite3.Connection, chat_id: str) -> list[dict]:
    rows = conn.execute(
        """SELECT user_id, user_name, picture_url FROM rsvps
           WHERE chat_id = ? AND status = 'in'
           ORDER BY id""",
        (chat_id,),
    ).fetchall()
    return [dict(row) for row in rows]


def apply_rsvp(
    chat_id: str,
    user_id: str,
    user_name: str,
    status: str,
    message_id: str,
    timestamp: int,
    picture_url: str = "",
) -> dict:
    conn = connect()
    try:
        current = conn.execute(
            """SELECT status, picture_url, edited_at FROM rsvps
               WHERE chat_id = ? AND user_id = ?""",
            (chat_id, user_id),
        ).fetchone()
        if current is not None and int(timestamp) <= int(current["edited_at"] or 0):
            return {"status": "stale"}

        previous = current["status"] if current else None
        picture = picture_url or (current["picture_url"] if current else "")
        conn.execute(
            """INSERT INTO rsvps
               (chat_id, user_id, user_name, picture_url, status, message_id, edited_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(chat_id, user_id) DO UPDATE SET
                 user_name = excluded.user_name,
                 picture_url = excluded.picture_url,
                 status = excluded.status,
                 message_id = excluded.message_id,
                 edited_at = excluded.edited_at""",
            (chat_id, user_id, user_name, picture, status, message_id, int(timestamp)),
        )
        conn.commit()
        people = going_in(conn, chat_id)
    finally:
        conn.close()

    if previous == status:
        return {"status": "unchanged", "people": people}
    change = None
    if previous == "in" and status == "out":
        change = {"user_name": user_name, "label": "ขอถอนตัว", "color": "#E53935"}
    elif previous == "out" and status == "in":
        change = {"user_name": user_name, "label": "ไปด้วย", "color": "#14A44D"}
    return {"status": "success", "people": people, "change": change}
