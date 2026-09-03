# Rules & Architecture Manifesto: Anti-AI Slop Standards
**HealthAthon BPJS Monorepo Architecture Guidelines**

---

## 1. Executive Summary: What is "AI Slop" in Software Engineering?

**AI Slop** refers to the accumulation of low-quality, architecturally thoughtless, or superficially functional code generated hastily by AI tools without engineering rigor. While it may compile and pass a quick run ("Works Today, Rots Tomorrow"), it introduces:

1. **Shallow Abstractions & Duplication:** Copy-pasting patterns across files rather than creating thoughtful abstractions, severely violating DRY (Don't Repeat Yourself).
2. **Mystery Diffs & Phantom Code:** Code written without clear intent or reason, bloated with unnecessary wrapper functions, unused dependencies, or dead types.
3. **Prompt-as-Program Anti-Pattern:** Treating LLM prompts as raw code without schemas, input sanitization, or fallbacks, resulting in fragile non-deterministic workflows.
4. **Suppressed Errors & Blind Assumptions:** Catching errors silently (`catch (e) {}`), ignoring promise rejections, using `any` indiscriminately, or trusting external inputs without runtime validation.
5. **Over-Commented Obviousness:** Comments that merely repeat what the syntax does (`// set x to 5`) rather than explaining architectural rationale and business trade-offs.

---

## 2. Core Monorepo Principles

### 2.1 Workspace Structure Integrity
The monorepo is strictly divided into two top-level zones:
- `apps/`: Deployable executable applications (`apps/api`, `apps/web`).
- `packages/`: Reusable, publishable/internal modules (`packages/shared`).

```
HealthAthon BPJS/
├── apps/
│   ├── api/               # Backend Express Service (Port 4000)
│   └── web/               # Frontend React/Vite SPA (Port 5173)
├── packages/
│   └── shared/            # Single Source of Truth for Types & Contracts
├── rules.md               # This architectural rulebook
└── README.md              # Project presentation & setup guide
```

### 2.2 Boundary Rules
1. **Never Import Across Apps:** `apps/web` must **never** directly import files from `apps/api`, and vice versa.
2. **Shared Contracts via `packages/shared`:** Any data structure, API response envelope, request payload, or shared constant consumed by both frontend and backend **must** live in `packages/shared`.
3. **Zero Circular Dependencies:** Circular imports between files or modules are strictly forbidden.

---

## 3. Backend Architecture Standards (`apps/api`)

### 3.1 Layered Architecture
Every endpoint in `apps/api` must strictly follow the 4-layer separation of concerns:

```
Request ──► Route ──► Middleware (Validate/Auth) ──► Controller ──► Service ──► External / DB
```

1. **Routes (`src/routes/`):** Pure URL routing and middleware attachment. No business logic.
2. **Controllers (`src/controllers/`):** Extract HTTP request parameters (`req.body`, `req.query`, `req.params`), invoke services, and return standardized JSON responses.
3. **Services (`src/services/`):** Pure business logic, external API integrations (Supabase, OpenRouter), and computations. Agnostic of Express `req` and `res`.
4. **Middleware (`src/middleware/`):** Authentication guards, Zod request validators, and centralized error handling.

### 3.2 Standard API Response Envelope
Every API response from Express must use the unified schema defined in `@healthathon/shared`:

```typescript
// Success Response:
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "...", "version": "v1" }
}

// Error Response:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error explanation",
    "details": [ ... ]
  }
}
```

### 3.3 Strict Runtime Validation (Zod)
- Never cast `req.body as SomeType` blindly.
- Every mutating request (`POST`, `PUT`, `PATCH`) must pass through a Zod schema validator middleware.

### 3.4 Centralized Error Handling
- Never use empty catch blocks.
- Throw custom `AppError(message, statusCode, errorCode)`.
- The global error handler middleware catches unhandled rejections and sends clean, sanitized error responses to the client (hiding stack traces in production).

---

## 4. Frontend Architecture Standards (`apps/web`)

### 4.1 Modularity & Feature Slicing
Organize code by domain feature rather than dumping everything into flat folders:
- `src/components/common/`: Reusable primitives (Buttons, Modals, Cards, Badges, Inputs).
- `src/features/<feature-name>/`: Complete slices containing feature-specific views, state, and child components (e.g., `features/landing/`, `features/auth/`).
- `src/lib/`: Configured API and SDK singletons (`api-client.ts`, `supabase.ts`).
- `src/routes/`: Router definition and route guards.

### 4.2 Performance & Rendering Hygiene
1. **Zero Uncontrolled Re-renders:** Avoid inline object/function declarations inside hot render loops.
2. **Lazy Loading:** All secondary routes (e.g., Dashboards, Settings) must be lazy-loaded using `React.lazy()` and `Suspense`.
3. **No Heavy Packages for Trivial Tasks:** Do not install moment.js, lodash, or massive UI libraries for simple tasks that native JavaScript, date-fns, or Tailwind can handle in 10 lines of code.

### 4.3 Styling System
- Use **Tailwind CSS** utility classes exclusively.
- Use `clsx` and `tailwind-merge` (`cn(...)` helper) for dynamic conditional styling.
- Maintain a consistent healthcare/BPJS theme palette (Emerald, Medical Teal, Deep Slate).

---

## 5. Third-Party Integrations

### 5.1 Supabase (Database & Authentication)
1. **Backend Integration (`apps/api`):** Initialize Supabase using environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`). Never hardcode credentials.
2. **Frontend Integration (`apps/web`):** Initialize browser Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. **Graceful Fallbacks:** In development or demonstration mode where credentials might not yet be configured, the application must display a clear, helpful informational banner instead of crashing or hanging.

### 5.2 OpenRouter AI Integration
1. **Never Call OpenRouter from the Frontend:** All AI calls must pass through `apps/api/src/services/openrouter.service.ts` to protect API keys and apply rate-limiting and prompt sanitization.
2. **Structured Outputs:** Always define strict prompt contracts and validate AI JSON responses against Zod schemas.
3. **Timeout & Fallback Resilience:** OpenRouter calls must have sensible timeouts (e.g., 20s) and return structured user-friendly fallbacks when rate limits or upstream provider errors occur.

---

## 6. Anti-AI Slop Checklist (Must Check Before Committing)

Before submitting or approving any code changes, verify against this checklist:

- [ ] **No `any` Types:** All variables, function parameters, and return types are strictly typed.
- [ ] **No Dead/Phantom Code:** No commented-out blocks, unreferenced imports, or unused parameters.
- [ ] **No Silent Failures:** All promises and async operations have proper error handling.
- [ ] **Single Source of Truth:** Data contracts between API and Web are imported from `packages/shared`.
- [ ] **Clean Git Hygiene:** Secrets, `.env` files, build caches, and node_modules are strictly gitignored.
- [ ] **Self-Documenting Code:** Code is clean and readable. Comments explain **why**, not **what**.
- [ ] **Presentation-Ready:** The codebase builds cleanly (`npm run build`) without warnings or errors.
