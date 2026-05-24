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


## Admin-only mode
- `ADMIN_ONLY_MODE=true` (default): only `/admin/*` and `/api/admin/*` are served; all other routes redirect to `/admin/login`.
- `ADMIN_ONLY_MODE=false`: disables admin-only locking.
- `ADMIN_APP_HOST` (optional): set this to your exact admin domain (example: `admin.yourdomain.com` or `your-project.vercel.app`) to scope locking to one host.
- If your platform requires a value (like Vercel UI), use `*` (or `any` / `all`) to mean “no host restriction” (apply admin-only mode on all hosts).
- `0`, `false`, `null`, and `undefined` are also treated as “unset” for backward compatibility.


## Neon + Vercel production checklist
- Prisma reads `DATABASE_URL` exactly (see `prisma/schema.prisma`).
- In Vercel, set `DATABASE_URL` without wrapping quotes in the value field.
- Build command should run migrations before Next build: `prisma migrate deploy && prisma generate && next build`.
- Admin auth routes run on Node.js runtime and allow up to 30s max duration for cold-start/database latency.


### Fix for Neon P2021 (`public.User` does not exist)
This repository currently has no `prisma/migrations` folder, so `prisma migrate deploy` has nothing to apply in a fresh production database.
Use schema sync in deploy builds:
- Build command: `prisma db push && prisma generate && next build`
This creates/updates the Prisma tables (`User`, `Job`, `Application`, `AdminNotes`) in Neon before the app starts serving API routes.
