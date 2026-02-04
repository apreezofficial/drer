const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
if (process.platform !== "darwin") {
  console.log("Native EventKit helper is macOS only.");
  process.exit(0);
}
const root = path.resolve(__dirname, "..");
const bundle = path.join(root, "native/build/DRERNative.app");
const contents = path.join(bundle, "Contents");
const binary = path.join(contents, "MacOS/DRERNative");
const inputs = [
  path.join(root, "native/Voice.swift"),
  path.join(root, "native/main.swift"),
  path.join(root, "native/Info.plist"),
];
if (
  fs.existsSync(binary) &&
  fs.statSync(binary).mtimeMs >=
    Math.max(...inputs.map((file) => fs.statSync(file).mtimeMs))
) {
  console.log("DRER native helper is up to date.");
  process.exit(0);
}
fs.mkdirSync(path.join(contents, "MacOS"), { recursive: true });
fs.copyFileSync(
  path.join(root, "native/Info.plist"),
  path.join(contents, "Info.plist"),
);
execFileSync(
  "xcrun",
  [
    "swiftc",
    path.join(root, "native/main.swift"),
    path.join(root, "native/Voice.swift"),
    "-o",
    path.join(contents, "MacOS/DRERNative"),
    "-framework",
    "Speech",
    "-framework",
    "AVFoundation",
    "-framework",
    "EventKit",
    "-framework",
    "AppKit",
  ],
  { stdio: "inherit" },
);
execFileSync("/usr/bin/codesign", ["--force", "--sign", "-", bundle], {
  stdio: "inherit",
});
console.log("Built DRER native macOS helper.");
