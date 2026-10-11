from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import AnalyzeTextRequest, AnalyzeResponse
from app.services.analyzer import analyze_message
from app.services.speech import transcribe_and_analyze_audio
from app.services.vision import analyze_screenshot

app = FastAPI(
    title="Sachet API",
    description="Multilingual AI Fraud & Scam Detection Engine (Text, Image, Voice)",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Sachet AI", "version": "1.0.0"}


@app.post("/api/analyze/text", response_model=AnalyzeResponse)
def analyze_text(payload: AnalyzeTextRequest):
    return analyze_message(text=payload.text, lang=payload.lang)


@app.post("/api/analyze/image", response_model=AnalyzeResponse)
async def analyze_image(
    file: UploadFile = File(...),
    lang: str = Form("en")
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    
    file_bytes = await file.read()
    return analyze_screenshot(
        file_bytes=file_bytes,
        mime_type=file.content_type,
        lang=lang
    )


@app.post("/api/analyze/voice", response_model=AnalyzeResponse)
async def analyze_voice(
    file: UploadFile = File(...),
    lang: str = Form("en")
):
    file_bytes = await file.read()
    return transcribe_and_analyze_audio(
        file_bytes=file_bytes,
        filename=file.filename or "recording.mp3",
        lang=lang
    )