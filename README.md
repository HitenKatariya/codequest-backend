# CodeQuest Backend

Node.js/Express backend API for CodeQuest — a MERN Q&A platform with profiles, friends/teams, Cloudinary uploads, and an AI assistant (server-side proxy).

## Features

- JWT authentication (signup/login)
- Users + profiles + avatar upload (Cloudinary)
- Questions + answers
- Public Space feed with media uploads (Cloudinary)
- Friends + teams
- OTP flows (Twilio)
- AI Assistant endpoints (`/ai/*`) with provider switching (Groq/Gemini/OpenAI) + rate limiting

## Tech stack

- Node.js (recommended: 20.x)
- Express
- MongoDB + Mongoose
- Cloudinary + Multer
- JWT
- Twilio (OTP)

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in this folder.

Example `.env` (use your own values):

```env
# Server
PORT=5050
NODE_ENV=development

# Database
MONGODB_URL=your_mongodb_connection_string

# Auth
JWT_SECRET=your_jwt_secret

# Cloudinary (media + avatars)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Twilio (OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# AI Provider (choose one)
# AI_PROVIDER=openai | gemini | groq
AI_PROVIDER=groq

# Groq
GROQ_API_KEY=your_groq_api_key
# GROQ_MODEL=llama-3.1-8b-instant

# Gemini
# GEMINI_API_KEY=your_gemini_api_key
# GEMINI_MODEL=gemini-1.5-flash

# OpenAI
# OPENAI_API_KEY=your_openai_api_key
# OPENAI_MODEL=gpt-4o-mini
```

3. Run the server:

```bash
npm start
```

For development (auto-reload):

```bash
npm run dev
```

Server runs on `PORT` (default `5050`).

## Environment variables

Important vars:

- `MONGODB_URL`
- `JWT_SECRET`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (OTP)
- **AI provider**
	- `AI_PROVIDER` = `groq` | `gemini` | `openai`
	- Groq: `GROQ_API_KEY` (optional `GROQ_MODEL`)
	- Gemini: `GEMINI_API_KEY` (optional `GEMINI_MODEL`)
	- OpenAI: `OPENAI_API_KEY` (optional `OPENAI_MODEL`)

Security note: never commit `.env` files or API keys.

## Main API routes (high level)

- Auth: `POST /user/signup`, `POST /user/login`
- Users: `GET /user/allusers`, `PATCH /user/update/:id`
- Questions/Answers: `/question`, `/answer`
- Public Space: `/publicspace`
- Friends: `/friends`
- Avatar upload: `/avatar`
- AI Assistant (JWT protected): `/ai/improve-question`, `/ai/generate-answer`, `/ai/suggest-tags`

## Deployment

- Backend: Render
	- Set env vars in Render dashboard
	- Ensure Node version is `20.x` (see `package.json` engines)
- Frontend: Vercel
	- Set `REACT_APP_API_BASE_URL` to your Render backend URL
