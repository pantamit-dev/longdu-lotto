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
    JoinEvent,
    LeaveEvent,
    MemberJoinedEvent,
    MemberLeftEvent,
    MessageEditedEvent,
    MessageEvent,
    PostbackEvent,
    TextMessageContent,
    UnsendEvent,
)


load_dotenv()

handler = WebhookHandler(os.environ["LINE_CHANNEL_SECRET"])
line_bot_api = MessagingApi(ApiClient(Configuration(access_token=os.environ["LINE_CHANNEL_ACCESS_TOKEN"])))


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

def reply_text(reply_token: str, text: str) -> None:
    if not reply_token:
        return
    line_bot_api.reply_message(
        ReplyMessageRequest(
            reply_token=reply_token,
            messages=[TextMessage(text=text[:5000])],
        )
    )


# 1. Message Event - a member sends a message
@handler.add(MessageEvent, message=TextMessageContent)
def handle_message(event):
    if event.source.type != "group":
        return
    text = event.message.text.strip()
    group_id = event.source.group_id
    user_id = getattr(event.source, "user_id", None)
    reply = None

    # Get group chat summary
    if text == "ข้อมูลกลุ่ม":
        group = line_bot_api.get_group_summary(group_id)
        reply = f"ชื่อกลุ่ม: {group.group_name}"

    # Get number of group members
    elif text == "จำนวนสมาชิก":
        members = line_bot_api.get_group_members_count(group_id)
        reply = f"สมาชิกทั้งหมด {members.count} คน"

    # Get group member profile
    elif text == "โปรไฟล์ฉัน" and user_id:
        profile = line_bot_api.get_group_member_profile(group_id, user_id)
        reply = f"ชื่อ: {profile.display_name}"

    if reply:
        reply_text(event.reply_token, reply)


# 2. Message Edit Event - a member edits a message
# The SDK only applies the message= filter to MessageEvent, so check the type here
@handler.add(MessageEditedEvent, message=TextMessageContent)
def handle_message_edited(event):
    print(f"Edited message ID: {event.message.id}")
    print(f"New text: {event.message.text}")


# 3. Unsend Event - a member unsends a message
@handler.add(UnsendEvent)
def handle_unsend(event):
    print(f"Unsent message ID: {event.unsend.message_id}")


# 4. Join Event - the bot joins a group chat
@handler.add(JoinEvent)
def handle_join(event):
    reply_text(event.reply_token, "สวัสดีค่ะ ขอบคุณที่ให้น้อง Bot เข้าร่วม Group Chat💚")


# 5. Leave Event - the bot leaves a group chat
@handler.add(LeaveEvent)
def handle_leave(event):
    print(f"Bot left group: {event.source.group_id}")


# 6. Member Joined Event - a new member joins the group
@handler.add(MemberJoinedEvent)
def handle_member_joined(event):
    reply_text(event.reply_token, "ยินดีต้อนรับสมาชิกใหม่ค่ะ 🎉")


# 7. Member Left Event - a member leaves the group
@handler.add(MemberLeftEvent)
def handle_member_left(event):
    for member in event.left.members:
        print(f"Member left: {member.user_id}")


# 8. Postback Event - a member taps a postback button
@handler.add(PostbackEvent)
def handle_postback(event):
    data = event.postback.data
    print(f"Postback data: {data}")
