# 🛡️ Sachet

**Paste it, snap it, or say it. Sachet tells you if a message is a scam, why, and what to do next, in your own language.**

Built for **Hack for Social Cause** · Innovate for Bharat · Viksit Bharat Young Leaders Dialogue 2027
Team: **Solo Sentinel**

🔗 **Live demo:** https://sachet-umber.vercel.app/
🎥 **Demo video:** [VIDEO_LINK_HERE]

---

## The problem

Digital fraud in India is growing fastest among the people least equipped to spot it: elderly citizens, first-time smartphone users and people who read mainly in regional languages. Scammers send fake KYC-expiry, electricity-disconnection, lottery, UPI-refund and "digital arrest" messages that create panic and push victims to share OTPs or click malicious links.

Most scam-awareness tools are English-only, assume technical vocabulary, and only help people who already suspect fraud. By the time a victim realises, the money is often gone.

## What Sachet does

A user gives Sachet a suspicious message in any of three ways and gets back a clear verdict in **Bengali, Hindi or English**:

| Input | How it works |
|---|---|
| ✍️ **Paste text** | Up to 5,000 characters |
| 📷 **Upload a screenshot** | Compressed in the browser, then text is extracted with EasyOCR |
| 🎤 **Record a voice note** | Up to 60 seconds, transcribed with Groq Whisper (`whisper-large-v3-turbo`) |

The result card shows:
- a **verdict**: Scam / Suspicious / Looks safe
- **why**: the specific red flags, in plain language
- **what to do now**: simple numbered steps
- one-tap buttons to **call 1930** (National Cyber Crime Helpline) and report on [cybercrime.gov.in](https://cybercrime.gov.in)

## How it works (hybrid design)

Sachet does not rely on the LLM alone. A rules engine and an LLM each analyse the message, and a fusion step combines them.

```
Input (text / screenshot / voice)
        │
   Normalize → screenshot: OCR  |  voice: Whisper transcription
        │ plain text
   ┌────┴─────────────────┐
   │                      │
 Rules engine         Groq LLM
 (regex + keywords,   (structured JSON:
  multi-script)        label + reasoning)
   │                      │
   └────────┬─────────────┘
         Fusion → final verdict
            │
        JSON → React UI
```

**Why hybrid?**
- Rules are fast, free, explainable and testable.
- The LLM handles context and language that rules miss.
- If the LLM is unavailable or returns malformed output, the rules engine still produces a verdict (graceful degradation).
- When rules and LLM disagree, Sachet chooses **Suspicious**: when unsure, it warns.
- Sachet never says a message is "100% safe." Safe results carry a standing reminder not to share OTPs, PINs or passwords.

The rules engine understands the difference between a *genuine* bank alert ("your OTP is 4821, do not share it") and a *scam request* ("send me your OTP").

Message text is treated as untrusted data in the LLM prompt, so instructions hidden inside a scam message are not followed.

More detail: [docs/architecture.md](docs/architecture.md)

## Privacy

- **No database, no accounts, no stored messages.** Everything is processed in memory and discarded by Sachet.
- To analyse a message, its text (or audio) **is sent to Groq's API**. Sachet does not store it, but you should not paste information you would not want processed by a third-party AI service.

## Evaluation

Tested on **[N] messages** ([X] scam, [Y] legitimate, [Z] ambiguous) in English, Hindi, Bengali and mixed-language text.

| Metric | Result |
|---|---|
| Scam recall (scams correctly flagged) | [__]% |
| False-positive rate (legit messages wrongly flagged) | [__]% |
| Overall accuracy | [__]% |

**Known failures:** [list the messages Sachet gets wrong and why]

Reproduce the numbers:

```bash
cd backend
python tests/eval.py
```

> This is a small test set and results will vary on real-world messages. Treat the numbers as a baseline, not a guarantee.

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Axios
- **Backend:** FastAPI, Python 3.11, Pydantic
- **AI:** Groq API (LLM and Whisper speech-to-text), EasyOCR

## Run it locally

**Prerequisites:** Node.js 18+, Python 3.11, a [Groq API key](https://console.groq.com)

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
```

Create `backend/.env` (see `backend/.env.example`):

```
GROQ_API_KEY=your_api_key_here
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

## Project structure

```
sachet/
├── backend/
│   ├── app/            # FastAPI app, rules engine, LLM client, services
│   ├── tests/          # unit tests and eval script
│   ├── data/           # sample test messages
│   └── requirements.txt
├── frontend/           # React + Vite app
├── docs/               # architecture and screenshots
├── README.md
└── LICENSE
```

## Limitations

- The LLM can be wrong, and quality varies across languages, especially for dialects and mixed-script text.
- OCR and speech recognition accuracy drops with blurry screenshots, strong accents or background noise.
- Sachet **helps you decide, but is not proof.** A "Looks safe" result does not guarantee a message is genuine.
- It checks the message content only. It does not verify phone numbers, senders or websites against live databases.

## Future scope

- WhatsApp bot so people can forward messages directly
- More Indian languages
- Listen-aloud results for people who cannot read
- Community-reported scam patterns, with privacy safeguards

## AI usage disclosure

This project was built with AI assistance. [Fill in honestly: for example, planning and architecture discussion, code review and debugging, UI design guidance, and README drafting with Claude (Anthropic). The Groq-hosted models are also part of the running product. Estimated share of AI-assisted work: __%.]

## Disclaimer

Sachet is an educational and preventative tool, not a substitute for law enforcement. If you are a victim of cyber fraud in India, call the **National Cyber Crime Helpline at 1930** immediately or report at [cybercrime.gov.in](https://cybercrime.gov.in).

## License

MIT, see [LICENSE](LICENSE).

---

Made by Vivi · Team Solo Sentinel
