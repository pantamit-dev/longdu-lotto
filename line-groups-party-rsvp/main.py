import json
import os

import functions_framework
from dotenv import load_dotenv
from linebot.v3 import WebhookHandler
from linebot.v3.messaging import (
    ApiClient,
    Configuration,
    FlexContainer,
    FlexMessage,
    MessagingApi,
    ReplyMessageRequest,
)
from linebot.v3.webhooks import (
    GroupSource,
    MessageEditedEvent,
    MessageEvent,
    TextMessageContent,
)

from rsvp import apply_rsvp, going

load_dotenv()

handler = WebhookHandler(
    os.environ["LINE_CHANNEL_SECRET"],
    skip_signature_verification=lambda: True,
)
line_bot_api = MessagingApi(
    ApiClient(Configuration(access_token=os.environ["LINE_CHANNEL_ACCESS_TOKEN"]))
)


@functions_framework.http
def callback(request):
    """LINE sends every group message here."""
    signature = request.headers.get("X-Line-Signature", "")
    body = request.get_data(as_text=True)

    # 1. Make sure the request really comes from LINE
    if not handler.parser.signature_validator.validate(body, signature):
        return ("Invalid signature", 400)

    # 2. Edited messages have no quoteToken, but the SDK requires one, so add it
    data = json.loads(body)
    for event in data.get("events", []):
        message = event.get("message", {})
        if message.get("type") == "text" and not message.get("quoteToken"):
            message["quoteToken"] = "-"

    # 3. Pass the events on to handle_message() below
    handler.handle(json.dumps(data), signature)
    return "OK"


def party_card(people, change=None):
    """Build a card (Flex Message) listing who is going to the party."""
    rows = []

    # A line showing who changed their mind
    if change:
        rows.append({
            "type": "text",
            "text": f"{change['user_name']} เปลี่ยนใจ: {change['label']}",
            "color": change["color"],
            "size": "sm",
            "wrap": True,
        })

    # One row per person: picture + name (show at most 20 people)
    for person in people[:20]:
        picture = person["picture_url"]
        if picture.startswith("https://"):
            avatar = {"type": "image", "url": picture, "size": "xxs", "flex": 0}
        else:
            avatar = {"type": "text", "text": "👤", "flex": 0}
        rows.append({
            "type": "box",
            "layout": "horizontal",
            "spacing": "md",
            "margin": "md",
            "contents": [
                avatar,
                {"type": "text", "text": person["user_name"], "size": "sm", "wrap": True},
            ],
        })

    count = len(people)
    if count == 0:
        rows.append({"type": "text", "text": "ยังไม่มีผู้เข้าร่วม", "color": "#777777"})
    elif count > 20:
        rows.append({"type": "text", "text": f"และอีก {count - 20} คน", "size": "sm"})

    title = f"ผู้เข้าร่วมทั้งหมด {count} คน"
    card = {
        "type": "bubble",
        "header": {
            "type": "box",
            "layout": "vertical",
            "backgroundColor": "#08A980",
            "contents": [
                {"type": "text", "text": title, "color": "#FFFFFF", "size": "lg", "weight": "bold"}
            ],
        },
        "body": {"type": "box", "layout": "vertical", "contents": rows},
    }
    return FlexMessage(alt_text=title, contents=FlexContainer.from_dict(card))


@handler.add(MessageEvent, message=TextMessageContent)
@handler.add(MessageEditedEvent) 
def handle_message(event):
    """Runs every time someone sends or edits a message in the group."""

    if not isinstance(event.message, TextMessageContent):
        return
    if not isinstance(event.source, GroupSource) or not event.reply_token:
        return

    group_id = event.source.group_id
    user_id = event.source.user_id
    text = event.message.text.strip()

    if text in ("+1", "-1") and user_id:
        # Get the sender's name and picture; use defaults if that fails
        try:
            profile = line_bot_api.get_group_member_profile(group_id, user_id)
            name = profile.display_name
            picture = profile.picture_url or ""
        except Exception:
            name, picture = "สมาชิก", ""

        result = apply_rsvp(
            chat_id=group_id,
            user_id=user_id,
            user_name=name,
            status="in" if text == "+1" else "out",
            message_id=event.message.id,
            timestamp=event.timestamp,
            picture_url=picture,
        )
        if result["status"] != "success":
            return
        card = party_card(result["people"], result["change"])

    else:
        return

    line_bot_api.reply_message(
        ReplyMessageRequest(reply_token=event.reply_token, messages=[card])
    )
