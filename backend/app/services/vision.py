import easyocr
from fastapi import HTTPException
from app.services.analyzer import analyze_message
from app.schemas import AnalyzeResponse

_readers = {}
_ocr_languages = {
    "en": ["en"],
    "hi": ["hi", "en"],
    "bn": ["bn", "en"],
}


def get_ocr_reader(lang: str = "en"):
    if lang not in _readers:
        languages = _ocr_languages[lang]
        print(f"[OCR INIT] Initializing local EasyOCR engine ({', '.join(languages)})...")
        _readers[lang] = easyocr.Reader(languages, gpu=False)
    return _readers[lang]


def analyze_screenshot(file_bytes: bytes, mime_type: str = "image/png", lang: str = "en") -> AnalyzeResponse:
    """
    1. Passes screenshot bytes directly to local EasyOCR engine
    2. Extracts English, Hindi, or Bengali text
    3. Runs extracted text through Sachet analyzer pipeline
    """
    try:
        reader = get_ocr_reader(lang)
        # Read text from raw image bytes
        results = reader.readtext(file_bytes)
        
        # Combine detected text blocks
        extracted_text = " ".join([text for (_, text, prob) in results if prob > 0.15])
        if len(extracted_text.strip()) < 5:
            results = reader.readtext(
                file_bytes,
                text_threshold=0.55,
                low_text=0.3,
                link_threshold=0.3,
                mag_ratio=1.5,
            )
            extracted_text = " ".join(
                [text for (_, text, prob) in results if prob > 0.15]
            )
        print(f"[OCR SUCCESS] Extracted text: '{extracted_text[:100]}...'")

    except Exception as e:
        print(f"[OCR ERROR] Failed to read image: {e}")
        raise HTTPException(
            status_code=400,
            detail="Could not process image file. Please upload a clear PNG or JPG screenshot."
        )

    if not extracted_text or len(extracted_text.strip()) < 5:
        raise HTTPException(
            status_code=400,
            detail="Could not read clear text from this screenshot. Please try pasting the message text directly."
        )

    # Pass extracted text into Sachet's master analyzer pipeline
    res = analyze_message(text=extracted_text, lang=lang)
    res.transcript = extracted_text
    return res