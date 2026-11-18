import { expect, test } from "@playwright/test";

test("login page supports accessible password reveal and account terms consent", async ({ page }) => {
  await page.goto("/login");
  const password = page.locator('input[autocomplete="current-password"]');
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Hide password" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page.locator('input[autocomplete="new-password"]')).toBeVisible();
  await expect(page.getByLabel(/I accept the/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms");
  await expect(page.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
  await expect(page.getByRole("link", { name: /Continue as guest/ })).toContainText("Kat AI credits included");
  const googleButton = page.getByRole("button", { name: "Continue with Google" });
  if (await googleButton.isEnabled()) {
    await googleButton.click();
    await expect(page.getByRole("dialog", { name: "Review and accept" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Accept and continue with Google" })).toBeDisabled();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
});
