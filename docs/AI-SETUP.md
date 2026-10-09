# Hosted Tixora assistant

The website and mobile app call Laravel's assistant endpoint. Laravel calls the model provider. You do not need to keep your local model server or computer running when using a hosted provider.

Create a Groq account at https://console.groq.com and generate an API key. Use its Free plan for initial testing; requests are subject to account and model rate limits. Add these values to the Tixora backend's Render Environment settings:

```dotenv
ASSISTANT_ENABLED=true
ASSISTANT_URL=https://api.groq.com/openai/v1/chat/completions
ASSISTANT_MODEL=openai/gpt-oss-20b
ASSISTANT_API_KEY=YOUR_PRIVATE_GROQ_KEY
```

Replace the placeholder privately in Render. Never put the key into Vercel, frontend/mobile files or Git. Save the settings and redeploy the backend after pushing the updated code to main. Open Tixora Chat and ask a question about bookings. AI replies have mode `ai`; when disabled, busy or unavailable, the backend responds with built-in help and mode `guide`.

Chat messages, the last six history messages and a small public catalog sample are sent to the provider. Account records, payment secrets and database credentials are not sent. The model cannot execute commands, create bookings or confirm payments. Do not submit private account or payment information in chat.

This setup uses Groq's existing chat completions API. The local-server-only request option was removed to avoid hosted-provider validation errors. A successful local mocked test does not verify your real provider key or quota.

References: https://console.groq.com/docs/api-reference and https://console.groq.com/docs/rate-limits
