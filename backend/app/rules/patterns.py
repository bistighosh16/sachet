import re

# Each rule has:
#   weight: how many points it adds to the scam score
#   description: human-readable explanation
#   patterns: regex list that triggers the rule (ANY match = trigger)
#   safe_patterns: regex list that CANCELS the rule (for legit messages)

RULES = {
    "ASKS_OTP_PIN": {
        "weight": 45,
        "description": "Asks you to share your OTP, PIN, CVV, or password",
        "patterns": [
            # Flexible: matches "send/share/give/tell" ... any words ... "otp/pin/cvv/password"
            r"(?:send|share|give|tell|bhej|bata|de|dikha)\b[^\.\n]*?\b(?:otp|pin|cvv|password|passwd)\b",
            r"\b(?:otp|pin|cvv|password)\b[^\.\n]*?\b(?:send|share|give|tell|bhej|bata|de|dikha|karo|karen|bhejo|chahiye)\b",
            r"(?:otp|pin|cvv)\s*(?:kya\s*h(?:ai)?|batao|bhejo|chahiye)",
            r"अपना?\s*(?:ओटीपी|पिन|पासवर्ड|सीवीवी)\s*(?:भेजें?|शेयर|बताएं?|दे|दिजिए)",
            r"(?:ओटीपी|पिन|पासवर्ड)\s*(?:भेजें?|शेयर\s*करें?|बताएं?|मांग|दीजिए)",
            r"(?:ওটিপি|পিন|পাসওয়ার্ড)\s*(?:পাঠান|শেয়ার\s*করুন|বলুন|দিন)",
            r"(?:otp|pin)\s*(?:par\s*)?(?:verify|confirm)\s*(?:kar|karo|karen)",
        ],
        "safe_patterns": [
            r"(?:do\s*n[o']?t|never|please\s*do\s*n[o']?t)\s*(?:share|disclose|tell|give)",
            r"(?:kisi\s*(?:ko|se)\s*(?:mat|na|nahi)\s*(?:bata|share|de|dena))",
            r"(?:share\s*(?:na\s*karein|mat\s*karo|nahi|mat))",
            r"(?:शेयर\s*न\s*करें|साझा\s*न\s*करें)",
            r"(?:শেয়ার\s*করবেন\s*না)",
            r"(?:confidential|secret|private)",
            r"(?:for\s*your\s*reference|for\s*your\s*records)",
        ],
    },

    "REMOTE_APP": {
        "weight": 45,
        "description": "Asks you to install a remote access app or unknown APK",
        "patterns": [
            r"anydesk",
            r"teamviewer",
            r"quicksupport",
            r"rustdesk",
            r"supremo",
            r"\.apk\b",
            r"install\s*(?:this|the|our|ek)\s*app",
            r"download\s*(?:this|the|our|ek)\s*app",
            r"app\s*(?:install|download)\s*(?:karo|karen|kijiye)",
            r"यह?\s*ऐप\s*(?:इंस्टॉल|डाउनलोड)\s*करें?",
            r"এই\s*অ্যাপ\s*(?:ইনস্টল|ডাউনলোড)\s*করুন",
            r"remote\s*(?:access|control|desktop)",
            r"screen\s*share\s*(?:karo|karen|app)",
        ],
        "safe_patterns": [],
    },

    "THREAT_AUTHORITY": {
        "weight": 35,
        "description": "Threatens with police, CBI, arrest, or government action",
        "patterns": [
            r"(?:police|cbi|ed|enforcement\s*directorate|narcotics|customs)\s*(?:case|complaint|notice|action|arrest|officer)",
            r"digital\s*arrest",
            r"arrest\s*warrant",
            r"(?:fir|complaint)\s*(?:filed|registered|lodged)\s*(?:against|on)",
            r"(?:गिरफ्तार|गिरफ्तारी|थाना|एफआईआर|पुलिस)\s*(?:कर\s*लेंगे|होगी|में|दर्ज)",
            r"(?:পুলিশ|গ্রেপ্তার|থানা|এফআইআর)\s*(?:করা\s*হবে|হবে|মামলা)",
            r"(?:court|judge|magistrate)\s*(?:order|summon|warrant)",
            r"(?:rbi|sebi|trai)\s*(?:notice|action|penalty|fine)",
            r"your\s*(?:aadhar|pan|passport)\s*(?:blocked|suspended|misused)",
            r"(?:आधार|पैन)\s*(?:ब्लॉक|सस्पेंड|बंद)",
        ],
        "safe_patterns": [],
    },

    "URGENCY": {
        "weight": 20,
        "description": "Creates false urgency with deadlines or threats of blocking",
        "patterns": [
            r"within\s*(?:24|48|12|6|2|1)\s*(?:hrs?|hours?|ghante)",
            r"in\s*(?:24|48|12|6|2|1)\s*(?:hrs?|hours?|ghante)",
            r"(?:immediately|urgent|asap|right\s*now|abhi|turant|jaldi|এখনই)",
            r"(?:account|ac)\s*(?:will\s*be|is\s*being)\s*(?:blocked|suspended|frozen|deactivated)",
            r"(?:block|suspend|freeze|deactivate)\s*(?:ho\s*jayega|kar\s*diya|kara\s*jayega)",
            r"(?:ब्लॉक|सस्पेंड|बंद)\s*(?:कर\s*दिया|हो\s*जाएगा|कर\s*देंगे)",
            r"(?:ব্লক|সাসপেন্ড)\s*(?:করে\s*দেওয়া|হবে)",
            r"(?:last|final)\s*(?:warning|notice|chance|reminder)",
            r"(?:आखिरी|अंतिम)\s*(?:चेतावनी|सूचना|मौका)",
        ],
        "safe_patterns": [],
    },

    "LURE_MONEY": {
        "weight": 25,
        "description": "Lures with lottery, prize, cashback, or unexpected money",
        "patterns": [
            r"(?:lottery|prize|jackpot|lucky\s*draw)\s*(?:won|winner|selected)",
            r"(?:cashback|refund|reward)\s*(?:of|amount|credited|mil[ea]ga)",
            r"kbc\s*(?:lottery|prize|winner|selected)",
            r"(?:crore|lakh|million)\s*(?:won|prize|jeet|जीत|জিতেছেন)",
            r"(?:लाख|करोड़)\s*(?:रुपये|जीत|इनाम|प्राप्त)",
            r"(?:লক্ষ|কোটি)\s*(?:টাকা|পুরস্কার|জিতেছেন)",
            r"(?:congratulations|badhai|অভিনন্দন).*(?:selected|won|prize|winner)",
            r"(?:you\s*have\s*(?:been\s*)?selected|aap\s*(?:chune|select)\s*(?:gay[ei]|hain))",
            r"(?:won|win)\s*(?:an?\s*)?(?:iphone|car|bike|cash|money)",
        ],
        "safe_patterns": [],
    },

    "FAKE_KYC_BILL": {
        "weight": 30,
        "description": "Fake KYC expiry, bill disconnection, or SIM block threats",
        "patterns": [
            r"kyc\s*(?:expir|updat|verif|renew|suspend|block|complet)",
            r"(?:electricity|bijli|power|eb)\s*(?:disconnect|cut|block|band|overdue)",
            r"sim\s*(?:block|deactivat|suspend|band)",
            r"(?:बिजली|करेंट)\s*(?:कट|बंद|डिस्कनेक्ट)",
            r"(?:केवाईसी|kyc)\s*(?:अपडेट|एक्सपायर|ब्लॉक|पूरा\s*करें)",
            r"(?:বিদ্যুৎ|কারেন্ট)\s*(?:সংযোগ\s*বিচ্ছিন্ন|বন্ধ)",
            r"(?:gas|lpg)\s*(?:connection|supply)\s*(?:disconnect|block|suspend)",
            r"(?:document|verification)\s*(?:pending|expir|fail)",
        ],
        "safe_patterns": [
            r"visit\s*(?:your\s*)?(?:nearest\s*)?branch",
            r"branch\s*with\s*(?:original\s*)?documents",
            r"शाखा\s*में\s*(?:संपर्क|जाएं)",
            r"ব্রাঞ্চে\s*যোগাযোগ",
        ],
    },

    "SUSPICIOUS_LINK": {
        "weight": 30,
        "description": "Contains suspicious shortened or lookalike URLs",
        "patterns": [
            r"bit\.ly",
            r"tinyurl\.com",
            r"goo\.gl",
            r"t\.co",
            r"is\.gd",
            r"cutt\.ly",
            r"rb\.gy",
            r"\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b",
            r"https?://[^\s]*\.(?:xyz|top|buzz|click|tk|ml|ga|cf|gq)\b",
            r"https?://[^\s]*(?:bank|sbi|hdfc|icici|paytm|upi)[^\s]*\.(?!com|in|org|net)\w+",
            r"click\s*(?:here|this|link|karein|karo|করুন)",
        ],
        "safe_patterns": [],
    },

    "ASKS_PAYMENT": {
        "weight": 30,
        "description": "Asks you to send money, pay a fee, or make a transfer",
        "patterns": [
            r"(?:send|transfer|pay|bhej|deposit)\b[^\.\n]*?\b(?:money|amount|fee|payment|paisa|rupay|funds|taka)\b",
            r"(?:pay|deposit|transfer|send)\b[^\.\n]*?\b(?:fee|charge|charges|processing|registration|tax)\b",
            r"(?:upi|gpay|phonepe|paytm)\s*(?:par|pe|to|se)\s*(?:send|bhej|pay|transfer)",
            r"(?:पैसे|रुपये|शुल्क|फीस)\s*(?:भेजें?|ट्रांसफर|जमा|पे)",
            r"(?:টাকা|ফি)\s*(?:পাঠান|ট্রান্সফার|জমা|দিন)",
            r"(?:processing|registration|tax|gst)\s*(?:fee|charge|amount)",
            r"(?:safe|secure|protection)\s*account",
            r"transfer\s*(?:all\s*)?(?:your\s*)?(?:money|funds)",
        ],
        "safe_patterns": [],
    },

    "IMPERSONATION": {
        "weight": 15,
        "description": "Impersonates a bank, government agency, or authority",
        "patterns": [
            r"(?:sbi|hdfc|icici|axis|pnb|bob|canara)\s*(?:bank\s*)?(?:alert|notice|team|manager|customer\s*care|officer)",
            r"(?:trai|rbi|sebi|meity|gov(?:t|\.in))\s*(?:notice|alert|order|directive)",
            r"(?:from|by)\s*(?:your\s*)?(?:bank|branch|manager)",
            r"(?:भारतीय\s*रिज़र्व\s*बैंक|स्टेट\s*बैंक)\s*(?:सूचना|नोटिस|अलर्ट)",
            r"(?:customer\s*care|helpline|support)\s*(?:calling|speaking|here)",
            r"i\s*am\s*(?:calling|speaking)\s*from\s*(?:bank|sbi|hdfc|icici)",
            r"this\s*is\s*(?:cbi|police|customs|rbi|sbi)",
        ],
        "safe_patterns": [],
    },
}


def match_rule(text: str, rule_config: dict) -> bool:
    """Check if any pattern in a rule matches the text."""
    text_lower = text.lower()

    # First check safe patterns — if any match, this is likely legit
    for safe_pat in rule_config.get("safe_patterns", []):
        if re.search(safe_pat, text_lower, re.IGNORECASE):
            return False

    # Then check scam patterns
    for pattern in rule_config["patterns"]:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True

    return False