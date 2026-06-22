# AI Creator Platform (Creatr)

A full-stack AI-powered content creation and publishing platform where creators write, enhance, and publish blog-style posts, grow an audience, and track engagement — all in one place.

---

## Project Overview

| Field | Details |
|-------|---------|
| **Project Name** | AI Creator Platform (package: `ai-creator-platform`; UI brand: **Creatr**) |
| **Purpose** | Content creation and publishing platform with AI assistance, social features, and analytics |
| **Main Problem Solved** | Creators need a single place to create content with AI, manage drafts/publishing, upload/transform images, build a public profile, and measure performance — without stitching together separate tools |

---

## Tech Stack

### Frontend

| Technology | Why It Is Used | Where It Is Used |
|------------|----------------|------------------|
| **Next.js 16 (App Router)** | Full-stack React framework with routing, SSR, API routes, Turbopack | `app/`, `proxy.js`, `app/api/` |
| **React 19** | UI component library | All `.jsx` components and pages |
| **Turbopack** | Faster dev builds | `npm run dev` |
| **Tailwind CSS 4** | Utility-first styling | `app/globals.css`, all components |
| **Radix UI** | Accessible headless UI primitives | `components/ui/` |
| **shadcn/ui** | Composable UI on Radix + CVA | `components.json`, `components/ui/` |
| **Lucide React** | Icons | Dashboard, headers, post cards, editor |
| **React Hook Form + Zod** | Form validation | Post editor, settings, image modal |
| **React Quill** | Rich text WYSIWYG editor | `post-editor-content.jsx` |
| **React Dropzone** | Drag-and-drop uploads | `image-upload-modal.jsx` |
| **React Chart.js 2** | Analytics charts | `daily-views-chart.jsx` |
| **React Intersection Observer** | Infinite scroll | `feed/page.jsx` |
| **Sonner** | Toast notifications | Global in `layout.js` |
| **next-themes** | Dark/light theme | `theme-provider.jsx` |
| **date-fns** | Relative timestamps | Dashboard, post cards |

### Backend

| Technology | Why It Is Used | Where It Is Used |
|------------|----------------|------------------|
| **Convex** | Real-time serverless backend | `convex/` — users, posts, feed, likes, comments, follows, dashboard |
| **Next.js Server Actions** | Secure server-side AI calls | `app/actions/gemini.js` |
| **Next.js API Routes** | Server-side image upload | `app/api/imagekit/upload/route.js` |
| **proxy.js (Clerk middleware)** | Route protection | Protects `/dashboard(.*)` |

### Database

| Technology | Purpose | Data Stored |
|------------|---------|-------------|
| **Convex** | Primary real-time document database | Users, posts, comments, likes, follows, daily analytics |

**Tables (`convex/schema.js`):**

| Table | Data Stored |
|-------|-------------|
| `users` | Name, email, Clerk token, profile image, username, timestamps |
| `posts` | Title, HTML content, draft/published status, tags, category, featured image, scheduling, view/like counts |
| `comments` | Post comments, approval status |
| `likes` | Post likes linked to users |
| `follows` | Follower/following relationships |
| `dailyStats` | Per-post daily view counts for analytics charts |

### Authentication

| Technology | Authentication Flow |
|------------|---------------------|
| **Clerk** | User signs in via Clerk → JWT issued → `ConvexProviderWithClerk` passes auth to Convex → `useStoreUser` syncs user to Convex → `proxy.js` protects `/dashboard/*` |

### APIs & Integrations

| Service | Purpose | How It Works |
|---------|---------|--------------|
| **Google Gemini AI** | AI blog generation and content improvement | Server Actions call `gemini-2.5-flash-lite` (generate) and `gemini-1.5-flash` (enhance/expand/simplify) |
| **ImageKit** | Image upload, CDN, transformations | Upload via `/api/imagekit/upload` → CDN URLs → transformations in `lib/imagekit.js` |
| **Clerk** | Auth and session management | `@clerk/nextjs` provider + middleware |
| **Convex** | Database + real-time API | Client hooks call `api.*` queries/mutations |
| **Unsplash** | Landing page photos only | Hardcoded URLs in `app/page.js` (env key present but unused in code) |

> **Note:** `NEXT_PUBLIC_SUPABASE_*` and `NEXT_PUBLIC_UNSPLASH_ACCESS_KEY` exist in `.env` but are **not used** in the codebase.

### Cloud & Deployment

| Platform | Purpose |
|----------|---------|
| **Convex Cloud** | Hosted backend/database |
| **Clerk Cloud** | Hosted authentication |
| **ImageKit Cloud** | Image CDN and transformations |
| **Google AI (Gemini)** | AI content generation |
| **Vercel (implied)** | Standard Next.js deployment target — no `vercel.json` or CI/CD in repo |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Linting (`eslint.config.mjs`) |
| **PostCSS + Tailwind** | CSS processing |
| **npm scripts** | `dev`, `build`, `start`, `lint` |

---

## Architecture Flow

```
User (Browser)
    ↓
Next.js Frontend (React App Router)
    ↓
Clerk Authentication (sign-in / JWT)
    ↓
ConvexClientProvider (Convex + Clerk bridge)
    ↓
┌─────────────────────────────────────────────────────┐
│  Convex queries/mutations (real-time)               │
│  OR Server Actions (Gemini AI)                      │
│  OR API Route (ImageKit upload)                     │
└─────────────────────────────────────────────────────┘
    ↓
Convex Backend Functions (convex/*.js)
    ↓
Convex Database
    ↓
Real-time response → React UI re-renders
```

**Protected route flow:**
```
Request to /dashboard/* → proxy.js (Clerk) → no userId? → sign-in redirect → authenticated → dashboard
```

**AI content flow:**
```
Editor "Generate" → Server Action (generateBlogContent) → Gemini API → HTML → React Quill → Convex draft/publish
```

**Image upload flow:**
```
Drop image → POST /api/imagekit/upload (Clerk auth) → ImageKit CDN → URL → featured image or Quill embed
```

---

## Complete Workflow

```
User
 ↓
Visit Landing Page (/)
 ↓
Sign Up / Sign In (Clerk)
 ↓
User Synced to Convex (useStoreUser)
 ↓
Redirect to Feed (/feed)
 ↓
Set Username (/dashboard/settings)  ← required before publishing
 ↓
Dashboard (/dashboard)
 ↓
Create Post (/dashboard/create)
 ↓
┌──────────────────────────────────────┐
│  Add Title                           │
│  Upload/Transform Image (ImageKit)   │
│  Write Content (React Quill)         │
│  AI Generate / Enhance (Gemini)      │
│  Set Tags, Category, Schedule        │
└──────────────────────────────────────┘
 ↓
Save Draft → Convex (status: draft)
    OR
Publish → Convex (status: published)
 ↓
Public Post at /{username}/{postId}
 ↓
Feed / Trending / Profile display post
 ↓
Readers: View → Like → Comment
 ↓
Creator Dashboard (views, likes, comments, followers, charts)
 ↓
Followers grow via Follow system
 ↓
Repeat content creation cycle
```

---

## User Perspective

### Registration / Login
- Visit `/` or click Sign In / Sign Up
- Clerk handles auth; after sign-in → redirected to `/feed`
- App syncs Clerk user into Convex via `useStoreUser`

### Dashboard Routes
| Route | Feature |
|-------|---------|
| `/dashboard` | Analytics overview |
| `/dashboard/create` | Rich text post editor |
| `/dashboard/posts` | Manage drafts and published posts |
| `/dashboard/followers` | Audience management |
| `/dashboard/settings` | Username setup |

### Public Routes
| Route | Feature |
|-------|---------|
| `/feed` | Content discovery feed |
| `/{username}` | Creator public profile |
| `/{username}/{postId}` | Individual published post |

### Content Creation Flow
1. Set username in **Settings** (required)
2. Go to **Create Post**
3. Add title, featured image, rich text content
4. Use **AI Generate** or **Enhance / Expand / Simplify**
5. Configure tags, category, schedule
6. **Save Draft** (auto-saves every 30s) or **Publish**

### AI Features
| Feature | Description |
|---------|-------------|
| AI Blog Generation | Full HTML post from title + category + tags |
| Content Enhancement | Improve readability and structure |
| Content Expansion | Add depth and examples |
| Content Simplification | Make content more concise |
| Image Transformations | Crop, smart focus, background removal, text overlay via ImageKit |

### Social & Engagement
- Follow creators from feed or profiles
- Like and comment on published posts
- View counts tracked per post + daily stats for charts

---

## Developer Perspective

### Folder Structure

```
ai-creator-platform/
├── app/
│   ├── (auth)/                   # Clerk sign-in/sign-up
│   ├── (public)/                 # Feed & public profiles
│   │   ├── feed/
│   │   └── [username]/           # Profile + post pages
│   ├── actions/                  # Server Actions (Gemini AI)
│   ├── api/imagekit/upload/      # Image upload API
│   ├── dashboard/                # Protected creator dashboard
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Landing page
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/Radix primitives
│   ├── post-editor*.jsx          # Editor system
│   ├── post-card.jsx
│   ├── header.jsx
│   └── convex-client-provider.jsx
├── convex/                       # Convex backend
│   ├── schema.js
│   ├── users.js, posts.js, feed.js, ...
│   └── auth.config.js
├── hooks/                        # useStoreUser, useConvexQuery
├── lib/                          # Utils, imagekit, marketing data
├── public/                       # logo.png, banner.png, placeholder.png
└── proxy.js                      # Clerk route protection
```

### State Management
- **Convex reactive queries** (`useConvexQuery`)
- **React Hook Form** for editor/settings
- **Local React state** for UI (modals, tabs)
- **Clerk hooks** (`useUser`, `useAuth`) for auth

### API Calls

| Type | Example |
|------|---------|
| Convex query | `useConvexQuery(api.feed.getFeed)` |
| Convex mutation | `useConvexMutation(api.posts.create)` |
| Server Action | `generateBlogContent()` |
| REST API route | `fetch("/api/imagekit/upload")` |

### Environment Variables

| Variable | Used For |
|----------|----------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client |
| `CLERK_SECRET_KEY` | Clerk server |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex ↔ Clerk JWT |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Clerk routing |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk routing |
| `NEXT_PUBLIC_CONVEX_URL` | Convex client |
| `GEMINI_API_KEY` | Google Gemini AI |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit upload |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit upload |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit CDN |

---

## Feature Breakdown

| Feature | Purpose | User Benefit | Technical Implementation |
|---------|---------|--------------|--------------------------|
| Landing Page | Marketing & onboarding | Understand value before signup | `app/page.js` + `lib/data.js` |
| Clerk Auth | Secure login/signup | Trusted authentication | Clerk + `proxy.js` |
| User Sync | Mirror Clerk user in DB | Seamless identity | `useStoreUser` → `convex/users.store` |
| Username Profiles | Public creator identity | Shareable profile URLs | `users.updateUsername`, `/[username]` |
| Rich Text Editor | Content authoring | Professional writing | React Quill |
| AI Generation | Auto-write from title | Saves writing time | Gemini Server Actions |
| AI Improvement | Enhance/expand/simplify | Better content quality | `improveContent` → Gemini |
| Draft System | Save in progress | Never lose content | `status: "draft"`, 30s auto-save |
| Publishing | Make content public | Reach audience | `status: "published"` |
| Image Upload | Media for posts | Visual content | ImageKit API route |
| Image Transformations | Crop, overlay, BG removal | Polished visuals | `lib/imagekit.js` |
| Content Feed | Discover posts | Stay updated | `convex/feed.getFeed` |
| Trending | Popular content | Find engaging posts | `convex/feed.getTrendingPosts` |
| Follow System | Social graph | Build audience | `convex/follows.js` |
| Likes & Comments | Engagement | Community interaction | `convex/likes.js`, `convex/comments.js` |
| View Analytics | Track readership | Performance insights | `incrementViewCount` + `dailyStats` |
| Dashboard Analytics | Creator metrics | Data-driven decisions | `convex/dashboard.js` + Chart.js |

---

## Business Value

| Question | Answer |
|----------|--------|
| **What problem does it solve?** | Creators juggle writing tools, AI, image hosting, publishing, and analytics separately. This unifies them. |
| **Target users** | Bloggers, newsletter writers, content strategists, indie creators, marketers |
| **How it helps** | AI speeds writing; one dashboard for drafts, publishing, analytics; social features grow audience |
| **Why choose this platform** | All-in-one: AI writing + rich editor + image tools + social feed + analytics + public profile |

---

## Interview Explanations

### 30 Seconds
> "I built **AI Creator Platform** — a full-stack content platform where creators sign in with Clerk, write and publish posts with an AI-powered editor using Google Gemini, upload images via ImageKit, and manage everything from a real-time dashboard backed by Convex. Users follow each other, like and comment on posts, and track engagement analytics."

### 1 Minute
> "**AI Creator Platform** is a creator SaaS built with **Next.js 16**, **React 19**, and **Convex** as the real-time backend. **Clerk** handles auth integrated with Convex via JWT. Creators set a username, use a rich text editor with **AI generation and improvement** via **Google Gemini**, and upload images through **ImageKit**. Posts save as drafts with auto-save or publish to `/{username}/{postId}`. The social layer includes feed, trending, follows, likes, and comments. The dashboard shows views, likes, comments, followers, and a 30-day chart — all serverless: Convex, Clerk, ImageKit, and Gemini connected through one Next.js app."

### 3 Minutes
> "The project is **AI Creator Platform**, branded **Creatr** in the UI, targeting content creators who want one platform to write, publish, and grow an audience.
>
> **Architecture:** Next.js App Router with route groups for auth, public content, and a protected dashboard. `proxy.js` is Clerk middleware for Next.js 16 — unauthenticated `/dashboard/*` requests redirect to sign-in.
>
> **Auth:** Clerk manages sign-up/sign-in. `useStoreUser` upserts users into Convex keyed by Clerk's `tokenIdentifier`. `auth.config.js` trusts Clerk JWTs.
>
> **Data:** Convex stores users, posts, comments, likes, follows, and dailyStats. Posts support drafts, publishing, tags, images, scheduling, and engagement counters. Client fetching uses Convex reactive `useQuery`.
>
> **Content creation:** React Hook Form + Zod + React Quill. AI via Server Actions calling Gemini — one model generates HTML from a title, another improves content with retry logic.
>
> **Media:** Images upload through an API route authenticated by Clerk to ImageKit, with client-side transformation previews.
>
> **Social:** Feed, trending, follows, likes, comments. View counts roll into daily analytics for Chart.js dashboard charts.
>
> **Public layer:** Profiles at `/{username}`, posts at `/{username}/{postId}` — both a creator tool and content discovery network.
>
> **Stack rationale:** Next.js for full-stack in one repo; Convex for real-time sync without REST boilerplate; Clerk for secure auth; Gemini and ImageKit for AI and media without self-hosting."

---

## Static Assets (`public/`)

| File | Used In |
|------|---------|
| `logo.png` | Header, dashboard sidebar, public header, browser favicon |
| `banner.png` | Landing page hero |
| `placeholder.png` | Fallback featured image in post cards |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- Accounts: [Clerk](https://clerk.com), [Convex](https://convex.dev), [Google AI](https://ai.google.dev), [ImageKit](https://imagekit.io)

### Installation

```bash
git clone <repository-url>
cd ai-creator-platform
npm install
```

### Environment Setup

Create `.env.local` with:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER_DOMAIN=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Convex
NEXT_PUBLIC_CONVEX_URL=

# Google Gemini
GEMINI_API_KEY=

# ImageKit
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
```

### Run Development

```bash
# Terminal 1 — Convex backend (first run requires interactive setup)
npx convex dev

# Terminal 2 — Next.js frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## License

Private project (`"private": true` in `package.json`).
