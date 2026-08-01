# Business Thrive — Contact Form Backend

A small Node.js/Express API with one job: receive contact-form submissions
from the Business Thrive website and automatically email the client's
details to **paroksh@businessthrive.in** — no manual step, no visitor
action needed.

## What it does

- `POST /api/contact` — accepts `{ name, company, email, phone, need, message }`,
  validates it, and sends a formatted email via SMTP.
- `GET /api/health` — simple uptime check.
- Rate-limited (10 submissions / 15 min / IP) and has a honeypot field to
  cut down spam.

## 1. Local setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env with your real SMTP credentials
npm start
```

Server runs on `http://localhost:5000` by default. Test it:

```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Lead","company":"Acme Inc","email":"test@acme.com","phone":"1234567890","need":"AI Automation","message":"Hello"}'
```

You should get an email at paroksh@businessthrive.in within a few seconds.

## 2. Gmail setup (if using Gmail to send)

Gmail blocks your normal password for this. You need an **App Password**:

1. Turn on 2-Step Verification on the sending Google account.
2. Go to https://myaccount.google.com/apppasswords
3. Generate a 16-character app password.
4. Put that in `SMTP_PASS` in `.env` (not your real Gmail password).

You can send *to* `paroksh@businessthrive.in` from any Gmail account — the
sending account doesn't have to be that inbox itself.

## 3. Deploy it (so the live website can reach it)

Pick any Node host. Two easy free-tier options:

**Render**
1. Push this `backend/` folder to a GitHub repo.
2. New → Web Service → connect the repo.
3. Build command: `npm install`, Start command: `npm start`.
4. Add the same variables from `.env` under Environment.
5. Deploy — you'll get a URL like `https://business-thrive-backend.onrender.com`.

**Railway**
1. New Project → Deploy from GitHub repo.
2. Add the environment variables.
3. Railway gives you a public URL automatically.

## 4. Point the website at it

In `business-thrive-website.html`, set:

```js
const BACKEND_URL = "https://your-deployed-backend-url.com";
```

(Find this constant near the top of the contact-form script.) Once set,
the form will POST there and send silently — no mailto fallback needed
unless the request fails, in which case it still falls back to opening
the visitor's email app so no lead is ever lost.

## Notes

- CORS is restricted to `ALLOWED_ORIGINS` in `.env` — set this to your real
  domain before going live, otherwise anyone could point traffic at your
  backend.
- If you'd rather not run/maintain a server at all, a hosted form service
  (Formspree, EmailJS) does the same job with zero infrastructure — this
  backend is the "own it yourself" option.
