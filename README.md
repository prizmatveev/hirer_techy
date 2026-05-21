# HireTech Platform

Minimal multi-page ATS-style hiring platform built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, Zustand, Prisma/PostgreSQL, and placeholder auth/upload integrations.

## Pages
- `/admin` admin portal landing page
- `/admin/register` admin account creation
- `/admin/login` recruiter/admin sign-in
- `/admin/dashboard` jobs + applications management panel

> This deployment is configured as **admin-only**: non-admin pages are redirected to `/admin/login` on the admin host.

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
