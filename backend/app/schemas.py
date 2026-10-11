from pydantic import BaseModel
from typing import Optional


class AnalyzeTextRequest(BaseModel):
    text: str
    lang: str = "en"


class RedFlag(BaseModel):
    code: str
    explain: str


class EngineInfo(BaseModel):
    rule_score: int
    llm_label: Optional[str] = None
    llm_used: bool = False


class AnalyzeResponse(BaseModel):
    verdict: str
    confidence: float
    scam_type: Optional[str] = None
    red_flags: list[RedFlag]
    what_to_do: list[str]
    explanation: str
    transcript: Optional[str] = None
    engine: EngineInfo