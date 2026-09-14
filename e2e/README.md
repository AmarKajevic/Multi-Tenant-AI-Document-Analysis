# E2E tests

These run against a real production build (`npm run build && npm run start`,
see `playwright.config.ts`'s `webServer`) using whatever `.env` is present —
locally that's your dev Clerk/DB instance.

## What's covered

Only flows that don't need a signed-in user:

- the marketing homepage renders and its CTAs link where they should
- the dashboard route guards (`app/(dashboard)/layout.tsx` and
  `app/(dashboard)/[orgSlug]/layout.tsx`) actually redirect signed-out
  visitors to `/sign-in` — this is the security-relevant behavior, so it's
  worth covering even without a full login flow

## What's not covered, and how to add it

The real value-add flow — sign up → create org → upload a document → run an
AI analysis → see the result — needs an authenticated session. Clerk supports
this via [`@clerk/testing`](https://clerk.com/docs/testing/playwright/overview),
which issues a "testing token" that bypasses bot detection and lets you sign
in with a real (or Clerk-provided test-mode) account from Playwright. Rough
shape:

```ts
import { clerkSetup } from "@clerk/testing/playwright";

// in playwright.config.ts's globalSetup, or a setup project
await clerkSetup();
```

then in a test, sign in with `clerk.signIn({ ... })` before navigating to a
protected route. This needs `CLERK_SECRET_KEY` (already in `.env`) plus a
seeded test user — add it once you have a Clerk instance you're comfortable
running test signups against (a dedicated dev/test Clerk instance, not
production).
