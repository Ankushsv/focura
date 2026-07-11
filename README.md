# Focura: Gamified ADHD Productivity Platform

Focura is a gamified productivity ecosystem designed specifically to support individuals with ADHD in managing tasks, focus, and consistency. By utilizing tailored productivity workflows, Focura translates key tools into engaging, highly-visual components that help reduce cognitive load and overcome executive dysfunction.

---

## 📊 Core Modules & Features

* **Dashboard**: A centralized hub showcasing daily progress metrics, a quick-start onboarding checklist, active objectives, and a visual progress ring tracking daily task completions.
* **Task Manager**: An advanced task list allowing items to be filtered by required cognitive energy levels (Low, Medium, High) to minimize decision paralysis. Includes task chains, critical focus markers, and a full-screen **Rescue Mode** (calming reset layout) when feeling stuck or overwhelmed.
* **Focus Timer**: A Pomodoro-style interactive focus timer equipped with ambient soundscapes, structured transition screens, and customizable focus parameters to prevent burnout.
* **Mastery Paths**: Visual node-based roadmap tracking for professional goals and long-term skill progression.
* **Consistency Tracker**: Streak-tracking systems featuring a visual activity shield, custom activity contribution heatmaps, and a progress indicator.
* **Companion System**: A virtual pet system providing positive reinforcement and motivation through levels and progression points earned by completing tasks.
* **AI Coach**: An integrated assistant powered by LLMs (Cerebras) that breaks down complex tasks into digestible subtasks to prevent task paralysis.
* **Ambient Sound Studio**: A Web Audio mixer where users can combine and customize background ambient music tracks for improved focus.
* **Analytics & Rewards**: Detailed historic progress logs and a virtual points store where users can redeem earned rewards to reinforce daily habits.
* **Interactive Landing Page**: A cinematic landing page built with SVG elements, GSAP scroll triggers, and Three.js 3D rendering.

---

## 🛠️ Tech Stack

* **Framework**: [Next.js 14](https://nextjs.org/) (App Router) + [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) (custom themes and styling rules extended)
* **3D & WebGL**: [Three.js](https://threejs.org/) / `@types/three` for immersive 3D canvas objects
* **Animations**: [GSAP (GreenSock)](https://greensock.com/) + [Framer Motion](https://www.framer.com/motion/) for micro-interactions and transitions
* **State Management**: [Zustand](https://zustand.docs.pmnd.rs/) for client-side state hooks
* **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL Database, Supabase Auth with Row Level Security, SSR integration)
* **Drag-and-Drop**: [@dnd-kit](https://dnd-kit.com/) for reordering tasks and quests
* **Iconography**: [Tabler Icons React](https://tabler.io/icons) for clean, cohesive UI iconography

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and configure your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
CEREBRAS_API_KEY=your_cerebras_api_key_for_ai_sage
```

### 3. Apply Database Migrations
Deploy the database schema to your Supabase PostgreSQL instance by running the migrations inside `supabase/migrations/` in order:
1. `0001_core_schema.sql` (Profiles, XP, focus sessions, paths, and companions)
2. `0002_tasks.sql` (Tasks, subtasks, and task chains)
3. `0003_custom_mixes.sql` (Ambient sound mix records)
4. `20240601_timeline.sql` (Timeline and session history blocks)
5. `20260624_add_pauses_to_timeline_blocks.sql` (Pause states inside timeline blocks)
6. `20260624_add_profile_settings.sql` (User profile preferences)
7. `20260624_add_status_to_contracts.sql` (Consistency tracker metrics)
8. `20260707_user_app_events.sql` (System event telemetry logs)

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Repository Structure

```
├── .agent/              # Workflow scripting
├── .agents/             # Agent specializations
├── .gsd/                # GSD Canonical Spec, Roadmap, and State files
├── docs/                # Developer guides and runbooks
├── public/              # Soundscapes and static assets
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── app/         # Core application shell
│   │   │   ├── coach/     # AI Coach (task decomposition)
│   │   │   ├── contracts/ # Consistency Tracker (streak heatmap)
│   │   │   ├── music/     # Soundscape Player (background noise controls)
│   │   │   ├── paths/     # Mastery Paths (habit/skill trees)
│   │   │   ├── rewards/   # Rewards Store (gamification shop)
│   │   │   ├── stats/     # Stats/Logs (user progress logs)
│   │   │   ├── tasks/     # Task Board
│   │   │   └── timer/     # Focus Timer
│   │   ├── login/       # Authentication page
│   │   └── page.tsx     # Animated landing page
│   ├── components/      # UI components (widgets & layouts)
│   ├── hooks/           # Custom React hooks (e.g. Stuck Detection)
│   └── lib/             # Shared libraries (Supabase client, utils)
└── supabase/            # DB migrations and triggers
```

---

## 🛡️ ADHD-Specific UX Mechanics
* **Energy-Adaptive Lists**: Filter tasks by mental energy requirements (Low, Medium, High) to bypass decision paralysis.
* **AI Task Breakdown**: Instantly chunk massive tasks into bite-sized sub-tasks using Cerebras AI models.
* **Rescue Mode**: A shame-free escape hatch overlay providing breathing exercises and soundscapes to help get unstuck.
* **Visual Momentum**: Progression rings, heatmaps, and leveling companions build immediate positive feedback loops.
