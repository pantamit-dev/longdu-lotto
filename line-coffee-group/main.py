import json
import os

import functions_framework
from dotenv import load_dotenv
from linebot.v3 import WebhookHandler
from linebot.v3.exceptions import InvalidSignatureError
from linebot.v3.messaging import (
    ApiClient,
    Configuration,
    MessagingApi,
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
from flex_mesage import confirm_reply, menu_flex, order_card
from jev_intent import jev_classify_intent, jev_read_order

load_dotenv()

handler = WebhookHandler(os.environ["LINE_CHANNEL_SECRET"])
line_bot_api = MessagingApi(
    ApiClient(Configuration(access_token=os.environ["LINE_CHANNEL_ACCESS_TOKEN"]))
)

ASK_ORDER = "พิมพ์ชื่อกาแฟ จำนวนแก้ว และความหวาน เช่น อเมริกาโน่ 1 แก้ว หวานน้อย"


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


def get_user_profile(source) -> tuple[str, str]:
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


def reply_with_flex_msg(event, messages) -> None:
    if not getattr(event, "reply_token", None):
        return
    line_bot_api.reply_message(
        ReplyMessageRequest(reply_token=event.reply_token, messages=messages)
    )


def _detail_prompt(drink: dict) -> str | None:
    """Ask for cup count and sweetness before a new order is saved."""
    item = drink.get("item") or ""
    if not item:
        return None
    name = shop.DISPLAY.get(item, item)
    qty = drink.get("qty")
    sweet = (drink.get("note") or "").strip()
    if sweet not in shop.SWEETNESS:
        sweet = ""
    if qty and sweet:
        return None
    if not qty and not sweet:
        return f"สั่ง{name}กี่แก้ว และหวานระดับไหน เช่น 1 แก้ว หวานน้อย"
    if not qty:
        return f"สั่ง{name} {sweet} กี่แก้ว"
    return f"{name} {qty} แก้ว หวานระดับไหน เช่น หวานน้อย หวานปานกลาง หวานมาก"


def _save_order(event, cid, user_id, name, picture, drink: dict):
    """Save the drink Jev picked. Cup count and sweetness are required."""
    prompt = _detail_prompt(drink)
    if prompt:
        quick_reply = confirm_reply() if shop.open_order(cid)["items"] else None
        reply_with_flex_msg(event, [TextMessage(text=prompt, quick_reply=quick_reply)])
        return
    result = shop.save_message_order(
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
    status = result["status"]
    if status == "ignore":
        quick_reply = confirm_reply() if shop.open_order(cid)["items"] else None
        reply_with_flex_msg(event, [TextMessage(text=ASK_ORDER, quick_reply=quick_reply)])
        return
    if status == "stale":
        return
    if status != "success":
        reply_with_flex_msg(event, [TextMessage(text=result.get("message", "จดออเดอร์ไม่ได้")[:5000])])
        return
    reply_with_flex_msg(event, [order_card(result["order"])])


def _edit_order(event, cid, user_id, name, picture, drink: dict):
    """Rewrite the open order tied to this message so it matches the edited text."""
    message_id = event.message.id
    linked = shop.order_by_message(cid, message_id)
    if linked and linked["status"] != "open":
        reply_with_flex_msg(event, [TextMessage(text="ออเดอร์นี้ส่งร้านแล้ว แก้ข้อความไม่เปลี่ยนรายการ")])
        return

    sweet = (drink.get("note") or "").strip()
    if sweet not in shop.SWEETNESS:
        sweet = None
    item = drink.get("item") or ""
    qty = drink.get("qty")
    if not item and qty is None and sweet is None:
        return

    result = shop.edit_message_order(
        cid,
        user_id,
        name,
        item,
        message_id,
        event.timestamp or 0,
        picture,
        qty,
        sweet,
    )
    if result.get("status") == "missing":
        if not shop.round_is_open(cid):
            shop.open_round(cid)
        _save_order(event, cid, user_id, name, picture, drink)
        return
    status = result.get("status")
    if status == "error":
        reply_with_flex_msg(event, [TextMessage(text=result["message"][:5000])])
        return
    if status != "success":
        return
    reply_with_flex_msg(event, [order_card(result["order"], result.get("change"))])


@handler.add(MessageEvent, message=TextMessageContent)
def handle_message(event):
    """Runs every time someone sends a message."""
    if not isinstance(event.message, TextMessageContent):
        return
    text = (event.message.text or "").strip()
    if not text:
        return

    cid = chat_id(event.source)
    name, picture = get_user_profile(event.source)
    user_id = event.source.user_id

    intent = jev_classify_intent(text)
    if intent == "summary":
        reply_with_flex_msg(event, [order_card(shop.open_order(cid))])
        return
    if intent == "view_menu":
        quick_reply = confirm_reply() if shop.open_order(cid)["items"] else None
        reply_with_flex_msg(event, [menu_flex(quick_reply)])
        return
    if intent == "order":
        if not shop.round_is_open(cid):
            shop.open_round(cid)
        _save_order(event, cid, user_id, name, picture, jev_read_order(text))
        return


@handler.add(MessageEditedEvent)
def handle_edited_message(event):
    """Runs every time someone edits a message."""
    if not isinstance(event.message, TextMessageContent):
        return
    text = (event.message.text or "").strip()
    if not text:
        return

    cid = chat_id(event.source)
    name, picture = get_user_profile(event.source)
    user_id = event.source.user_id

    if jev_classify_intent(text) == "order":
        _edit_order(event, cid, user_id, name, picture, jev_read_order(text))


def order_lines(items: list[dict], total: float) -> str:
    lines = [shop.drink_label(row) for row in items]
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
    reply_with_flex_msg(event, [TextMessage(text=text[:5000])])
