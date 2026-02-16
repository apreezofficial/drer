// Records the real Electron window. Interact with the visible app, then press Enter here to finish.
const { _electron: electron } = require("playwright");
const path = require("node:path");
const fs = require("node:fs/promises");
const root = path.resolve(__dirname, "..");
(async () => {
  const dir = path.join(root, "test-results", "interactive");
  await fs.mkdir(dir, { recursive: true });
  const app = await electron.launch({
    executablePath: require("electron"),
    args: [root],
    recordVideo: { dir, size: { width: 1000, height: 730 }, fps: 25 },
    timeout: 30000,
  });
  const page = await app.firstWindow();
  const result = {
    startedAt: new Date().toISOString(),
    platform: process.platform,
    mode: "Actual native macOS app session; entered through desktop UI",
    video: null,
  };
  console.log("RECORDING READY. Press Enter to finish.");
  process.stdin.resume();
  await new Promise((resolve) => process.stdin.once("data", resolve));
  const video = page.video();
  await app.close().catch(() => {});
  result.video = await video.path();
  await fs.writeFile(
    path.join(dir, "session.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
  process.stdin.pause();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
