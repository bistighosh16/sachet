import os
import json
from dotenv import load_dotenv
from groq import Groq
from app.llm.prompts import SYSTEM_PROMPT, build_user_prompt

load_dotenv()

_client = None

# Active models on your Groq key
MODELS_TO_TRY = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
]

def get_groq_client():
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables!")
        _client = Groq(api_key=api_key)
    return _client


def call_llm_analyzer(text: str, lang: str = "en", rule_hints: list[str] | None = None) -> dict | None:
    """
    Calls Groq in JSON mode using your active models.
    Returns parsed dict or None if calls fail (graceful degradation).
    """
    client = get_groq_client()
    user_prompt = build_user_prompt(text, lang, rule_hints or [])

    for model in MODELS_TO_TRY:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=1024,
            )

            raw_content = response.choices[0].message.content
            
            # Clean potential markdown formatting
            cleaned = raw_content.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            data = json.loads(cleaned)
            return data

        except Exception as e:
            # Try next model if any issue
            continue

    print("[LLM ERROR] All Groq models failed. Falling back to rules engine.")
    return None