# Tixora assistant

The existing `app/jarvis.py`, desktop interface and `start-jarvis.bat` are kept as reference. They are **not** imported or started by Tixora. They contain desktop command execution, file modification and shared personal memory that must not be exposed to app users.

Tixora reuses the Qwen3 4B GGUF model through a private llama.cpp inference server. Laravel sends only the user's question, up to six recent chat messages, built-in app guidance and a small public catalog sample. There are no model tools, private user/booking queries, filesystem operations or command execution. Navigation buttons are built by Laravel and checked against known routes in each client. Model text is rendered as text, not HTML or executable instructions.

## Local startup

The existing model and installed llama-server were successfully tested. A random API key was generated in the ignored `backend/storage/app/private/assistant-api-key.txt` file and configured in the local backend/.env. No API key belongs in React or Expo variables.

1. Start your Laravel backend and React/Expo app normally.
2. From a trusted terminal in the project root, run `./AI/start-tixora-ai.ps1`. If your PowerShell policy blocks unsigned scripts, run the llama-server command below directly (do not weaken a managed execution policy):

```powershell
llama-server -m "AI/models/hub/models--Qwen--Qwen3-4B-GGUF/blobs/7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5" --alias tixora --host 127.0.0.1 --port 8081 --ctx-size 8192 --parallel 1 --jinja --reasoning-budget 0 --api-key-file backend/storage/app/private/assistant-api-key.txt --cors-origins localhost --no-webui --no-slots --no-agent
```

3. Confirm backend/.env has ASSISTANT_ENABLED=true, ASSISTANT_URL=http://127.0.0.1:8081/v1/chat/completions, ASSISTANT_MODEL=tixora and ASSISTANT_API_KEY matching that private key file. Reload Laravel configuration if cached.
4. Open Chat / AI Assist. Answers marked “AI assistant” come from Qwen; “Help guide (AI unavailable)” is the built-in fallback when disabled, busy, unavailable or timed out.

On another machine, generate a new long random server key, store it privately and configure both services with it. Model weights, desktop memory, virtual environments and generated keys are excluded from Git. Transfer model weights separately when approved; do not commit gigabytes of model files.

## Professor's server

The Windows desktop launcher is not a Linux deployment service. Run a compatible llama-server under the professor's service manager or a separate private container, with the GGUF model mounted read-only. Keep the model port off the public internet. Set the backend's ASSISTANT_URL to the internal reachable service URL ending in /v1/chat/completions. Container localhost refers to that container, not the host. Configure private networking rather than assuming the Windows localhost URL works in Docker. CPU/RAM/GPU capacity and Linux service startup have not been tested here.

Chat is read-only. It cannot book, pay, cancel, refund, upload, change accounts or grant roles. Users perform those actions through the normal authenticated screens. AI answers are approximate; the current listing and booking page remain the source of truth. Conversations are kept in client memory, not saved to application database/files. The local model processes messages in memory; avoid request-body logging on any reverse proxy or replacement provider.

Requests are limited to 1,000 characters and six prior messages, throttled per client, and a shared cache lock bounds model concurrency. Ensure a shared Laravel cache store across backend instances. More traffic needs capacity planning and abuse monitoring, not removing these limits.

References: [llama.cpp server](https://github.com/ggml-org/llama.cpp/tree/master/tools/server), [Expo ImagePicker](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/).
