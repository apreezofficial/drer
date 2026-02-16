const { _electron: electron } = require("playwright");
const fs = require("node:fs/promises");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
(async () => {
  const directory = path.join(root, "test-results", "live-ai");
  await fs.mkdir(directory, { recursive: true });
  const app = await electron.launch({
    executablePath: require("electron"),
    args: [root, "--background-test"],
    recordVideo: { dir: directory, size: { width: 1000, height: 730 } },
    timeout: 30000,
  });
  const evidence = {
    recordedAt: new Date().toISOString(),
    platform: process.platform,
    networkAI: true,
    screenCaptured: false,
  };
  try {
    const page = await app.firstWindow();
    await page.waitForFunction(() => Boolean(window.drer));
    const state = await page.evaluate(() => window.drer.state());
    assert.equal(
      state.hasKey,
      true,
      "Add a key in Settings before the live test.",
    );
    evidence.model = state.model;
    evidence.screenPermission = state.screenPermission;
    await page.waitForTimeout(1200);
    await page
      .getByRole("textbox", { name: "Your request" })
      .fill("Give me a concise three-step plan for a focused workday.");
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: "Send ↑", exact: true }).click();
    await page.locator(".message.assistant").last().waitFor({ timeout: 60000 });
    const result = await page.locator(".message.assistant").last().innerText();
    if (await page.locator(".message.error").count()) throw new Error(result);
    assert.match(result, /Live Groq response/);
    assert.ok(result.length > 50);
    await page.screenshot({
      path: path.join(directory, "live-groq-response.png"),
    });
    await page.waitForTimeout(4000);
    const video = page.video();
    await app.close();
    evidence.video = await video.path();
    evidence.passed = true;
    await fs.writeFile(
      path.join(directory, "evidence.json"),
      JSON.stringify(evidence, null, 2),
    );
    console.log(JSON.stringify(evidence, null, 2));
  } catch (error) {
    evidence.passed = false;
    evidence.error = error.message;
    await fs.writeFile(
      path.join(directory, "evidence.json"),
      JSON.stringify(evidence, null, 2),
    );
    await app.close().catch(() => {});
    throw error;
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
