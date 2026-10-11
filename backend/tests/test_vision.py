import sys
from pathlib import Path
from unittest.mock import Mock

# Add backend to path so tests can import app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.schemas import AnalyzeResponse, EngineInfo
from app.services import vision


def test_screenshot_retries_ocr_with_more_sensitive_settings(monkeypatch):
    reader = Mock()
    reader.readtext.side_effect = [
        [],
        [([(0, 0), (1, 0), (1, 1), (0, 1)], "Verify your account", 0.9)],
    ]
    analyzer_result = AnalyzeResponse(
        verdict="suspicious",
        confidence=0.8,
        red_flags=[],
        what_to_do=[],
        explanation="Check the message carefully.",
        engine=EngineInfo(rule_score=20),
    )
    analyze_message = Mock(return_value=analyzer_result)
    monkeypatch.setattr(vision, "get_ocr_reader", lambda lang: reader)
    monkeypatch.setattr(vision, "analyze_message", analyze_message)

    result = vision.analyze_screenshot(b"image-bytes")

    assert reader.readtext.call_count == 2
    assert reader.readtext.call_args_list[1].kwargs == {
        "text_threshold": 0.55,
        "low_text": 0.3,
        "link_threshold": 0.3,
        "mag_ratio": 1.5,
    }
    analyze_message.assert_called_once_with(
        text="Verify your account",
        lang="en",
    )
    assert result.transcript == "Verify your account"


def test_screenshot_skips_ocr_retry_when_initial_pass_finds_text(monkeypatch):
    reader = Mock()
    reader.readtext.return_value = [
        ([(0, 0), (1, 0), (1, 1), (0, 1)], "Account alert message", 0.9)
    ]
    analyzer_result = AnalyzeResponse(
        verdict="safe",
        confidence=0.9,
        red_flags=[],
        what_to_do=[],
        explanation="No scam indicators found.",
        engine=EngineInfo(rule_score=0),
    )
    analyze_message = Mock(return_value=analyzer_result)
    monkeypatch.setattr(vision, "get_ocr_reader", lambda lang: reader)
    monkeypatch.setattr(vision, "analyze_message", analyze_message)

    result = vision.analyze_screenshot(b"image-bytes")

    reader.readtext.assert_called_once_with(b"image-bytes")
    assert result.transcript == "Account alert message"


def test_ocr_reader_uses_separate_supported_language_models(monkeypatch):
    monkeypatch.setattr(vision, "_readers", {})
    reader = Mock()
    create_reader = Mock(return_value=reader)
    monkeypatch.setattr(vision.easyocr, "Reader", create_reader)

    assert vision.get_ocr_reader("en") is reader
    assert vision.get_ocr_reader("hi") is reader
    assert vision.get_ocr_reader("bn") is reader
    assert vision.get_ocr_reader("hi") is reader

    assert create_reader.call_args_list[0].args == (["en"],)
    assert create_reader.call_args_list[1].args == (["hi", "en"],)
    assert create_reader.call_args_list[2].args == (["bn", "en"],)
    assert create_reader.call_count == 3
