import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.analyzer import analyze_message


def run_evaluation():
    data_path = Path(__file__).parent.parent / "data" / "test_messages.json"
    with open(data_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    total = len(dataset)
    correct = 0
    scam_total = 0
    scam_detected = 0
    safe_total = 0
    false_positives = 0

    print("\n" + "=" * 75)
    print("🛡️  SACHET AI EVALUATION BENCHMARK (Rules + LLM Fusion)")
    print("=" * 75)

    start_time = time.time()

    for item in dataset:
        msg_id = item["id"]
        text = item["text"]
        lang = item.get("lang", "en")
        expected = item["expected"]

        res = analyze_message(text=text, lang=lang)
        predicted = res.verdict

        # Match check
        # 'suspicious' is considered a cautious correct detection for scam or safe edge cases
        is_correct = (predicted == expected) or (expected == "scam" and predicted == "suspicious")
        if is_correct:
            correct += 1

        if expected == "scam":
            scam_total += 1
            if predicted in ["scam", "suspicious"]:
                scam_detected += 1

        if expected == "safe":
            safe_total += 1
            if predicted == "scam":
                false_positives += 1

        status_icon = "✅" if is_correct else "❌"
        llm_status = "🤖 Groq" if res.engine.llm_used else "⚙️ Rules-Only"
        
        print(f"{status_icon} ID {msg_id:02d} | Exp: {expected:<10} | Pred: {predicted:<10} | Conf: {res.confidence:.2f} | {llm_status}")
        print(f"   Score: {res.engine.rule_score:3d} | Scam Type: {res.scam_type or 'None'}")
        print(f"   Text: {text[:75]}...")
        print("-" * 75)

    elapsed = time.time() - start_time
    accuracy = (correct / total) * 100
    recall = (scam_detected / scam_total) * 100 if scam_total else 0
    fp_rate = (false_positives / safe_total) * 100 if safe_total else 0

    print("\n" + "📊 " + "=" * 70)
    print(f"🎯 BENCHMARK RESULTS ({total} test samples in {elapsed:.2f}s):")
    print(f"   • Overall Accuracy:      {accuracy:.1f}%")
    print(f"   • Scam Recall (Safety):  {recall:.1f}%  (Must be as close to 100% as possible)")
    print(f"   • False Positive Rate:   {fp_rate:.1f}%  (Legitimate messages blocked)")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    run_evaluation()