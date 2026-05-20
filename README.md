# HireTech Platform

Minimal multi-page ATS-style hiring platform built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Zustand, Prisma/PostgreSQL, and placeholder auth/upload integrations.

## Pages
- `/` homepage with category filtering, jobs list, and ATS sections
- `/jobs/[id]` job details with sticky apply sidebar
- `/apply/[jobId]` application form inspired by provided layouts
- `/admin/login`, `/admin/dashboard` recruiter panel

## Setup
1. `npm install`
2. `cp .env.example .env`
3. `npx prisma generate`
4. `npm run dev`

## Features
- Role-based admin middleware
- Job/application API routes
- Responsive design + subtle hover animations
- Resume upload field + validation placeholders
- Schema models for `User`, `Job`, `Application`, `AdminNotes`
