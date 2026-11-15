# 📋 Existing Project Audit & Baseline Summary

> **নির্দেশনা**: এই ফাইলটি ডেভেলপারকে নিজে লিখতে হয় না। চলমান কোনো প্রজেক্টে যখন আপনি **কমান্ড ১ (Auto-Discovery)** রান করবেন, তখন **Iron Man** কোডবেস স্ক্যান করে স্বয়ংক্রিয়ভাবে এই ফাইলটি পূরণ করে একটি শক্ত বেসলাইন তৈরি করে রাখবে।

---

## ১. প্রজেক্টের সংক্ষিপ্ত পরিচিতি (Project Overview)
- **প্রজেক্টের নাম**: [Auto-detected]
- **মনোরেপো / সিঙ্গেল রিপো**: [e.g. Monorepo (pnpm workspace) / Standalone App]
- **টেক-স্ট্যাক**:
  - **Frontend**: [e.g. Next.js 14 (App Router) / React Vite / Tailwind CSS]
  - **Backend**: [e.g. NestJS / Express / FastAPI / Django]
  - **Database & ORM**: [e.g. PostgreSQL + Prisma / MongoDB + Mongoose]
  - **Package Manager**: [pnpm / npm / bun / yarn]

---

## ২. বিদ্যমান ডেটাবেজ ও মডেলসমূহ (Database Schemas & Tables)
*বিদ্যমান ডাটাবেজে কোন কোন টেবিল/মডেল সক্রিয় রয়েছে:*
- `User`: Auth, role, credentials.
- `[Other Models]`: [Details]

---

## ৩. বিদ্যমান এপিআই এন্ডপয়েন্টসমূহ (Existing API Endpoints)
*কোন কোন এন্ডপয়েন্ট অলরেডি ইমপ্লিমেন্টেড এবং রেসপন্স স্ট্রাকচার কী:*
- `POST /api/v1/auth/login` — ইউজার অথেন্টিকেশন
- `GET /api/v1/users/me` — কারেন্ট ইউজার প্রোফাইল
- `[Other Endpoints]`: [Details]

---

## ৪. বিদ্যমান ফ্রন্টএন্ড পেজ ও কম্পোনেন্টসমূহ (Frontend Baseline)
*প্রজেক্টে ইতিমধ্যে কী কী পেজ ও ইউআই উপাদান তৈরি আছে:*
- `/login`, `/register`: Auth screens
- `/dashboard`: Main app container
- Component Primitives: `@/components/ui/` (Button, Input, Modal etc.)

---

## ৫. মূল আর্কিটেকচারাল ইনভ্যারিয়েন্ট (Baseline Invariants)
- গ্লোবাল স্টেট কীভাবে হ্যান্ডেল হচ্ছে: [Zustand / Redux / Context]
- এপিআই ক্লায়েন্ট কীভাবে কাজ করছে: [Axios instance / Fetch wrapper with Bearer token]
- এরর রেসপন্স ফরম্যাট: [Envelope details]

---

## ৬. আর্কিটেকচার স্পাইন লিংক
*বিস্তারিত সিস্টেম ইনভ্যারিয়েন্ট দেখতে:* [docs/architecture-spine.md](architecture-spine.md)
