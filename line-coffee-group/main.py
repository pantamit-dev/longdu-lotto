import json
import os

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
from intent import CONFIDENCE_THRESHOLD, read_message, shop_answer

load_dotenv()

handler = WebhookHandler(os.environ["LINE_CHANNEL_SECRET"])
line_bot_api = MessagingApi(
    ApiClient(Configuration(access_token=os.environ["LINE_CHANNEL_ACCESS_TOKEN"]))
)

ASK_ORDER = "พิมพ์ชื่อกาแฟที่ต้องการได้เลย เช่น อเมริกาโน่ หรือ ชาเขียวหวานน้อย"


@functions_framework.http
def callback(request):
    # get X-Line-Signature header value
    signature = request.headers["X-Line-Signature"]

    # get request body as text
    body = request.get_data(as_text=True)
    print("Request body: " + body)

    # handle webhook body
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        print(
            "Invalid signature. Please check your channel access token/channel secret."
        )
    return "OK"


def chat_id(source) -> str:
    if isinstance(source, GroupSource):
        return source.group_id
    if isinstance(source, RoomSource):
        return source.room_id
    return source.user_id


def sender(source) -> tuple[str, str]:
    """Display name and picture. Falls back to ลูกค้า when LINE has no profile."""
    user_id = getattr(source, "user_id", None)
    if not user_id:
        return "ลูกค้า", ""
    try:
        if isinstance(source, GroupSource):
            profile = line_bot_api.get_group_member_profile(source.group_id, user_id)
        elif isinstance(source, RoomSource):
            profile = line_bot_api.get_room_member_profile(source.room_id, user_id)
        else:
            profile = line_bot_api.get_profile(user_id)
        name = profile.display_name or "ลูกค้า"
        picture = profile.picture_url or ""
        if not picture.startswith("https://"):
            picture = ""
        return name, picture
    except Exception:
        return "ลูกค้า", ""


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


def _avatar(person: dict) -> dict:
    picture = person.get("picture_url") or ""
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
    letter = (person.get("user_name") or "ล")[:1]
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


def _member_row(person: dict) -> dict:
    return {
        "type": "box",
        "layout": "horizontal",
        "spacing": "md",
        "alignItems": "center",
        "margin": "lg",
        "contents": [
            _avatar(person),
            {
                "type": "box",
                "layout": "vertical",
                "flex": 1,
                "contents": [
                    {
                        "type": "text",
                        "text": person["user_name"] or "ลูกค้า",
                        "weight": "bold",
                        "size": "sm",
                        "wrap": True,
                    },
                    {
                        "type": "text",
                        "text": shop.drink_label(person),
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
    """Order summary card. A gray banner appears when someone edits their drink."""
    items = order["items"]
    if not items:
        return TextMessage(text=shop.summary_text(order)[:5000])

    rows = []
    if change:
        rows.append({
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
        })
    for person in items:
        rows.append(_member_row(person))

    title = f"ออเดอร์ทั้งหมด {len(items)} รายการ"
    card = {
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
                    "text": title,
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
            "contents": rows,
        },
    }
    return FlexMessage(
        alt_text=shop.summary_text(order)[:400],
        contents=FlexContainer.from_dict(card),
        quick_reply=confirm_reply(),
    )


def _save_order(event, cid, user_id, name, picture, drink: dict):
    """Save the drink Jev picked. If none was picked, ask for a menu name."""
    result = shop.save_message_order(
        cid,
        user_id,
        name,
        drink["item"] or "",
        event.message.id,
        event.timestamp or 0,
        picture,
        drink["qty"] or 1,
        drink["note"] or "",
    )
    status = result["status"]
    if status == "ignore":
        quick_reply = confirm_reply() if shop.open_order(cid)["items"] else None
        send(event, [TextMessage(text=ASK_ORDER, quick_reply=quick_reply)])
        return
    if status == "stale":
        return
    if status != "success":
        send(event, [TextMessage(text=result.get("message", "จดออเดอร์ไม่ได้")[:5000])])
        return
    send(event, [order_card(result["order"])])


def _edit_order(event, cid, user_id, name, picture, drink: dict):
    """An edit updates the drink already tied to that message."""
    result = shop.edit_message_order(
        cid,
        user_id,
        name,
        drink["item"] or "",
        event.message.id,
        event.timestamp or 0,
        picture,
        drink["qty"],
        drink["note"],
    )
    status = result.get("status")
    if status == "error":
        send(event, [TextMessage(text=result["message"][:5000])])
        return
    if status != "success":
        return
    send(event, [order_card(result["order"], result.get("change"))])


@handler.add(MessageEvent, message=TextMessageContent)
@handler.add(MessageEditedEvent)
def handle_message(event):
    """Runs every time someone sends or edits a message."""
    if not isinstance(event.message, TextMessageContent):
        return
    if not getattr(event, "reply_token", None):
        return

    cid = chat_id(event.source)
    text = event.message.text.strip()
    name, picture = sender(event.source)
    user_id = getattr(event.source, "user_id", None) or name

    # Jev reads the message: intent, and which menu item to put on the order.
    reading = read_message(text)
    if isinstance(event, MessageEditedEvent):
        _edit_order(event, cid, user_id, name, picture, reading)
        return

    intent, confidence = reading["intent"], reading["confidence"]
    if confidence >= CONFIDENCE_THRESHOLD:
        if intent == "summary":
            send(event, [order_card(shop.open_order(cid))])
            return
        answer = shop_answer(intent)
        if answer:
            quick_reply = confirm_reply() if shop.open_order(cid)["items"] else None
            send(event, [TextMessage(text=answer[:5000], quick_reply=quick_reply)])
            return
        if intent == "order":
            if not shop.round_is_open(cid):
                shop.open_round(cid)
            _save_order(event, cid, user_id, name, picture, reading)
            return

    if shop.round_is_open(cid):
        if reading["item"]:
            _save_order(event, cid, user_id, name, picture, reading)
            return
        quick_reply = confirm_reply() if shop.open_order(cid)["items"] else None
        send(event, [TextMessage(text=ASK_ORDER, quick_reply=quick_reply)])
        return


def order_lines(items: list[dict], total: float) -> str:
    lines = []
    for row in items:
        extra = f" ({row['note']})" if row["note"] else ""
        lines.append(f"{row['item']} x{row['qty']}{extra}")
    lines.append(f"รวม {total:.0f} บาท")
    return "\n".join(lines)


@handler.add(PostbackEvent)
def handle_postback(event):
    """Confirm sends the open order. Cancel throws it away."""
    cid = chat_id(event.source)
    if event.postback.data == "confirm":
        result = shop.confirm_order(cid)
        if result["status"] != "success":
            text = result["message"]
        else:
            text = "ส่งออเดอร์แล้ว\n" + order_lines(result["items"], result["total"])
    elif event.postback.data == "cancel":
        result = shop.clear_open(cid)
        text = "ยกเลิกออเดอร์ที่ยังไม่ส่งแล้ว" if result["count"] else "ไม่มีออเดอร์ค้าง"
    else:
        return
    send(event, [TextMessage(text=text[:5000])])
