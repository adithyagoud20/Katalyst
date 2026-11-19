# Local server-side provider configuration. Never use NEXT_PUBLIC_ for secrets.
AI_PROVIDER=cloudflare
# AI_MODEL applies to OpenAI's built-in catalog. Cloudflare, Gemini, and OpenRouter models are discovered dynamically.
AI_MODEL=gpt-6-luna
OPENAI_API_KEY=your_api_key_here
GEMINI_API_KEY=your_api_key_here
OPENROUTER_API_KEY=your_api_key_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_API_TOKEN=your_api_key_here

# Optional Google account and cloud snapshot persistence (server and browser publishable configuration).
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
# Used only by the server-side confirmed account deletion route. Never prefix this with NEXT_PUBLIC_.
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
# Admin
KATALYST_ADMIN_EMAILS=admin@example.com

# AI Gateway security
KATALYST_ENCRYPTION_SECRET=your_32_character_or_longer_secret_here

# Brevo - optional for now
BREVO_API_KEY=your_api_key_here
BREVO_SENDER_EMAIL=you@example.com
