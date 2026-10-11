from app.rules.patterns import RULES, match_rule


# Hard triggers that immediately mean SCAM regardless of score
HARD_TRIGGERS = {"ASKS_OTP_PIN", "REMOTE_APP"}
COMBO_TRIGGER = {"THREAT_AUTHORITY", "ASKS_PAYMENT"}


def run_rules(text: str) -> dict:
    """
    Run all rules against the text.
    Returns: {
        "rule_score": int (0-100),
        "matched_rules": [{"code": str, "weight": int, "explain": str}],
        "is_scam_by_rules": bool,
        "scam_type": str or None
    }
    """
    matched = []
    total_weight = 0

    for code, config in RULES.items():
        if match_rule(text, config):
            matched.append({
                "code": code,
                "weight": config["weight"],
                "explain": config["description"],
            })
            total_weight += config["weight"]

    rule_score = min(100, total_weight)
    matched_codes = {m["code"] for m in matched}

    # Determine if rules alone say SCAM
    is_scam = False
    scam_type = None

    # Check hard triggers
    if matched_codes & HARD_TRIGGERS:
        is_scam = True

    # Check combo trigger (THREAT_AUTHORITY + ASKS_PAYMENT together)
    if COMBO_TRIGGER.issubset(matched_codes):
        is_scam = True

    # Check score threshold
    if rule_score >= 70:
        is_scam = True

    # Determine scam type from highest-weight matched rule
    if matched:
        top_rule = max(matched, key=lambda m: m["weight"])
        scam_type = top_rule["explain"]

    return {
        "rule_score": rule_score,
        "matched_rules": matched,
        "is_scam_by_rules": is_scam,
        "scam_type": scam_type,
    }


def fuse_verdict(rule_result: dict, llm_label: str | None = None, llm_used: bool = False) -> dict:
    """
    Combine rules engine result with LLM label to produce final verdict.

    Fusion logic:
    - Hard trigger or rule_score >= 70 → SCAM
    - LLM says scam AND rule_score >= 30 → SCAM
    - LLM and rules disagree → SUSPICIOUS
    - Both low → SAFE
    """
    rule_score = rule_result["rule_score"]
    rules_say_scam = rule_result["is_scam_by_rules"]

    verdict = "safe"
    confidence = 0.5

    if rules_say_scam:
        verdict = "scam"
        confidence = 0.7 + (rule_score / 333)  # 0.7 to 1.0

        if llm_used and llm_label == "scam":
            confidence = min(0.99, confidence + 0.1)
        elif llm_used and llm_label == "safe":
            confidence = max(0.6, confidence - 0.15)

    elif llm_used and llm_label == "scam":
        if rule_score >= 30:
            verdict = "scam"
            confidence = 0.75
        else:
            verdict = "suspicious"
            confidence = 0.6

    elif llm_used and llm_label == "suspicious":
        verdict = "suspicious"
        confidence = 0.6

    elif llm_used and llm_label == "safe" and rule_score < 30:
        verdict = "safe"
        confidence = 0.85

    elif rule_score >= 30 and not llm_used:
        verdict = "suspicious"
        confidence = 0.55

    # Cap confidence
    confidence = round(min(0.99, max(0.1, confidence)), 2)

    return {
        "verdict": verdict,
        "confidence": confidence,
    }