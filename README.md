# JARVIS AI 360 — Full Windows Edition

Free Hindi-first AI dashboard with cute animated avatar, voice input/output and optional Ollama-powered chat. **No VS Code needed.**

## Install on Windows
1. Download and install [Ollama](https://ollama.com/download/windows).
2. Open Windows Terminal or CMD and run `ollama pull llama3.2:1b`. This downloads a small local model; choose a larger model if your PC has enough RAM.
3. Install [Python 3](https://www.python.org/downloads/windows/) and check **Add python.exe to PATH** if prompted.
4. Download this repository from **Code → Download ZIP**, extract the ZIP to a normal folder.
5. Double-click **START-JARVIS.bat**. The console prints a **pairing token** and opens http://127.0.0.1:8765/.
6. In JARVIS **Settings**, paste the pairing token, select your installed model and click **Connect**.
7. Test a Hindi question. Voice recognition depends on your browser and microphone permissions. Voice replies depend on Windows installed voices.

## PC control
The app offers **Notepad, Calculator, Paint and File Explorer** only. Each action requires a separate explicit confirmation in the browser. The local companion checks a random session pairing token and binds only to 127.0.0.1. It does not provide arbitrary shell access, delete files, send emails or run commands suggested by AI.

## Security and limitations
- Use **http://127.0.0.1:8765/** for the full version, not GitHub Pages. GitHub Pages is only a static frontend; the companion stays on your Windows PC.
- Never post or screenshot your pairing token.
- Only install software from official sources.
- The companion does not expose its port to the internet.
- Local model inference requires your PC to stay on with Ollama running.
- Browser speech recognition may use cloud services, even when Ollama chat runs locally.
- The cute avatar is CSS illustration, not a 3D model.
- All processing for Ollama chat occurs through your own local server; other browser services may still process voice input.
