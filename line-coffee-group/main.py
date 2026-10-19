import json
import os
from contextvars import ContextVar

import functions_framework
from dotenv import load_dotenv
from linebot.v3 import WebhookHandler
from linebot.v3.exceptions import InvalidSignatureError
from linebot.v3.messaging import (
    ApiClient,
    Configuration,
    FlexContainer,
    FlexMessage,
    MessagingApi,
    PostbackAction,
    QuickReply,
    QuickReplyItem,
    ReplyMessageRequest,
    TextMessage,
)
from linebot.v3.webhooks import (
    GroupSource,
    MessageEditedEvent,
    MessageEvent,
    PostbackEvent,
    RoomSource,
    TextMessageContent,
)

import coffee_shop as shop
from adk_agent import NO_REPLY, reply

load_dotenv()

configuration = Configuration(access_token=os.environ["LINE_CHANNEL_ACCESS_TOKEN"])
_skip_signature: ContextVar[bool] = ContextVar("skip_line_signature", default=False)
handler = WebhookHandler(
    os.environ["LINE_CHANNEL_SECRET"],
    skip_signature_verification=lambda: _skip_signature.get(),
)
line_bot_api = MessagingApi(ApiClient(configuration))


def normalize_webhook(body: str) -> str:
    """Add the quoteToken the SDK requires when a messageEdited event omits it."""
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        return body
    changed = False
    for event in payload.get("events", []):
        message = event.get("message")
        if (
            isinstance(message, dict)
            and message.get("type") == "text"
            and not message.get("quoteToken")
        ):
            message["quoteToken"] = "-"
            changed = True
    if not changed:
        return body
    return json.dumps(payload, ensure_ascii=False)


@functions_framework.http
def callback(request):
    signature = request.headers["X-Line-Signature"]
    body = request.get_data(as_text=True)
    try:
        if not handler.parser.signature_validator.validate(body, signature):
            return ("Invalid signature", 400)
        normalized = normalize_webhook(body)
        token = _skip_signature.set(normalized != body)
        try:
            handler.handle(normalized, signature)
        finally:
            _skip_signature.reset(token)
    except InvalidSignatureError:
        return ("Invalid signature", 400)
    return "OK"


def chat_id(source) -> str:
    if isinstance(source, GroupSource):
        return source.group_id
    if isinstance(source, RoomSource):
        return source.room_id
    return source.user_id


def member_profile(source) -> tuple[str, str]:
    user_id = getattr(source, "user_id", None)
    if not user_id:
        return "ลูกค้า", ""
    try:
        if source.type == "group":
            profile = line_bot_api.get_group_member_profile(source.group_id, user_id)
        elif source.type == "room":
            profile = line_bot_api.get_room_member_profile(source.room_id, user_id)
        else:
            profile = line_bot_api.get_profile(user_id)
        picture = profile.picture_url or ""
        if not picture.startswith("https://"):
            picture = ""
        return profile.display_name or "ลูกค้า", picture
    except Exception:
        return "ลูกค้า", ""


def display_name(source) -> str:
    return member_profile(source)[0]


def send(event, messages) -> None:
    if not getattr(event, "reply_token", None):
        return
    line_bot_api.reply_message(
        ReplyMessageRequest(reply_token=event.reply_token, messages=messages)
    )


def confirm_reply() -> QuickReply:
    return QuickReply(
        items=[
            QuickReplyItem(
                action=PostbackAction(
                    label="ยืนยันส่งออเดอร์",
                    data="confirm",
                    display_text="ยืนยันส่งออเดอร์",
                )
            ),
            QuickReplyItem(
                action=PostbackAction(
                    label="ยกเลิก",
                    data="cancel",
                    display_text="ยกเลิกออเดอร์",
                )
            ),
        ]
    )


ASK_ORDER = "พิมพ์ชื่อกาแฟที่ต้องการได้เลย เช่น อเมริกาโน่ หรือ ชาเขียวหวานน้อย"


def is_start(text: str) -> bool:
    compact = "".join(text.split())
    changed = True
    while changed:
        changed = False
        for suffix in ("หน่อย", "ด้วย", "ที", "นะ", "ค่ะ", "ครับ", "คะ", "เลย"):
            if compact.endswith(suffix) and len(compact) > len(suffix):
                compact = compact[: -len(suffix)]
                changed = True
                break
    return compact in {"สั่งกาแฟ", "เปิดออเดอร์", "เริ่มสั่ง"}


def asks_menu(text: str) -> bool:
    compact = "".join(text.split())
    return compact in {"เมนู", "ดูเมนู", "ขอดูเมนู", "มีอะไรบ้าง", "เมนูมีอะไร"}


def asks_summary(text: str) -> bool:
    compact = "".join(text.split())
    return compact in {"สรุปออเดอร์", "สรุป", "ดูออเดอร์", "ออเดอร์"}


def _avatar(row: dict) -> dict:
    picture = row.get("picture_url") or ""
    if picture.startswith("https://"):
        return {
            "type": "box",
            "layout": "vertical",
            "width": "40px",
            "height": "40px",
            "cornerRadius": "20px",
            "flex": 0,
            "contents": [
                {
                    "type": "image",
                    "url": picture,
                    "size": "full",
                    "aspectMode": "cover",
                    "aspectRatio": "1:1",
                }
            ],
        }
    letter = (row.get("user_name") or "ล")[:1]
    return {
        "type": "box",
        "layout": "vertical",
        "width": "40px",
        "height": "40px",
        "cornerRadius": "20px",
        "backgroundColor": "#DFF5EA",
        "justifyContent": "center",
        "alignItems": "center",
        "flex": 0,
        "contents": [
            {
                "type": "text",
                "text": letter,
                "align": "center",
                "gravity": "center",
                "color": "#128A4E",
                "weight": "bold",
            }
        ],
    }


def _member_row(row: dict) -> dict:
    return {
        "type": "box",
        "layout": "horizontal",
        "spacing": "md",
        "alignItems": "center",
        "contents": [
            _avatar(row),
            {
                "type": "box",
                "layout": "vertical",
                "flex": 1,
                "contents": [
                    {
                        "type": "text",
                        "text": row["user_name"] or "ลูกค้า",
                        "weight": "bold",
                        "size": "sm",
                        "wrap": True,
                    },
                    {
                        "type": "text",
                        "text": shop.drink_label(row),
                        "size": "xs",
                        "color": "#8A8A8A",
                        "wrap": True,
                        "margin": "xs",
                    },
                ],
            },
        ],
    }


def order_card(order: dict, change: dict | None = None):
    """Order summary card with a green gradient header, plus a change-of-mind banner when a message is edited."""
    items = order["items"]
    if not items:
        return TextMessage(text=shop.summary_text(order)[:5000])
    body = []
    if change:
        body.append(
            {
                "type": "box",
                "layout": "horizontal",
                "backgroundColor": "#F2F3F5",
                "paddingAll": "12px",
                "cornerRadius": "8px",
                "alignItems": "center",
                "contents": [
                    {
                        "type": "text",
                        "text": f"{change['user_name']} เปลี่ยนใจ",
                        "size": "sm",
                        "color": "#333333",
                        "flex": 0,
                    },
                    {
                        "type": "text",
                        "text": change["after"],
                        "size": "sm",
                        "color": "#E53935",
                        "weight": "bold",
                        "margin": "sm",
                        "wrap": True,
                    },
                ],
            }
        )
    for row in items:
        row_box = _member_row(row)
        row_box["margin"] = "lg"
        body.append(row_box)
    count = len(items)
    bubble = {
        "type": "bubble",
        "size": "mega",
        "header": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "18px",
            "background": {
                "type": "linearGradient",
                "angle": "0deg",
                "startColor": "#14C86A",
                "endColor": "#12C3D4",
            },
            "contents": [
                {
                    "type": "text",
                    "text": f"ออเดอร์ทั้งหมด {count} รายการ",
                    "color": "#FFFFFF",
                    "weight": "bold",
                    "size": "lg",
                    "wrap": True,
                }
            ],
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "paddingAll": "16px",
            "backgroundColor": "#FFFFFF",
            "contents": body,
        },
    }
    quick_reply = confirm_reply()
    return FlexMessage(
        alt_text=shop.summary_text(order)[:400],
        contents=FlexContainer.from_dict(bubble),
        quick_reply=quick_reply,
    )


def order_lines(items: list[dict], total: float) -> str:
    lines = []
    for row in items:
        extra = f" ({row['note']})" if row["note"] else ""
        lines.append(f"{row['item']} x{row['qty']}{extra}")
    lines.append(f"รวม {total:.0f} บาท")
    return "\n".join(lines)


@handler.add(MessageEvent, message=TextMessageContent)
def handle_text_message(event):
    cid = chat_id(event.source)
    text = event.message.text.strip()
    name, picture = member_profile(event.source)
    user_id = getattr(event.source, "user_id", None) or name
    if asks_summary(text):
        send(event, [order_card(shop.open_order(cid))])
        return
    if is_start(text):
        shop.open_round(cid)
        draft = shop.open_order(cid)
        messages = [TextMessage(text=ASK_ORDER)]
        if draft["items"]:
            messages.append(order_card(draft))
        send(event, messages)
        return
    if shop.round_is_open(cid):
        if asks_menu(text):
            send(event, [TextMessage(text=shop.menu_text()[:5000])])
            return
        result = shop.save_message_order(
            cid,
            user_id,
            name,
            text,
            event.message.id,
            event.timestamp or 0,
            picture,
        )
        if result["status"] == "ignore":
            quick_reply = confirm_reply() if shop.open_order(cid)["items"] else None
            send(event, [TextMessage(text=ASK_ORDER, quick_reply=quick_reply)])
            return
        if result["status"] != "success":
            if result["status"] != "stale":
                send(event, [TextMessage(text=result.get("message", "จดออเดอร์ไม่ได้")[:5000])])
            return
        send(event, [order_card(result["order"])])
        return
    if shop.parse_order(text):
        send(event, [TextMessage(text="พิมพ์ สั่งกาแฟ ก่อน แล้วพิมพ์ชื่อกาแฟได้เลย")])
        return
    answer = reply(text, cid, name)
    if not answer or answer.strip() == NO_REPLY:
        return
    quick_reply = confirm_reply() if shop.open_order(cid)["items"] else None
    send(event, [TextMessage(text=answer[:5000], quick_reply=quick_reply)])


@handler.add(MessageEditedEvent)
def handle_message_edited(event):
    message = event.message
    if getattr(message, "type", None) != "text":
        return
    cid = chat_id(event.source)
    name, picture = member_profile(event.source)
    user_id = getattr(event.source, "user_id", None) or name
    result = shop.edit_message_order(
        cid,
        user_id,
        name,
        message.text.strip(),
        message.id,
        event.timestamp or 0,
        picture,
    )
    if result.get("status") == "error":
        send(event, [TextMessage(text=result["message"][:5000])])
        return
    if result.get("status") != "success":
        return
    send(event, [order_card(result["order"], result.get("change"))])


@handler.add(PostbackEvent)
def handle_postback(event):
    cid = chat_id(event.source)
    if event.postback.data == "confirm":
        result = shop.confirm_order(cid)
        if result["status"] != "success":
            body = result["message"]
        else:
            body = "ส่งออเดอร์แล้ว\n" + order_lines(result["items"], result["total"])
    elif event.postback.data == "cancel":
        result = shop.clear_open(cid)
        body = "ยกเลิกออเดอร์ที่ยังไม่ส่งแล้ว" if result["count"] else "ไม่มีออเดอร์ค้าง"
    else:
        return
    send(event, [TextMessage(text=body[:5000])])
