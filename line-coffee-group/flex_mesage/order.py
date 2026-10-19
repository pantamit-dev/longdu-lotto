from linebot.v3.messaging import (
    FlexContainer,
    FlexMessage,
    PostbackAction,
    QuickReply,
    QuickReplyItem,
    TextMessage,
)

import coffee_shop as shop


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
                "startColor": "#3B2416",
                "endColor": "#8B5E3C",
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
