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
    ReplyMessageRequest,
)
from linebot.v3.webhooks import (
    GroupSource,
    MessageEditedEvent,
    MessageEvent,
    RoomSource,
    TextMessageContent,
)

import rsvp

load_dotenv()

configuration = Configuration(access_token=os.environ["LINE_CHANNEL_ACCESS_TOKEN"])
_skip_signature: ContextVar[bool] = ContextVar("skip_line_signature", default=False)
handler = WebhookHandler(
    os.environ["LINE_CHANNEL_SECRET"],
    skip_signature_verification=lambda: _skip_signature.get(),
)
line_bot_api = MessagingApi(ApiClient(configuration))


def normalize_webhook(body: str) -> str:
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
        return "สมาชิก", ""
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
        return profile.display_name or "สมาชิก", picture
    except Exception:
        return "สมาชิก", ""


def send(event, messages) -> None:
    if not getattr(event, "reply_token", None):
        return
    line_bot_api.reply_message(
        ReplyMessageRequest(reply_token=event.reply_token, messages=messages)
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


def party_card(people: list[dict], change: dict | None = None) -> FlexMessage:
    count = len(people)
    body: list[dict] = []
    if change:
        body.append(
            {
                "type": "box",
                "layout": "horizontal",
                "backgroundColor": "#F2F3F5",
                "paddingAll": "12px",
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
                        "text": change["label"],
                        "size": "sm",
                        "color": change["color"],
                        "weight": "bold",
                        "margin": "sm",
                        "wrap": True,
                    },
                ],
            }
        )
    for person in people:
        body.append(
            {
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
            }
        )
    if not body:
        body.append(
            {
                "type": "text",
                "text": "ยังไม่มีคนไป",
                "size": "sm",
                "color": "#8A8A8A",
            }
        )
    names = ", ".join(person["user_name"] for person in people) or "ยังไม่มีคนไป"
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
                    "text": f"ผู้เข้าร่วมทั้งหมด {count} คน",
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
    return FlexMessage(
        alt_text=f"ผู้เข้าร่วมทั้งหมด {count} คน\n{names}"[:400],
        contents=FlexContainer.from_dict(bubble),
    )


def reply_rsvp(event, result: dict) -> None:
    if result.get("status") != "success":
        return
    if result["action"] == "declined":
        return
    send(event, [party_card(result["people"], result.get("change"))])


@handler.add(MessageEvent, message=TextMessageContent)
def handle_text_message(event):
    name, picture = member_profile(event.source)
    user_id = getattr(event.source, "user_id", None) or name
    result = rsvp.apply_rsvp(
        chat_id(event.source),
        user_id,
        name,
        event.message.text,
        event.message.id,
        event.timestamp or 0,
        picture,
    )
    reply_rsvp(event, result)


@handler.add(MessageEditedEvent)
def handle_message_edited(event):
    message = event.message
    if getattr(message, "type", None) != "text":
        return
    name, picture = member_profile(event.source)
    user_id = getattr(event.source, "user_id", None) or name
    result = rsvp.apply_rsvp(
        chat_id(event.source),
        user_id,
        name,
        message.text,
        message.id,
        event.timestamp or 0,
        picture,
    )
    reply_rsvp(event, result)
