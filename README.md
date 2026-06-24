# Focura

A gamified productivity ecosystem built for the ADHD brain. Quests, boss battles, consistency shields, a pet that grows with you — and zero shame.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** — dark-first design system
- **Supabase** — auth, Postgres with RLS
- **GSAP** — landing page animations

## Getting started

```bash
npm install
cp .env.example .env.local   # add your Supabase keys
npm run dev
```

Apply the database schema by running `supabase/migrations/0001_core_schema.sql` in the Supabase SQL editor.

## Structure

- `/` — public landing page (GSAP)....
- `/login` — auth
- `/app` — the Focura shell: Dashboard, Mastery Paths, Contracts, Focus Timer, Tasks, Challenges, Stats, Rewards, AI Coach, Focus Memory, Music

## Roadmap

Each module is specced in the [issue tracker](https://gitlab.com/ankushsinghv771-group/focura/-/issues) — see issues #1 through #12.
