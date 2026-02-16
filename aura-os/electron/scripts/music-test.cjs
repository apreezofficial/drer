// Runs the actual installed app action. macOS may request Spotify Automation permission.
const { _electron } = require("playwright");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "drer-music-test-"));
  const app = await _electron.launch({
    executablePath:
      process.env.DRER_EXECUTABLE ||
      "/Applications/DRER.app/Contents/MacOS/DRER",
    args: ["--background-test"],
    env: { ...process.env, DRER_DATA_DIR: dir },
  });
  try {
    await app.firstWindow();
    const result = await app.evaluate(async ({ app }) =>
      app.__drerTestRequest("play spotify music for me"),
    );
    console.log(JSON.stringify(result));
    if (result.type === "error" || !result.text.includes("playing"))
      process.exitCode = 1;
  } finally {
    await app.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
