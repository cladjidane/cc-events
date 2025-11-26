import { test, expect } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL;

test.describe("smoke", () => {
  test.skip(!baseURL, "Set E2E_BASE_URL to run E2E smoke tests");

  test("homepage renders", async ({ page }) => {
    const target = `${baseURL}/`;
    const response = await page.goto(target);
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/event|Event/i);
  });
});
