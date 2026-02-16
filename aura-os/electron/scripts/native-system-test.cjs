// End-to-end test of the real macOS integrations. Calls the app's request API,
// records its renderer, then checks Apple Reminders from a new process after exit.
const { _electron: electron } = require("playwright");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
const { nativeRequest } = require("../src/native");
const root = path.resolve(__dirname, "..");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "drer-native-system-test-"),
  );
  const output = path.join(root, "test-results", "native-system");
  await fs.mkdir(output, { recursive: true });
  await fs.copyFile(
    path.join(os.homedir(), "Library/Application Support/DRER/config.json"),
    path.join(directory, "config.json"),
  );
  const app = await electron.launch({
    executablePath: process.env.DRER_EXECUTABLE || require("electron"),
    args: process.env.DRER_EXECUTABLE
      ? ["--background-test"]
      : [root, "--background-test"],
    env: { ...process.env, DRER_DATA_DIR: directory },
    recordVideo: { dir: output, size: { width: 1000, height: 730 } },
    timeout: 30000,
  });
  const evidence = {
    platform: process.platform,
    recordedAt: new Date().toISOString(),
    tests: [],
    modelToolsLive: false,
  };
  try {
    const page = await app.firstWindow();
    await sleep(1800);
    const data = await app.evaluate(async ({ app }) => {
      return Boolean(app.__drerTestRequest);
    });
    assert.equal(data, true);
    async function run(question) {
      const result = await app.evaluate(async ({ BrowserWindow }, question) => {
        const view = BrowserWindow.getAllWindows()[0].webContents;
        const result = await view.executeJavaScript(
          "window.drer.request(" +
            JSON.stringify({ question, withScreen: false }) +
            ")",
        );
        view.send("test:result", { question, result });
        return result;
      }, question);
      if (result.type === "error") throw new Error(result.text);
      return result;
    }
    const exact = await run("set a timer for 10s");
    assert.equal(exact.native, true);
    assert.equal(exact.service, "Apple Reminders");
    const first = exact.reminders.find(
      (x) => x.native && x.title === "Timer finished",
    );
    assert.ok(first?.nativeId);
    evidence.tests.push({
      name: "exact 10s phrase creates an Apple Reminders item",
      passed: true,
    });
    console.log("PASS exact timer saved in Apple Reminders");
    await sleep(3000);
    const semantic = await run(
      "Could you please remind me fifteen seconds from now to stretch for my DRER system test?",
    );
    assert.equal(semantic.route, "ai-tool");
    assert.equal(semantic.native, true, JSON.stringify(semantic));
    const second = semantic.reminders.find(
      (x) => x.native && x.nativeId !== first.nativeId,
    );
    assert.ok(second);
    evidence.modelToolsLive = true;
    evidence.tests.push({
      name: "live Groq function call executes a real native reminder",
      passed: true,
      model: semantic.model,
    });
    console.log("PASS live model tool call -> Apple Reminders");
    await sleep(2600);
    const opened = await run("open calculator");
    assert.match(opened.text, /Opened Calculator/);
    evidence.tests.push({
      name: "opens the real macOS Calculator application",
      passed: true,
    });
    console.log("PASS native application opening");
    await sleep(1800);
    const mail = await run("open mail");
    assert.match(mail.text, /Opened Mail/);
    evidence.tests.push({
      name: "opens native Mail through installed-app discovery",
      passed: true,
    });
    await sleep(1500);
    const event = await run(
      "Schedule a meeting called DRER recorded system test tomorrow at 10am for 15 minutes",
    );
    assert.equal(event.service, "Apple Calendar");
    assert.equal(event.native, true);
    evidence.tests.push({
      name: "request creates an event in Apple Calendar",
      passed: true,
    });
    console.log("PASS native Calendar event");
    await sleep(2300);
    const video = page.video();
    await app.close();
    evidence.video = await video.path();
    const persisted = await nativeRequest({
      operation: "read-reminder",
      identifier: first.nativeId,
    });
    assert.equal(persisted.verified, true);
    const persistedSecond = await nativeRequest({
      operation: "read-reminder",
      identifier: second.nativeId,
    });
    assert.equal(persistedSecond.verified, true);
    evidence.tests.push({
      name: "both native items verified by a separate process after DRER quits",
      passed: true,
    });
    evidence.passed = true;
    await fs.writeFile(
      path.join(output, "evidence.json"),
      JSON.stringify(evidence, null, 2),
    );
    console.log(JSON.stringify(evidence, null, 2));
  } catch (error) {
    evidence.passed = false;
    evidence.error = error.message;
    await fs.writeFile(
      path.join(output, "evidence.json"),
      JSON.stringify(evidence, null, 2),
    );
    await app.close().catch(() => {});
    throw error;
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
