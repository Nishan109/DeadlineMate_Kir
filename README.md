# DeadlineMate Landing Page

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/mincreaft-s-projects/v0-deadline-mate-landing-page)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/YRZZORdzfiv)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19
- **Language/Types**: TypeScript 5
- **Styling/UI**: Tailwind CSS 3, PostCSS, Autoprefixer, tailwindcss-animate, Radix UI, lucide-react, Geist
- **Theming**: next-themes
- **Forms/Validation**: react-hook-form, zod, @hookform/resolvers
- **Auth/Backend**: Supabase (supabase-js, auth-helpers-nextjs, @supabase/ssr)
- **Date/Time**: date-fns, react-day-picker
- **Charts/Visuals**: recharts, embla-carousel-react
- **UX utilities**: clsx, class-variance-authority, tailwind-merge, sonner, cmdk, vaul, uuid
- **Config/Build**: next.config.mjs, tailwind.config.ts
- **Misc**: Public service worker (`public/sw.js`), SQL migrations in `scripts/`

## Learning Roadmap (Basics)

- **Week 1: Web, TypeScript, React**
  - [ ] HTML/CSS/JS refresh (DOM, Flexbox/Grid, fetch)
  - [ ] TypeScript basics (types, interfaces, unions, `tsconfig`)
  - [ ] React components, props/state, effects, lists/keys, controlled inputs
  - **Outcome**: Simple Todos in React+TS (local state)

- **Week 2: Next.js + Tailwind**
  - [ ] App Router: `app/` routing, layouts, server vs client components
  - [ ] Data fetching in server components, simple API route
  - [ ] Tailwind utilities, responsive, dark mode via `class`
  - **Outcome**: Rebuild Todos in Next.js + Tailwind

- **Week 3: UI, Forms, Validation**
  - [ ] Radix primitives: dialog, dropdown, toast; theming with `next-themes`
  - [ ] `react-hook-form` basics, validation with `zod` + resolvers
  - **Outcome**: Create/Edit Todo dialog with validation + toast

- **Week 4: Supabase + Extras**
  - [ ] Supabase project, `.env`, table, RLS basics, CRUD with `supabase-js`
  - [ ] Auth sessions with `@supabase/auth-helpers-nextjs`; protect a page
  - [ ] Date input with `react-day-picker`, formatting with `date-fns`
  - [ ] Small `recharts` bar chart; use `clsx`, `tailwind-merge`, `cva`
  - **Outcome**: Persist Todos, auth-gated, due dates, simple chart

### Reference Docs
- Next.js: https://nextjs.org/docs
- Tailwind: https://tailwindcss.com/docs
- Radix UI: https://www.radix-ui.com/primitives
- React Hook Form: https://react-hook-form.com
- Zod: https://zod.dev
- Supabase: https://supabase.com/docs
- date-fns: https://date-fns.org
- Recharts: https://recharts.org/en-US

## Deployment

Your project is live at:

**[https://vercel.com/mincreaft-s-projects/v0-deadline-mate-landing-page](https://vercel.com/mincreaft-s-projects/v0-deadline-mate-landing-page)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/YRZZORdzfiv](https://v0.dev/chat/projects/YRZZORdzfiv)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
