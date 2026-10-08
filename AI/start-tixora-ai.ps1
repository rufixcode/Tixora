param([string]$ModelPath = (Join-Path $PSScriptRoot 'models/hub/models--Qwen--Qwen3-4B-GGUF/blobs/7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5'))
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $ModelPath -PathType Leaf)) { throw 'Model not found. Supply -ModelPath with your GGUF path.' }
$KeyPath = Join-Path $PSScriptRoot '../backend/storage/app/private/assistant-api-key.txt'
if (-not (Test-Path -LiteralPath $KeyPath -PathType Leaf)) { throw 'Configure a private assistant API key first; see AI/README.md.' }
# Inference only: do not launch jarvis.py or its desktop command tools.
& llama-server -m $ModelPath --alias tixora --host 127.0.0.1 --port 8081 --ctx-size 8192 --parallel 1 --jinja --reasoning-budget 0 --api-key-file $KeyPath --cors-origins localhost --no-webui --no-slots --no-agent
