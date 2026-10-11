from app.rules.engine import run_rules, fuse_verdict
from app.llm.client import call_llm_analyzer
from app.schemas import AnalyzeResponse, RedFlag, EngineInfo

# Fallback advice if LLM is unavailable
DEFAULT_WHAT_TO_DO = {
    "en": {
        "scam": [
            "Do NOT click any links or download any attachments.",
            "Never share your OTP, PIN, password, or CVV with anyone.",
            "If money was lost or threatened, call 1930 or report at cybercrime.gov.in immediately."
        ],
        "suspicious": [
            "Verify the message by calling the official customer care number from the official website.",
            "Do not share personal details or OTP until verified.",
            "When in doubt, report to the 1930 cyber helpline."
        ],
        "safe": [
            "This message looks safe, but always remain vigilant.",
            "Remember: Banks and official agencies will NEVER ask for your OTP or PIN.",
            "Never install screen-sharing apps on anyone's request."
        ]
    },
    "hi": {
        "scam": [
            "किसी भी लिंक पर क्लिक न करें और कोई फ़ाइल डाउनलोड न करें।",
            "अपना ओटीपी, पिन या पासवर्ड कभी किसी के साथ शेयर न करें।",
            "यदि धोखाधड़ी हुई है, तो तुरंत 1930 पर कॉल करें।"
        ],
        "suspicious": [
            "संदेश की पुष्टि केवल आधिकारिक वेबसाइट पर दिए गए नंबर से करें।",
            "पुष्टि होने तक कोई भी व्यक्तिगत जानकारी या ओटीपी न दें।",
            "संदेह होने पर 1930 साइबर हेल्पलाइन पर संपर्क करें।"
        ],
        "safe": [
            "यह संदेश सुरक्षित प्रतीत होता है, फिर भी सतर्क रहें।",
            "याद रखें: बैंक या सरकारी अधिकारी कभी भी आपका ओटीपी या पिन नहीं मांगते।",
            "किसी के कहने पर कभी भी स्क्रीन-शेयरिंग ऐप इंस्टॉल न करें।"
        ]
    },
    "bn": {
        "scam": [
            "কোনো লিংকে ক্লিক করবেন না বা কোনো ফাইল ডাউনলোড করবেন না।",
            "আপনার ওটিপি, পিন বা পাসওয়ার্ড কখনোই কারো সাথে শেয়ার করবেন না।",
            "টাকা খোয়া গেলে বা হুমকির সম্মুখীন হলে অবিলম্বে ১৯৩০ নম্বরে কল করুন।"
        ],
        "suspicious": [
            "অফিসিয়াল ওয়েবসাইট থেকে নম্বর নিয়ে সরাসরি যোগাযোগ করে নিশ্চিত হন।",
            "যাচাই না করে কোনো ব্যক্তিগত তথ্য বা ওটিপি দেবেন না।",
            "সন্দেহ হলে ১৯৩০ জাতীয় সাইবার হেল্পলাইনে যোগাযোগ করুন।"
        ],
        "safe": [
            "এই বার্তাটি নিরাপদ বলে মনে হচ্ছে, তবে সর্বদা সতর্ক থাকুন।",
            "মনে রাখবেন: ব্যাংক কখনোই আপনার ওটিপি বা পিন জানতে চাইবে না।",
            "কারো অনুরোধে স্ক্রিন-শেয়ারিং অ্যাপ ডাউনলোড করবেন না।"
        ]
    }
}


def analyze_message(text: str, lang: str = "en") -> AnalyzeResponse:
    """
    Master pipeline:
    1. Run regex rules engine
    2. Call LLM with rules context (wrapped safely)
    3. Fuse rules + LLM outputs
    4. Provide fallback explanations if LLM is offline
    """
    # 1. Rules Engine
    rule_res = run_rules(text)
    matched_codes = [m["code"] for m in rule_res["matched_rules"]]
    
    # 2. LLM Layer
    llm_res = call_llm_analyzer(text, lang=lang, rule_hints=matched_codes)
    llm_used = llm_res is not None
    llm_label = llm_res.get("verdict") if llm_used else None
    
    # 3. Fusion
    fusion = fuse_verdict(rule_res, llm_label=llm_label, llm_used=llm_used)
    final_verdict = fusion["verdict"]
    confidence = fusion["confidence"]
    
    # 4. Red Flags
    red_flags = []
    if llm_used and "red_flags" in llm_res and llm_res["red_flags"]:
        for rf in llm_res["red_flags"]:
            red_flags.append(RedFlag(code=rf.get("code", "FLAG"), explain=rf.get("explain", "")))
    else:
        for r in rule_res["matched_rules"]:
            red_flags.append(RedFlag(code=r["code"], explain=r["explain"]))

    # 5. What To Do list
    lang_key = lang if lang in DEFAULT_WHAT_TO_DO else "en"
    if llm_used and "what_to_do" in llm_res and isinstance(llm_res["what_to_do"], list) and llm_res["what_to_do"]:
        what_to_do = llm_res["what_to_do"]
    else:
        what_to_do = DEFAULT_WHAT_TO_DO[lang_key].get(final_verdict, DEFAULT_WHAT_TO_DO[lang_key]["safe"])

    # 6. Explanation
    if llm_used and "explanation" in llm_res and llm_res["explanation"]:
        explanation = llm_res["explanation"]
    else:
        if final_verdict == "scam":
            explanation = f"Detected high-risk scam indicators: {', '.join(matched_codes) if matched_codes else 'Suspicious patterns'}."
        elif final_verdict == "suspicious":
            explanation = "This message contains unusual or unverified claims. Proceed with caution."
        else:
            explanation = "This message does not appear to contain known fraud patterns. Never share sensitive credentials."

    # 7. Scam Type
    scam_type = None
    if llm_used and llm_res.get("scam_type"):
        scam_type = llm_res["scam_type"]
    elif rule_res.get("scam_type"):
        scam_type = rule_res["scam_type"]

    return AnalyzeResponse(
        verdict=final_verdict,
        confidence=confidence,
        scam_type=scam_type,
        red_flags=red_flags,
        what_to_do=what_to_do,
        explanation=explanation,
        engine=EngineInfo(
            rule_score=rule_res["rule_score"],
            llm_label=llm_label,
            llm_used=llm_used
        )
    )