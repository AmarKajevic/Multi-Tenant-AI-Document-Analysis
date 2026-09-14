import { test, expect } from "@playwright/test";

// Full authenticated flows (create org -> upload -> analyze) need a signed-in
// session, which needs Clerk's testing-token setup — out of scope here (see
// e2e/README.md). What we *can* verify without any test credentials is that
// the route guards themselves actually redirect signed-out visitors, which is
// the security-relevant part: app/(dashboard)/layout.tsx and
// app/(dashboard)/[orgSlug]/layout.tsx both call `redirect("/sign-in")` when
// there's no session.
test.describe("Route guards (signed out)", () => {
  test("visiting /select-org redirects to sign-in", async ({ page }) => {
    await page.goto("/select-org");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("visiting an org dashboard redirects to sign-in", async ({ page }) => {
    await page.goto("/some-org");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("visiting an org's documents page redirects to sign-in", async ({
    page,
  }) => {
    await page.goto("/some-org/documents");
    await expect(page).toHaveURL(/\/sign-in/);
  });
});
