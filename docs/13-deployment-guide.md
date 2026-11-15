# 🚀 Deployment & Local Execution Guide (Owtlet — single Next.js app)

এই গাইডটি আপনার সম্পূর্ণ Fullstack অ্যাপ্লিকেশন (Frontend, Backend, Database) লোকাল মেশিনে রান করা এবং ক্লাউড প্ল্যাটফর্মে (Vercel, Railway, Docker VPS) সহজে ডেপ্লয় করার প্রটোকল প্রদান করে।

> **Owtlet note**: Frontend ও Backend একটাই Next.js অ্যাপ (`development/frontend/`, API = `/api/*` Route Handlers)। আলাদা NestJS backend নেই। Production টার্গেট = ক্লায়েন্টের Linux VPS-এ Docker Compose + Nginx (`owtlet.com`)। বিস্তারিত: [12-deployment-plan.md](12-deployment-plan.md)।

---

## 🛠️ ১. লোকাল ডেভেলপমেন্ট (Local Run Guide)

Avengers রিপোজিটরিতে তৈরি স্ক্রিপ্টের মাধ্যমে আপনি খুব সহজেই এক ক্লিকে বা আলাদাভাবে প্রজেক্ট রান করতে পারবেন:

### ক. প্রিপারেশন (Environment Setup)
প্রথমে রুট ডিরেক্টরিতে `.env` কনফিগার করুন:
```bash
cp .env.example .env
bash scripts/sync-env.sh
```

### খ. সহজে লোকাল রান (One-Command Runner)
রুট ডিরেক্টরি থেকে সরাসরি `scripts/run-local.sh` চালান:

1. **Frontend রান করতে (Next.js - http://localhost:3000):**
   ```bash
   bash scripts/run-local.sh frontend
   ```
2. **Backend API:** আলাদা কিছু রান করতে হবে না — একই Next.js অ্যাপে `http://localhost:3000/api` (Route Handlers)। ডাটাবেস মাইগ্রেশন:
   ```bash
   cd development/frontend && pnpm prisma migrate dev && pnpm prisma db seed
   ```
3. **পুরো স্ট্যাক একসাথে ডকার দিয়ে রান করতে (PostgreSQL + Next.js app [+ Redis optional]):**
   ```bash
   cd infrastructure/docker
   docker compose up -d
   ```

---

## ☁️ ২. গিটহাব থেকে প্রোডাকশন ডেপ্লয়মেন্ট (Deployment Guide)

আপনার গিটহাব রিপোজিটরিতে সম্পূর্ণ টেমপ্লেট (`development/`, `docs/`, `planning/`, `.agents/`) সংরক্ষিত থাকবে। ডেপ্লয় করার সময় প্ল্যাটফর্মগুলোকে কেবল তাদের নির্দিষ্ট ফোল্ডার চিনিয়ে দিতে হবে:

### ক. Frontend Deployment (Vercel / Netlify)
- **GitHub Repo কানেক্ট করার পর Vercel Dashboard-এ:**
  - **Framework Preset**: Next.js
  - **Root Directory**: `development/frontend` *(সবচেয়ে গুরুত্বপূর্ণ)*
  - **Build Command**: `npm run build`
  - **Output Directory**: `.next`
  - **Environment Variables**:
    - `DATABASE_URL`, `AGE_COOKIE_SECRET`, `ADMIN_SESSION_SECRET`, `SHOPPER_SESSION_SECRET`, `IP_HASH_SALT`, `CONFIRMATION_LINK_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_TERRIFIC_STORE_ID`, `NEXT_PUBLIC_TERRIFIC_EMBEDDING_ID`, `SMTP_*` (API same-origin `/api`, so no separate `NEXT_PUBLIC_API_URL`; full list in root `.env.example`)

> ⚠️ **Owtlet**: Production = client VPS (section গ below), not Vercel. Vercel only optionally for previews.

> 💡 **নোট**: `Root Directory` হিসেবে `development/frontend` দিয়ে দেওয়ার কারণে Vercel শুধুমাত্র ফ্রন্টএন্ড কোড ক্লোন ও বিল্ড করবে। গিটহাবের বাকি প্ল্যানিং বা ডক ফাইল ফ্রন্টএন্ডের স্পেস বা বিল্ড টাইমে প্রভাব ফেলবে না।

---

### খ. Backend API Deployment
> **Owtlet: N/A** — backend Next.js অ্যাপের ভেতরেই (`/api`), আলাদা ডেপ্লয় নেই। টেমপ্লেটের `development/backend` (NestJS) ফোল্ডার মুছে ফেলা হয়েছে (ADR-015)।

---

### গ. VPS / Cloud Server (Docker Compose)
আপনি যদি Hetzner, AWS EC2, বা DigitalOcean-এ পুরো প্রজেক্ট একসাথে ডেপ্লয় করতে চান:
```bash
git clone <your-github-repo-url>
cd jhorton777   # Owtlet repo
cp .env.example .env
# .env ফাইলে প্রোডাকশন ক্রেডেনশিয়াল আপডেট করুন
# Owtlet: DATABASE_URL, AGE_COOKIE_SECRET, ADMIN_SESSION_SECRET, NEXT_PUBLIC_TERRIFIC_* ...
# DNS: owtlet.com + owtlet.live A records -> VPS IP (client, Q-003); Nginx + Let's Encrypt SSL
# owtlet.live -> 301 https://owtlet.com (infrastructure/nginx/nginx.conf)

cd infrastructure/docker
docker compose -f docker-compose.yml up -d --build
```
> 💡 আমরা `.dockerignore` সেট করেছি, যার ফলে `docs/`, `planning/`, `.agents/` ডকার ইমেজের সাইজ বাড়াবে না।

---

## 🤖 ৩. এজেন্টদের সাথে অটো-ডেপ্লয়মেন্ট প্রটোকল (Agent Command)

ভবিষ্যতে যদি আপনি এখান থেকেই এজেন্টকে দিয়ে সরাসরি ডেপ্লয় করাতে চান, আপনি সরাসরি চ্যাটে নিচের মতো নির্দেশ দিতে পারেন:

> *"Ultron, `docs/13-deployment-guide.md` অনুযায়ী আমাদের প্রোডাকশন ডকার ইমেজ এবং CI/CD পাইপলাইন কনফিগার করো এবং ডেপ্লয়মেন্ট ভেরিফাই করো।"*

এজেন্ট `ultron` (DevOps & Infrastructure Specialist) স্বয়ংক্রিয়ভাবে:
1. `infrastructure/docker/` এবং `.dockerignore` যাচাই করবে।
2. গিটহাব অ্যাকশনস CI/CD পাইপলাইন কনফিগার করবে।
3. কোনো ভারী অপ্রয়োজনীয় ফাইল ছাড়া ক্লিন ইমেজ বিল্ড নিশ্চিত করবে।

