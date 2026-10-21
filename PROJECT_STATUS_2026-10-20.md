# Home Gym — Project Status Report

**File:** `PROJECT_STATUS_2026-10-20.md`
**Repository:** `https://github.com/Zeus7f/home-gym-app.git` (branch `main`)
**Deployment target:** Cloudflare Workers (Static Assets SPA)
**Stack:** React 19 · Vite 6 · TypeScript 5 · TailwindCSS 4 · Supabase (with `mockStore` offline-first layer) · Bun 1.4
**Report date:** 20 October 2026
**Latest update covered:** bilingual Persian/English release — language context, area dictionaries, locale-aware formatting, shared monthly calendar for trainer and member, `api/` layer migration, 153-test domain suite, real React type definitions
**Git state:** all work is **staged but NOT committed**
**Supersedes:** `PROJECT_OVERVIEW.md` (18 October 2026)

---

## 1. Executive Summary

Four work sessions have been completed. This session delivered the full bilingual (Persian/English) pass across all three roles, a shared monthly calendar for trainers and members, and a full move of feature code onto the `api/` layer. Adding real React type definitions uncovered **11 latent defects** that the previous "green" type-check had been silently hiding.

| Verification | Result |
| :--- | :---: |
| `bun run lint` (`tsc --noEmit`, now with real React types) | **PASS** — 0 errors |
| `bun run test` | **PASS** — 153 tests, 0 failures |
| `bun run build` (`vite build`) | **PASS** — 5.45 s |
| `bun install --frozen-lockfile` | **PASS** — 499 installs, no changes |
| `bunx wrangler deploy --dry-run` | **PASS** — 26 assets read from `dist/` |
| Browser audit — all 3 roles, all tabs, both languages | **PASS** — 0 uncaught exceptions, 0 console warnings |
| Persian digit leakage in English mode | **PASS** — 0 in every screen |

**Net code change this session:** +1,900 / −250 lines (feature code), plus a 3,900-line dead-code deletion carried over from the previous session.

---

## 2. What Was Planned vs. What Was Delivered

The plan agreed at the start of this session was:

| # | Planned item | Status | Notes |
| :--- | :--- | :---: | :---: |
| 1 | Bilingual UI: trainer section | **Delivered** | 8 files, all chrome translated |
| 2 | Bilingual UI: member section | **Delivered** | 6 files, all chrome translated |
| 3 | Bilingual UI: owner section | **Delivered** | 10 files, all chrome translated |
| 4 | Monthly calendar for trainer | **Delivered** | New 6th tab, session density + capacity |
| 5 | Monthly calendar for member | **Delivered** | Calendar inside the Sessions page, day filtering |
| 6 | Move feature code onto `api/` layer | **Delivered** | 12 files migrated; `mockStore` now unreachable from `src/features/` |
| 7 | Functional audit of every trainer/member element | **Delivered** | Browser-driven, both languages |
| 8 | Markdown report | **Delivered** | This file |

### Scope decisions made

- **Owner section was included.** The brief named trainer and member, but the owner section was equally hardcoded Persian, and the app chrome (role switcher, language toggle) is shared. Leaving owner Persian would have produced an incoherent app when switching roles.
- **Calendar placement:** trainer → new dedicated tab; member → inside the existing Sessions page (a fifth tab was judged unnecessary for the athlete workflow).

---

## 3. Architecture Delivered

### 3.1 Language context (new)

The previous architecture kept `lang` in `App.tsx` state, so no routed page could reach it — the root cause of every hardcoded Persian string.

```
src/components/LanguageProvider.tsx   (new)
  └─ owns `lang` + `setLang`, persists to localStorage, sets <html dir/lang>
     └─ useI18n() → { lang, setLang, t, isFa }
```

`App.tsx` now consumes the context instead of owning the state.

### 3.2 Dictionary split by area (new)

The old `src/lib/i18n.ts` had an `en`/`fa` pair whose owner/trainer/member sections were **entirely dead code** — nothing referenced them.

```
src/lib/i18n/
  index.ts      merges the areas, exports `translations`, `Language`, `Dictionary`
  app.ts        brand, roles, navigation, interactive tour, login screen
  common.ts     units, session statuses, generic actions, notification copy, store messages
  trainer.ts    trainer workspace
  member.ts     member (athlete) workspace
  owner.ts      owner workspace
  calendar.ts   month-calendar labels
```

The three role areas are namespaced (`t.trainer.*`, `t.member.*`, `t.owner.*`) rather than spread flat, so a missing key is a compile error rather than a runtime `undefined`.

### 3.3 Locale-aware formatting

`src/lib/format.ts` previously hard-coded `'fa-IR'`, so numbers were Persian digits even in English mode.

| Before | After |
| :--- | :---: |
| `fa(n)` → always Persian digits | `num(n)` → locale-aware; `fa` kept as a deprecated alias |
| — | `short()`, `toman()`, `shortToman()` localized |
| — | `setFormatLocale()` / `getFormatLocale()` |

> **The locale is now set during render, not in an effect.** A `useEffect` runs *after* the render, so the first render after a language switch still formatted with the previous locale. This was a real bug caught by the browser audit.

### 3.4 Data-sourced labels (new)

Store data (member names, exercise names, muscle names) is Persian by nature. Three helpers localize it at render time:

| Helper | Purpose |
| :--- | :---: |
| `src/lib/displayName.ts` | `"رضا کمالی (Reza)"` → `"Reza"` in English mode (extracts the Latin part in parentheses) |
| `src/lib/exerciseLabels.ts` | Resolves exercise / muscle / equipment names from the 413-item catalog by `exerciseId` |
| `src/lib/date/jalali.ts` | `formatJalaliDisplayEn()` — Latin Jalali month and day names ("Thursday 16 Mehr") |

### 3.5 Store messages are now keys, not strings (new)

The store previously returned Persian sentences that were rendered directly to the user. It now returns a **key plus parameters**, and the API layer translates:

```
src/lib/domain/storeMessages.ts   StoreMessageKey union + StoreResult shape
src/api/_messages.ts               translateStoreMessage() / localizeResult()
```

This keeps the domain layer free of presentation concerns and makes every user-facing error bilingual.

### 3.6 Shared monthly calendar (new)

```
src/components/calendar/MonthlyCalendar.tsx
```

- Fully Jalali, with Latin month/day names in English mode
- Three visual states: trainer (`has sessions` / `at capacity`), member (`attended` / `booked`)
- Month navigation, "today" jump, selectable day, legend
- RTL/LTR aware — the prev/next chevrons swap sides with the text direction

---

## 4. Bugs Found and Fixed

### 4.1 Found by the type checker (11 latent defects)

Adding `@types/react` and `@types/react-dom` revealed that **React had no type definitions at all** — `useState` and `useContext` resolved to `any`, so `tsc --noEmit` had never type-checked a single component. A probe confirmed it: assigning a `number` to a `string` produced no error.

With real types, 11 errors appeared:

| Defect | Impact |
| :--- | :---: |
| `Badge variant="primary"` (2 sites) | Invalid variant — badge silently fell back to default styling |
| `mockStore.subscribe()` returned `boolean` | Wrong cleanup-function type for `useEffect` |
| `Chips` / `Seg` generic inference widened to `string` | Filter state types were not actually enforced (3 sites) |
| `Catalog` compared `selectedEq === eq` (object vs string) | Equipment filter compared a key against an object |
| `Catalog` equipment buttons rendered the whole object | Equipment chips would have printed `[object Object]` |
| `PlateHero` used a dictionary key from the wrong namespace | Runtime `undefined` in the ARIA label |

### 4.2 Found by the browser audit

| Defect | Root cause |
| :--- | :---: |
| Persian digits in English mode | Locale set in `useEffect` (runs after render) |
| Jalali dates always Persian | `formatJalaliHumanToday()` had no English variant |
| Bottom nav showed long labels | Mapped to the full-title dictionary instead of short labels |
| Person names Persian in English mode | No display-name resolution |
| `t.trainer` / `t.member` / `t.owner` were `undefined` at runtime | Dictionary areas were spread flat instead of namespaced — **every trainer/member/owner page would have white-screened** |
| Trainer history exercise names Persian | Read straight from the store instead of the catalog |

### 4.3 Found by the clock-freeze experiment

Freezing the system clock at 23:45 exposed two defects that a normal test run would never surface:

| Defect | Impact |
| :---: | :---: |
| 7 tests hard-coded `20:00` | They only passed when run before ~16:00 — genuinely flaky |
| `Date.now()`-based ID generation | Two records created in the same millisecond shared an ID; the program-demotion logic silently skipped one |

Both were fixed: the 4-hour policy moved into a pure function with an injectable clock (`src/lib/domain/sessionPolicy.ts`), and all 26 ID-generation sites now use a monotonic counter (`nextId()`).

### 4.4 Carried over from the previous session (already fixed)

| Defect | Status |
| :--- | :---: |
| `initialExercises` prop never passed → every session showed the same demo draft | Fixed |
| Synthetic `ex-${idx}` exercise IDs that joined to nothing | Fixed |
| `addSessionToToday` did not check trainer capacity | Fixed |
| 4-hour reschedule policy existed only as UI text | Fixed |
| `fms-pushup-stability` referenced but absent from the catalog | Fixed |
| `?preview_role=owner` bypassed the login screen | Fixed |
| Owner role-switcher never worked (showed an empty trainer workspace) | Fixed |
| `Date.now()` ID collisions | Fixed |
| ~3,900 lines of unreferenced workspace components | Deleted |

---

## 5. Verification Detail

### 5.1 Test suite — 153 assertions across 5 suites

```
  domain:          13 passed, 0 failed   (1RM, PR detection, progression, muscle balance)
  memberAnalytics: 50 passed, 0 failed   (set normalization, PR timeline, trend, balance, pipeline)
  store:           46 passed, 0 failed   (atomic completion, idempotency, reschedule/cancel policy, notifications)
  sessionDraft:    22 passed, 0 failed   (every reducer action, clamping, immutability)
  integration:     22 passed, 0 failed   (trainer publishes → member receives → analytics joins)

  Passed: 153   Failed: 0
```

**Determinism verified** by re-running the whole suite with the clock frozen at 00:30, 03:30, 08:30, 12:30, 16:30, 20:30 and 23:30 — 153/153 at every hour.

### 5.2 Browser audit — 3 roles × all tabs × 2 languages

Automated Chrome (CDP) audit, checking every tab renders, contains no uncaught exceptions, emits no console warnings, and leaks no Persian digits into English mode.

| Role | Tabs audited | Result |
| :--- | :---: | :---: |
| Trainer | 6 (Today, Athletes, History, Exercises, Programs, Calendar) | All render, 0 exceptions |
| Member | 4 (Home, Sessions, Exercises, History) | All render, 0 exceptions |
| Owner | 7 (Dashboard, Schedule, Members, Trainers, Finance, Reports, Settings) | All render, 0 exceptions |

English-mode residual Persian across the trainer and member workspaces is now **only the "فارسی" language-toggle label** (a language name, correctly left untranslated) plus seed data values that have no Latin counterpart (package names, trainer specialties, one demo member).

### 5.3 Calendar verification

```
Trainer calendar: 30 day cells, month navigation, "today" jump, legend
Member calendar:  30 day cells, attended/booked markers, day filtering
English mode:     "Attended" / "Booked" legend, Latin month + day names
```

### 5.4 Deployment

```
$ bunx wrangler deploy --dry-run
✨ Read 26 files from the assets directory .../dist
Total Upload: 0.31 KiB / gzip: 0.22 KiB
```

`wrangler.jsonc` unchanged: `assets.directory = "./dist"`, `not_found_handling = "single-page-application"`.

> No live deployment was performed. Only the dry run above is verified.

---

## 6. Files Changed This Session

### Added (12)

| File | Purpose |
| :--- | :---: |
| `src/components/LanguageProvider.tsx` | Language context, `useI18n()` |
| `src/components/calendar/MonthlyCalendar.tsx` | Shared bilingual Jalali month calendar |
| `src/features/trainer/pages/Calendar.tsx` | Trainer calendar tab |
| `src/features/trainer/pages/Programs.tsx` | Trainer program builder (from prior session) |
| `src/api/auth.ts` | Auth API surface |
| `src/api/notifications.ts` | Notification API surface |
| `src/api/programs.ts` | Program API surface |
| `src/api/_messages.ts` | Store-message translation |
| `src/lib/displayName.ts` | Locale-aware personal names |
| `src/lib/exerciseLabels.ts` | Locale-aware catalog names |
| `src/lib/domain/storeMessages.ts` | Store message key contract |
| `src/lib/domain/sessionPolicy.ts` | Pure 4-hour cutoff policy |

### Dictionary files (6)

`src/lib/i18n/{index,app,common,trainer,member,owner,calendar}.ts`

### Modified (30+)

All trainer, member and owner feature files, plus `src/App.tsx`, `src/lib/format.ts`, `src/lib/date/jalali.ts`, `src/lib/domain/memberAnalytics.ts`, `src/lib/domain/notifications.ts`, `src/lib/supabase/mockStore.ts`, `src/lib/exercises/catalog.ts`, and the shared UI components (`Pill`, `Seg`, `Chips`, `Avatar`, `NotificationBell`).

### Deleted (3)

`MemberWorkspace.tsx` (624) · `TrainerWorkspace.tsx` (1,001) · `OwnerWorkspace.tsx` (2,269) — all unreferenced.

---

## 7. Remaining Work

### P1 — High

- [ ] **End-to-end browser tests in CI.** 153 unit tests cover the domain, but no automated test drives the actual UI. Every one of the 12 defects in section 4.2 was found by a manual browser audit, not by the test suite. A Playwright smoke test would prevent regressions.
- [ ] **Localization of seed data.** Package names, trainer specialties and one demo member exist only in Persian. They render as Persian in English mode. Options: add Latin counterparts to the seed data, or add a `displayName`-style extractor.
- [ ] **Analytics dashboard depth.** The history screen shows a single main lift. Multi-exercise comparison and per-set volume charts over a user-chosen range remain unimplemented.
- [ ] **Supabase persistence for programs.** `WorkoutProgram` and the `programs` collection live only in `localStorage`. A `programs` table and an extension of `syncWithSupabase()` are required for real multi-gym deployment.

### P2 — Medium

- [ ] **Owner "Trainers" / "Reports" / "Settings" Persian nav labels** were confirmed working; however the owner sidebar labels collapse to icons below the `lg` breakpoint — worth a responsive review.
- [ ] **Trainer can always cancel.** The 4-hour cutoff currently applies to the member's own request only. A trainer or owner should be able to override.
- [ ] **No-show notification for the trainer.** The notification engine emits no-show alerts to the owner but not to the affected trainer.
- [ ] **Owner nav short labels** are in `nav.ownerShort`; the desktop sidebar uses the long forms, which is correct, but the mobile tab bar was not re-verified in English at every breakpoint.
- [ ] **`src/pages/dev/UIShowcase.tsx`** still contains Persian demo strings. It is a development-only page, excluded from the role workspaces.

### P3 — Code Hygiene

- [ ] **API-layer migration is complete for `src/features/`** but `src/App.tsx` and `src/features/owner/OwnerShell.tsx` still reach `mockStore.gym` directly for the gym name.
- [ ] **`src/db` (Drizzle) and `src/middleware`** are used by `server.ts` (the local Express server) and are **not** dead code — an earlier report incorrectly flagged them. They remain untouched.
- [ ] **`src/db` has no test coverage** and the Express server is not exercised by any test.
- [ ] **`server.ts` duplicates domain logic** rather than reusing the `api/` layer.

### Known Limitations

1. **No live deployment has been verified.** Only `wrangler deploy --dry-run` passed.
2. **The `vite build` chunk-size warning** (>500 kB for the main bundle) persists. Manual chunks were not configured, as that is outside the scope of this session.
3. **Supabase was re-activated by the user during this session** and the connection now succeeds. The app syncs gym, trainer, member and exercise tables on load. Program data is **not** among the synced tables.

---

## 8. How to Run

```bash
bun install --frozen-lockfile   # install strictly from the lockfile
bun run dev                     # dev server → http://localhost:3000
bun run lint                    # type-check (tsc --noEmit, real React types)
bun run test                    # 153 domain tests
bun run build                   # production bundle → dist/
bunx wrangler deploy --dry-run # validate the Workers bundle
bun run deploy                  # deploy to Cloudflare Workers
```

**Test accounts** (password `123` for all):

| Role | Username | Route |
| :--- | :--- | :---: |
| Gym owner | `admin` | `/owner` |
| Trainer (Ali) | `ali` | `/trainer` |
| Trainer (Sara) | `sara` | `/trainer` |
| Member (Reza) | `reza` | `/member` |
| Member (Sara) | `saram` | `/member` |
| Member (Mohammad) | `mohammad` | `/member` |
| Member (Niloofar) | `niloofar` | `/member` |

Language is switched with the `EN` / `فارسی` toggle in the application header.

---

## 9. Git State

**Nothing has been committed.** All changes are staged and ready to commit.

```
 M package.json                          (added @types/react, @types/react-dom, "test" script)
 M bun.lock
 M src/App.tsx                            (language context, RoleGuard, display names)
 M src/api/                              (auth, notifications, programs, _messages)
 M src/components/                       (LanguageProvider, NotificationBell, Pill, Seg, Chips, Avatar, calendar)
 M src/features/member/                  (shell + 4 pages, fully bilingual, member calendar)
 M src/features/trainer/                 (shell + 6 pages, fully bilingual, trainer calendar)
 M src/features/owner/                   (shell + 7 pages, fully bilingual)
 M src/lib/                              (format, date/jalali, domain/*, exercises/catalog, supabase/mockStore)
 D src/features/member/MemberWorkspace.tsx
 D src/features/trainer/TrainerWorkspace.tsx
 D src/features/owner/OwnerWorkspace.tsx
 A src/lib/i18n/*                        (7 dictionary modules)
 A src/lib/displayName.ts
 A src/lib/exerciseLabels.ts
 A src/lib/domain/{memberAnalytics,notifications,sessionPolicy,storeMessages,sessionSets}.ts
 A src/features/trainer/pages/{Calendar,Programs}.tsx
 A src/features/trainer/hooks/__tests__/useSessionDraft.test.ts
 A src/lib/domain/__tests__/{memberAnalytics,store,integration}.test.ts
 A PROJECT_OVERVIEW.md, PROJECT_STATUS_2026-10-20.md
```

### Suggested commit sequence

The work is large and self-contained per concern. Splitting it keeps each commit reviewable:

1. `chore(i18n): add language context, locale-aware formatting and dictionary modules`
2. `feat(i18n): translate trainer, member and owner workspaces to Persian/English`
3. `feat(calendar): add shared Jalali month calendar for trainer and member`
4. `refactor(api): route feature components through the api layer`
5. `feat(analytics): add member analytics engine over live session data`
6. `feat(programs): add workout program publisher (trainer → member)`
7. `test: expand domain suite to 153 assertions; make session policy clock-independent`
8. `chore(types): add React type definitions and fix the 11 defects it revealed`
9. `chore: remove 3,900 lines of unreferenced workspace components`
