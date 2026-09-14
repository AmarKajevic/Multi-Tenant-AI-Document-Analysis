import { test, expect } from "@playwright/test";

test.describe("Marketing homepage", () => {
  test("renders the hero and primary calls to action", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /AI-Powered Document Analysis/i }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Start Free Trial" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sign In", exact: true }),
    ).toBeVisible();
  });

  test("Start Free Trial leads to the sign-up page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start Free Trial" }).click();

    await expect(page).toHaveURL(/\/sign-up/);
  });

  test("Sign In leads to the sign-in page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Sign In", exact: true }).first().click();

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
