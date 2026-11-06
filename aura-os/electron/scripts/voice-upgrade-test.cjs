const { _electron } = require("playwright");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
(async () => {
  const root = path.resolve(__dirname, "..");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "drer-voice-upgrade-"));
  const output = path.join(root, "test-results/voice-upgrade");
  await fs.mkdir(output, { recursive: true });
  const cfgPath = path.join(dir, "config.json");
  await fs.writeFile(
    cfgPath,
    JSON.stringify({ encryptedKey: "opaque-test-fixture-never-decrypted" }),
  );
  const app = await _electron.launch({
    executablePath:
      process.env.DRER_EXECUTABLE ||
      path.join(root, "dist/mac-arm64/DRER.app/Contents/MacOS/DRER"),
    args: ["--background-test"],
    env: { ...process.env, DRER_DATA_DIR: dir },
    recordVideo: { dir: output, size: { width: 1000, height: 730 } },
  });
  const evidence = { tests: [], microphoneTested: false };
  try {
    const page = await app.firstWindow();
    const call = async (expression) =>
      app.evaluate(
        async ({ BrowserWindow }, expression) =>
          BrowserWindow.getAllWindows()[0].webContents.executeJavaScript(
            expression,
          ),
        expression,
      );
    const result = await call(
      'window.drer.request({question:"can yo opne asphat 8 for me"})',
    );
    assert.equal(result.type, "result");
    assert.match(result.text, /Opened Asphalt 8/);
    evidence.tests.push(
      "Exact reported typo launches installed Asphalt 8+ through renderer IPC",
    );
    await app.evaluate(
      ({ BrowserWindow }, result) =>
        BrowserWindow.getAllWindows()[0].webContents.send("test:result", {
          question: "can yo opne asphat 8 for me",
          result,
        }),
      result,
    );
    const voices = await call("window.drer.voices()");
    assert.ok(voices.length > 0);
    await call(
      'window.drer.configureVoice({wakeName:"Buddy",voice:"",spokenReplies:true})',
    );
    const state = await call("window.drer.state()");
    assert.equal(state.voice.wakeName, "Buddy");
    assert.equal(
      JSON.parse(await fs.readFile(cfgPath, "utf8")).encryptedKey,
      "opaque-test-fixture-never-decrypted",
    );
    evidence.tests.push(
      "Voice settings save without losing existing encrypted credentials",
    );
    evidence.tests.push(
      "Lists " + voices.length + " installed macOS reply voices",
    );
    await call("window.drer.previewVoice()");
    evidence.tests.push("Native spoken Buddy sample completed");
    const video = page.video();
    await app.close();
    evidence.video = await video.path();
    evidence.passed = true;
    await fs.writeFile(
      path.join(output, "evidence.json"),
      JSON.stringify(evidence, null, 2),
    );
    console.log(JSON.stringify(evidence, null, 2));
  } catch (error) {
    await app.close().catch(() => {});
    throw error;
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
