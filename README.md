# English Learning Tools

A collection of AI-powered applications designed to enhance English language learning through advanced sentence analysis and scientific vocabulary retention.

## 🚀 Projects Overview

This repository contains multiple specialized tools, each focused on a different aspect of English mastery:

### 1. English Logic Flow Analyzer (`/analyze`)
A web-based tool that deconstructs complex English sentences into logical chunks, simulating the linear reading process of a native speaker.
- **Key Features**: Linear visualization, mental note tracking for expectations/reactions, and color-coded logic tags.
- **Tech Stack**: Python, Flask, Gemini API, Tailwind CSS.
- **Quick Start**: Run `start.bat` in the `/analyze` directory.

### 2. Vocabulary Builder & FSRS Scheduler (`/words/project`)
A full-stack application for mastering vocabulary using the FSRS (Free Spaced Repetition Scheduler) algorithm and AI-generated context.
- **Key Features**: FSRS-based review scheduling, Gemini-powered immersive story generation for target words, CEFR difficulty leveling, and integrated TTS.
- **Tech Stack**: Next.js (App Router), TypeScript, Prisma, tRPC, PostgreSQL, Gemini API.
- **Quick Start**: Run `启动项目.bat` in the `/words/project` directory (requires Node.js and PostgreSQL).

---

## 🛠 Prerequisites

- **Python 3.10+** (for Analyze tool)
- **Node.js 18+** & **npm** (for Vocabulary Builder)
- **PostgreSQL** (for Vocabulary Builder database)
- **Gemini API Key**: Required for all AI features.

## ⚙️ Configuration

1. **API Keys**: Set your Gemini API key in the respective project configurations (`app.py` for Analyze, `.env` for Words).
2. **Database**: Configure your `DATABASE_URL` in `/words/project/.env`.

## 📂 Directory Structure

```text
.
├── analyze/          # Sentence logic analysis tool (Flask)
├── words/
│   ├── project/      # Main vocabulary application (Next.js)
│   └── mvp_draft/    # Early prototypes and word processing scripts
├── GEMINI.md         # Detailed AI-context and dev conventions
└── LICENSE           # Apache License 2.0
```

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
