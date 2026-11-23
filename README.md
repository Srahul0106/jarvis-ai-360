# JARVIS AI 360

A free, futuristic browser-based voice-command dashboard. No VS Code installation, API key or paid resource required for its basic features.

## Features
- Glowing sci-fi dashboard with voice controls and light/dark theme
- English and Hindi voice input where browser speech recognition is supported
- Spoken responses (device voices determine language quality)
- Date and time commands
- Open Google, YouTube, GitHub and Gmail
- Optional **trusted** HTTPS AI backend via Settings (JSON POST { "message": "..." } => { "reply": "..." })

## GitHub Pages setup (no code editor needed)
1. Open repository **Settings** → **Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select **main** and **/(root)**, then **Save**.
4. When deployed, use: https://srahul0106.github.io/jarvis-ai-360/

## Limitations
This is a static browser demo, **not** a true general-purpose AI assistant without an AI backend. It cannot control native Windows programs, see local files, read email, or perform autonomous tasks. Speech recognition depends on browser support and may use the browser provider's cloud service. Opening websites may be blocked by popup settings. Do not insert API keys into the page or commit secrets into the repository.

## Security
The optional endpoint is held in page memory only, not committed to GitHub or saved as a browser preference. Only connect a backend you operate and trust. The website does not collect your conversations on its own, but third-party speech and AI endpoints may process them.

## License
MIT.
