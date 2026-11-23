$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
Write-Host "=== JARVIS AI 360 AUTO SETUP ===" -ForegroundColor Cyan
function HasCommand($name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }
function EnsureApp($cmd,$id,$label) {
 if (HasCommand $cmd) { Write-Host "$label already installed"; return }
 Write-Host "Installing $label with winget..."
 if (-not (HasCommand 'winget')) { throw "winget unavailable. Install $label from its official website." }
 winget install --id $id --exact --source winget --accept-package-agreements --accept-source-agreements
 if ($LASTEXITCODE -ne 0) { throw "$label installation failed. Check winget output." }
}
EnsureApp 'ollama' 'Ollama.Ollama' 'Ollama'
if (-not (HasCommand 'python') -and -not (HasCommand 'py')) { EnsureApp 'python' 'Python.Python.3.12' 'Python' }
$ollama = Get-Command ollama -ErrorAction SilentlyContinue
if (-not $ollama) {
 $candidate = Join-Path $env:LOCALAPPDATA 'Programs\Ollama\ollama.exe'
 if (Test-Path $candidate) { $ollama = @{ Source = $candidate } }
}
if (-not $ollama) { throw 'Ollama installed but executable not found. Reopen terminal and run setup again.' }
Write-Host 'Downloading free Ollama model llama3.2:1b...'
& $ollama.Source pull llama3.2:1b
if ($LASTEXITCODE -ne 0) { throw 'Model download failed. Check network connection.' }
$python = Get-Command py -ErrorAction SilentlyContinue
if ($python) { & $python.Source -3 companion.py }
else {
 $python = Get-Command python -ErrorAction SilentlyContinue
 if (-not $python) { throw 'Python installed but not in PATH. Reopen terminal and run setup again.' }
 & $python.Source companion.py
}
