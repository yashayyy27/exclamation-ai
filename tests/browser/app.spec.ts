import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdirSync } from "node:fs";
const nav = async (page: import("@playwright/test").Page, name: string) => {
  if (
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .isVisible()
  )
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
  await page.getByRole("navigation").getByRole("button", { name }).click();
};
test("overview filters, drilldowns and real screenshot", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "THE SIGNAL",
  );
  await page
    .getByRole("combobox", { name: "Date range", exact: true })
    .selectOption("first");
  await expect(page.locator(".kpi").first()).toContainText("210");
  await page
    .getByRole("combobox", { name: "Channel filter" })
    .selectOption("google / cpc");
  await expect(page.locator(".kpi").first()).toContainText("70");
  await page.getByRole("button", { name: /03 Add to cart/ }).click();
  await expect(page.locator(".chart-detail")).toContainText("previous stage");
  await page
    .getByRole("combobox", { name: "Date range", exact: true })
    .selectOption("full");
  await page
    .getByRole("combobox", { name: "Channel filter" })
    .selectOption("all");
  mkdirSync("docs/screenshots", { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `docs/screenshots/overview-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("store full purchase, consent gate and unique transaction", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page, "Measurement Lab 02");
  await expect(page.locator(".event-row")).toHaveCount(2);
  await page.getByRole("button", { name: "View Signal notebook" }).click();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close product" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "View Signal notebook" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "View Signal notebook" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add to cart" })
    .click();
  expect(
    await page.evaluate(
      () =>
        window.dataLayer?.filter(
          (e: unknown) => (e as { event?: string }).event === "add_to_cart",
        ).length || 0,
    ),
  ).toBe(0);
  await page
    .getByRole("button", { name: "Allow analytics", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add to cart", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Remove one Signal notebook" })
    .click();
  await page.getByRole("button", { name: /Demo checkout/ }).click();
  await page.getByRole("button", { name: "Complete demo purchase" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Demo purchase recorded",
  );
  const tx1 = await page.evaluate(() =>
    window.dataLayer
      .filter((e: unknown) => (e as { event?: string }).event === "purchase")
      .map(
        (e: unknown) =>
          (e as { ecommerce: { transaction_id: string } }).ecommerce
            .transaction_id,
      ),
  );
  expect(tx1).toHaveLength(1);
  await page
    .getByRole("button", { name: "Add to cart", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Demo checkout/ }).click();
  await page.getByRole("button", { name: "Complete demo purchase" }).click();
  const tx2 = await page.evaluate(() =>
    window.dataLayer
      .filter((e: unknown) => (e as { event?: string }).event === "purchase")
      .map(
        (e: unknown) =>
          (e as { ecommerce: { transaction_id: string } }).ecommerce
            .transaction_id,
      ),
  );
  expect(new Set(tx2).size).toBe(2);
  await page.getByRole("button", { name: "Revoke analytics consent" }).click();
  await page.getByRole("tab", { name: "Event taxonomy" }).click();
  await expect(page.getByText("Eight events.", { exact: false })).toBeVisible();
});
test("analyst uses evidence and refuses ROAS", async ({ page }) => {
  await page.goto("/");
  await nav(page, "Ask ! 04");
  await page.getByRole("button", { name: "Find the signal" }).click();
  await expect(page.locator(".answer")).toContainText("SUPPORTED");
  await expect(page.locator(".answer")).toContainText("q-211ee1809e6a");
  await page
    .getByLabel("YOUR ANALYTICS QUESTION", { exact: true })
    .fill("Calculate ROAS by channel");
  await page.getByRole("button", { name: "Find the signal" }).click();
  await expect(page.locator(".answer")).toContainText("INSUFFICIENT EVIDENCE");
  await expect(page.locator(".answer")).not.toContainText("q-211ee1809e6a");
});
test("evaluation failure inspection and client export review", async ({
  page,
}, info) => {
  await page.goto("/");
  await nav(page, "Evaluation Studio 05");
  await expect(page.locator(".evaluation-stats").first()).toContainText("36");
  await page.getByRole("button", { name: "Baseline policy · v1" }).click();
  await page
    .getByRole("combobox", { name: "Show", exact: true })
    .selectOption("failures");
  await page.getByRole("button", { name: "roas: failed", exact: true }).click();
  await expect(page.locator(".case-detail")).toContainText("FAILED");
  await nav(page, "Client Room 06");
  const exportButton = page.getByRole("button", {
    name: "Download 6-slide PDF",
  });
  await expect(exportButton).toBeDisabled();
  await page.getByRole("checkbox").check();
  const download = page.waitForEvent("download");
  await exportButton.click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("client-review.pdf");
  if (info.project.name === "desktop") {
    mkdirSync("docs/deliverables", { recursive: true });
    await file.saveAs(info.outputPath("client-review.pdf"));
  }
  await page
    .getByRole("textbox", { name: /ONE PRIORITIZED RECOMMENDATION/ })
    .fill("Audit the product-to-cart event, then test a clearer proposition.");
  await expect(exportButton).toBeDisabled();
  await page.getByRole("checkbox").check();
  const note = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export executive note" }).click();
  expect((await note).suggestedFilename()).toBe("decision-note.md");
});
test("all pages have no serious accessibility violations or overflow", async ({
  page,
}, info) => {
  await page.goto("/");
  for (const name of [
    "Overview 01",
    "Measurement Lab 02",
    "Customer Journey 03",
    "Ask ! 04",
    "Evaluation Studio 05",
    "Client Room 06",
    "Data Sources 07",
  ]) {
    await nav(page, name);
    await expect(page.locator("main")).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((x) => ({
        id: x.id,
        nodes: x.nodes.map((n) => n.target),
      })),
      `${name}: axe`,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      name + " overflow",
    ).toBe(true);
    if (
      info.project.name === "desktop" &&
      [
        "Measurement Lab 02",
        "Ask ! 04",
        "Evaluation Studio 05",
        "Client Room 06",
      ].includes(name)
    ) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `docs/screenshots/${name.replace(/[^a-z]/gi, "").toLowerCase()}.png`,
        fullPage: true,
      });
    }
  }
});
