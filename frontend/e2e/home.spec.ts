import { expect, test } from "@playwright/test";

test("dashboard, bracket, and methodology render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Knockout Prediction Dashboard" })).toBeVisible();

  await page.getByRole("link", { name: /Bracket/ }).click();
  await expect(page.getByRole("heading", { name: "Round of 32 Bracket" })).toBeVisible();

  await page.getByRole("link", { name: /Methodology/ }).click();
  await expect(page.getByRole("heading", { name: "Methodology" })).toBeVisible();
});
