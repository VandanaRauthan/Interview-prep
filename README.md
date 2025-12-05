# 🌸🤖 Interview-prep — AI Interview Assistant

---

## 🌸 Introduction  
Built with **Next.js** for UI & backend logic, **Firebase** for authentication and data storage, styled using **TailwindCSS**, and powered by **Vapi voice agents**, **Prepwise** helps you learn how to integrate AI into your apps while preparing for job interviews.

It blends modern UI, voice-based AI, and smooth interactions — giving a futuristic yet calming experience. 🌙✨

---

## ⚙️ Tech Stack 🌸

<p align="center">🌸 ✧ Technologies that power Interview-prep ✧ 🌸</p>

### 💛 Languages  
<p align="center">
  <img src="https://skillicons.dev/icons?i=js,ts" height="48" />
</p>

### 💖 Frameworks & UI  
<p align="center">
  <img src="https://skillicons.dev/icons?i=nextjs,tailwind" height="48" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-000?style=for-the-badge" height="28" />
</p>

### 💚 Backend & Database  
<p align="center">
  <img src="https://skillicons.dev/icons?i=firebase" height="48" />
</p>

### 🌙 AI Tools  
<p align="center">
  <img src="https://img.shields.io/badge/Vapi_AI-000000?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge" />
</p>

<p align="center">🌸 ✦ 🌸 ✦ 🌸</p>

---

## 🔋 Features  

👉 **Authentication:**  
Simple Email/Password auth powered by Firebase.

👉 **Create Interviews:**  
Generate job interviews using **Vapi Voice Agents** + **Google Gemini**.

👉 **AI Feedback:**  
Speak with the AI interviewer & receive instant, detailed insights.

👉 **Modern UI/UX:**  
Clean, minimal, anime-inspired interface for calm productivity.

👉 **Interview Page:**  
Live feedback, transcripts & interactive components.

👉 **Dashboard:**  
Track all your interviews with a beautiful layout.

👉 **Fully Responsive:**  
Works smoothly on laptop, tablet & mobile.

…and many more improvements like code reusability & architectural cleanliness. 🌸

---

## 🤸 Quick Start  

Follow the steps below to run the project locally.

---

### 🌸 Prerequisites  
Ensure you have:

- Git  
- Node.js  
- npm  

---

### 🌸 Cloning the Repository

```bash
git clone https://github.com/VandanaRauthan/Interview-prep
cd Interview-prep
```
---

🌸 Installation

```bash
npm install
```

---

🌸 Environment Variables

Create a file named .env.local in your project root:

```bash
NEXT_PUBLIC_VAPI_WEB_TOKEN=
NEXT_PUBLIC_VAPI_WORKFLOW_ID=

GOOGLE_GENERATIVE_AI_API_KEY=

NEXT_PUBLIC_BASE_URL=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```
Replace placeholders with real Vapi, Firebase & Gemini credentials.

---
🌸 Running the Project
```bash
npm run dev
```

---
Open:
👉 http://localhost:3000

---
🕸️ Snippets (for devs)

globals.css

lib/utils.ts

Generate questions: /app/api/vapi/generate/route.tsx

Generate feedback: lib/actions/general.action.ts

Feedback page: app/(root)/interview/[id]/feedback/page.tsx

Dummy Interviews:

---

<p align="center"> 🌸✨ *Thank you for checking my project — may your interviews be smooth and your confidence bloom!* ✨🌸 </p>
