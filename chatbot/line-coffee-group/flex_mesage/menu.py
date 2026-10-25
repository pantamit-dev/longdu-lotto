from linebot.v3.messaging import FlexContainer, FlexMessage, QuickReply

import coffee_shop as shop

STAR_GOLD = "https://developers-resource.landpress.line.me/fx/img/review_gold_star_28.png"
STAR_GRAY = "https://developers-resource.landpress.line.me/fx/img/review_gray_star_28.png"

MENU_CARDS = (
    {
        "item": "เอสเปรสโซ",
        "label": "เอสเพรสโซ",
        "image": "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?fm=jpg&fit=crop&w=800&q=80",
        "blurb": "เข้ม ช็อตเดียว",
        "stars": 5,
        "rating": "4.8",
    },
    {
        "item": "อเมริกาโน",
        "label": "อเมริกาโน่",
        "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?fm=jpg&fit=crop&w=800&q=80",
        "blurb": "ดำ กลมกล่อม",
        "stars": 5,
        "rating": "4.6",
    },
    {
        "item": "ลาเต้",
        "label": "ลาเต้",
        "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?fm=jpg&fit=crop&w=800&q=80",
        "blurb": "นมละมุน",
        "stars": 5,
        "rating": "4.9",
    },
    {
        "item": "คาปูชิโน",
        "label": "คาปูชิโน่",
        "image": "https://images.unsplash.com/photo-1572442388796-11668a67e53d?fm=jpg&fit=crop&w=800&q=80",
        "blurb": "ฟองนมนุ่ม",
        "stars": 5,
        "rating": "4.7",
    },
    {
        "item": "มอคค่า",
        "label": "มอคค่า",
        "image": "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?fm=jpg&fit=crop&w=800&q=80",
        "blurb": "ช็อกโกแลต",
        "stars": 4,
        "rating": "4.5",
    },
    {
        "item": "ชาไทย",
        "label": "ชาไทย",
        "image": "https://images.unsplash.com/photo-1558857563-b371033873b8?fm=jpg&fit=crop&w=800&q=80",
        "blurb": "ชาไทยหอมหวาน",
        "stars": 5,
        "rating": "4.7",
    },
    {
        "item": "ชาเขียว",
        "label": "ชาเขียว",
        "image": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?fm=jpg&fit=crop&w=800&q=80",
        "blurb": "ชาเขียวหอม",
        "stars": 5,
        "rating": "4.6",
    },
    {
        "item": "โกโก้",
        "label": "โกโก้",
        "image": "https://images.unsplash.com/photo-1542990253-a781e04c0082?fm=jpg&fit=crop&w=800&q=80",
        "blurb": "โกโก้เข้มข้น",
        "stars": 5,
        "rating": "4.8",
    },
)


def _menu_bubble(card: dict) -> dict:
    label = card["label"]
    stars = [
        {"type": "icon", "size": "xs", "url": STAR_GOLD if i < card["stars"] else STAR_GRAY}
        for i in range(5)
    ]
    return {
        "type": "bubble",
        "size": "micro",
        "hero": {
            "type": "image",
            "url": card["image"],
            "size": "full",
            "aspectMode": "cover",
            "aspectRatio": "320:213",
            "action": {"type": "message", "label": label, "text": f"สั่ง{card['item']}"},
        },
        "body": {
            "type": "box",
            "layout": "vertical",
            "spacing": "sm",
            "paddingAll": "13px",
            "contents": [
                {"type": "text", "text": label, "weight": "bold", "size": "sm", "wrap": True},
                {
                    "type": "box",
                    "layout": "baseline",
                    "contents": [
                        *stars,
                        {
                            "type": "text",
                            "text": card["rating"],
                            "size": "xs",
                            "color": "#8c8c8c",
                            "margin": "md",
                            "flex": 0,
                        },
                    ],
                },
                {
                    "type": "text",
                    "text": card["blurb"],
                    "wrap": True,
                    "color": "#8c8c8c",
                    "size": "xs",
                },
                {
                    "type": "text",
                    "text": f"{shop.MENU[card['item']]} บาท",
                    "size": "xs",
                    "color": "#6F4E37",
                    "weight": "bold",
                },
            ],
        },
    }


def menu_flex(quick_reply: QuickReply | None = None) -> FlexMessage:
    """Carousel shown when someone asks to see the menu. Tapping a card orders that drink."""
    card = {"type": "carousel", "contents": [_menu_bubble(item) for item in MENU_CARDS]}
    return FlexMessage(
        alt_text=shop.menu_text()[:400],
        contents=FlexContainer.from_dict(card),
        quick_reply=quick_reply,
    )
