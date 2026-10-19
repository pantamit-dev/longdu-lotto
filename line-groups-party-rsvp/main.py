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
    ReplyMessageRequest,
)
from linebot.v3.webhooks import (
    GroupSource,
    MessageEditedEvent,
    MessageEvent,
    TextMessageContent,
)

from rsvp import apply_rsvp, reset

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
    letter = (person.get("user_name") or "ส")[:1]
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


def party_card(people, change=None):
    """Build a card (Flex Message) listing who is going to the party."""
    count = len(people)
    rows = []

    if change:
        rows.append({
            "type": "text",
            "text": f"{change['user_name']} เปลี่ยนใจ: {change['label']}",
            "color": change["color"],
            "size": "sm",
            "wrap": True,
            "margin": "md",
        })

    for person in people[:20]:
        rows.append({
            "type": "box",
            "layout": "horizontal",
            "spacing": "md",
            "alignItems": "center",
            "margin": "lg",
            "contents": [
                _avatar(person),
                {
                    "type": "text",
                    "text": person["user_name"] or "สมาชิก",
                    "weight": "bold",
                    "size": "md",
                    "gravity": "center",
                    "wrap": True,
                },
            ],
        })

    if count == 0:
        rows.append({
            "type": "text",
            "text": "ยังไม่มีผู้เข้าร่วม",
            "size": "sm",
            "color": "#8A8A8A",
            "margin": "md",
        })
    elif count > 20:
        rows.append({
            "type": "text",
            "text": f"และอีก {count - 20} คน",
            "size": "sm",
            "color": "#8A8A8A",
            "margin": "lg",
        })

    title = f"ผู้เข้าร่วมทั้งหมด {count} คน"
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
            "paddingTop": "4px",
            "backgroundColor": "#FFFFFF",
            "contents": rows,
        },
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

    if text == ".":
        reset()
        return

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
