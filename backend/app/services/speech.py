import tempfile
import os
from app.llm.client import get_groq_client
from app.services.analyzer import analyze_message
from app.schemas import AnalyzeResponse


def transcribe_and_analyze_audio(file_bytes: bytes, filename: str, lang: str = "en") -> AnalyzeResponse:
    """
    1. Saves raw audio bytes to a temporary file
    2. Calls Groq Whisper (whisper-large-v3-turbo) for speech-to-text
    3. Runs the transcript through the Sachet analyzer pipeline
    """
    client = get_groq_client()

    # Get file extension
    ext = os.path.splitext(filename)[1] or ".mp3"

    # Save to temporary file for Groq SDK
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=audio_file,
                response_format="text",
                temperature=0.0
            )

        transcript_text = str(transcription).strip()

        if not transcript_text:
            transcript_text = "No clear speech could be detected in the audio recording."

        # Analyze transcribed text
        response = analyze_message(text=transcript_text, lang=lang)
        response.transcript = transcript_text
        return response

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)