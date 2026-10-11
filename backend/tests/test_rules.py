import json
import sys
from pathlib import Path

# Add backend to path so we can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.rules.engine import run_rules, fuse_verdict


def load_test_data():
    data_path = Path(__file__).parent.parent / "data" / "test_messages.json"
    with open(data_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_scam_messages_detected():
    """Scam messages should have rule_score >= 30."""
    data = load_test_data()
    scams = [m for m in data if m["expected"] == "scam"]

    print(f"\n{'='*60}")
    print(f"TESTING {len(scams)} SCAM MESSAGES")
    print(f"{'='*60}")

    passed = 0
    for msg in scams:
        result = run_rules(msg["text"])
        score = result["rule_score"]
        codes = [m["code"] for m in result["matched_rules"]]
        status = "✅" if score >= 30 else "❌"

        if score >= 30:
            passed += 1

        print(f"{status} ID {msg['id']:2d} | Score: {score:3d} | Rules: {codes}")
        print(f"   Text: {msg['text'][:80]}...")
        print(f"   Type: {msg['type']}")
        print()

    print(f"Scam Detection: {passed}/{len(scams)} passed")
    assert passed >= len(scams) * 0.8, f"Only {passed}/{len(scams)} scams detected!"


def test_safe_messages_not_flagged():
    """Safe messages should have rule_score < 30."""
    data = load_test_data()
    safe = [m for m in data if m["expected"] == "safe"]

    print(f"\n{'='*60}")
    print(f"TESTING {len(safe)} SAFE MESSAGES")
    print(f"{'='*60}")

    passed = 0
    for msg in safe:
        result = run_rules(msg["text"])
        score = result["rule_score"]
        codes = [m["code"] for m in result["matched_rules"]]
        status = "✅" if score < 30 else "❌"

        if score < 30:
            passed += 1

        print(f"{status} ID {msg['id']:2d} | Score: {score:3d} | Rules: {codes}")
        print(f"   Text: {msg['text'][:80]}...")
        print()

    print(f"Safe Pass-Through: {passed}/{len(safe)} passed")
    assert passed >= len(safe) * 0.8, f"Too many false positives! {len(safe)-passed}/{len(safe)}"


def test_otp_safe_context():
    """Legit OTP messages with 'do not share' should NOT trigger ASKS_OTP_PIN."""
    legit_otp = "Your OTP is 482917. Do not share this OTP with anyone."
    result = run_rules(legit_otp)
    codes = [m["code"] for m in result["matched_rules"]]

    print(f"\n{'='*60}")
    print("TESTING OTP SAFE CONTEXT")
    print(f"{'='*60}")
    print(f"Text: {legit_otp}")
    print(f"Matched: {codes}")
    print(f"Score: {result['rule_score']}")

    assert "ASKS_OTP_PIN" not in codes, "Legit OTP message falsely flagged!"
    print("✅ Legit OTP correctly NOT flagged")


def test_otp_scam_detected():
    """Scam OTP requests should trigger ASKS_OTP_PIN."""
    scam_otp = "Send me your OTP immediately to verify your account."
    result = run_rules(scam_otp)
    codes = [m["code"] for m in result["matched_rules"]]

    print(f"\n{'='*60}")
    print("TESTING OTP SCAM DETECTION")
    print(f"{'='*60}")
    print(f"Text: {scam_otp}")
    print(f"Matched: {codes}")
    print(f"Score: {result['rule_score']}")

    assert "ASKS_OTP_PIN" in codes, "Scam OTP request not detected!"
    print("✅ Scam OTP correctly flagged")


def test_fusion_logic():
    """Test the fusion verdict logic."""
    print(f"\n{'='*60}")
    print("TESTING FUSION LOGIC")
    print(f"{'='*60}")

    # High rule score → scam
    r1 = {"rule_score": 80, "matched_rules": [], "is_scam_by_rules": True, "scam_type": "test"}
    v1 = fuse_verdict(r1)
    assert v1["verdict"] == "scam"
    print(f"✅ High rule score → {v1['verdict']} (conf: {v1['confidence']})")

    # Low everything → safe
    r2 = {"rule_score": 10, "matched_rules": [], "is_scam_by_rules": False, "scam_type": None}
    v2 = fuse_verdict(r2, llm_label="safe", llm_used=True)
    assert v2["verdict"] == "safe"
    print(f"✅ Low score + LLM safe → {v2['verdict']} (conf: {v2['confidence']})")

    # Disagreement → suspicious
    r3 = {"rule_score": 20, "matched_rules": [], "is_scam_by_rules": False, "scam_type": None}
    v3 = fuse_verdict(r3, llm_label="scam", llm_used=True)
    assert v3["verdict"] == "suspicious"
    print(f"✅ Disagreement → {v3['verdict']} (conf: {v3['confidence']})")

    print("\nAll fusion tests passed!")


if __name__ == "__main__":
    test_otp_safe_context()
    test_otp_scam_detected()
    test_scam_messages_detected()
    test_safe_messages_not_flagged()
    test_fusion_logic()
    print("\n🎉 ALL TESTS PASSED!")