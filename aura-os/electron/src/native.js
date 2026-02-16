const { spawn } = require("node:child_process");
const path = require("node:path");
function nativeRequest(request, { timeout = 120000 } = {}) {
  if (process.platform !== "darwin")
    return Promise.reject(
      new Error("Native Apple app integration is macOS only."),
    );
  const binary = path.join(
    __dirname.replace("app.asar", "app.asar.unpacked"),
    "../native/build/DRERNative.app/Contents/MacOS/DRERNative",
  );
  return new Promise((resolve, reject) => {
    const child = spawn(binary, [], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(
        new Error(
          "macOS permission request timed out. Allow DRER access in System Settings and try again.",
        ),
      );
    }, timeout);
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(
        new Error(
          e.code === "ENOENT"
            ? "Build the macOS helper with npm run build:native."
            : e.message,
        ),
      );
    });
    let settled = false;
    function finish() {
      if (settled) return;
      try {
        const result = JSON.parse(out.trim());
        settled = true;
        clearTimeout(timer);
        if (!result.ok)
          reject(new Error(result.error || "The native action failed."));
        else resolve(result);
      } catch {
        // Output can arrive in chunks. Wait for a complete line or process exit.
      }
    }
    child.stdout.on("data", (chunk) => {
      out += chunk.toString();
      if (out.includes("\n")) finish();
    });
    child.stderr.on("data", () => {});
    child.on("close", () => {
      finish();
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error("The native helper did not return a result."));
      }
    });
    child.stdin.end(JSON.stringify(request));
  });
}
module.exports = { nativeRequest };
