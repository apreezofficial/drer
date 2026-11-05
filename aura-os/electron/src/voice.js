const { spawn, execFile } = require("node:child_process");
const { promisify } = require("node:util");
const path = require("node:path");
const exec = promisify(execFile);
function voiceSettings(value = {}) {
  const wakeName =
    typeof value.wakeName === "string" ? value.wakeName.trim() : "Buddy";
  if (!/^[a-zA-Z][a-zA-Z ]{1,23}$/.test(wakeName))
    throw new Error("Choose a wake name with 2–24 letters.");
  return {
    wakeName,
    wakeAliases: Array.isArray(value.wakeAliases)
      ? [
          ...new Set(
            value.wakeAliases
              .filter((x) => typeof x === "string")
              .map((x) => x.trim())
              .filter((x) => /^[a-zA-Z][a-zA-Z ]{1,23}$/.test(x)),
          ),
        ].slice(0, 8)
      : [],
    voice: typeof value.voice === "string" ? value.voice.slice(0, 100) : "",
    spokenReplies: value.spokenReplies !== false,
    preferredName:
      typeof value.preferredName === "string"
        ? value.preferredName
            .trim()
            .slice(0, 50)
            .replace(/[\r\n]/g, " ")
        : "",
  };
}
class WakeRouter {
  constructor(name = "Buddy", clock = () => Date.now()) {
    this.clock = clock;
    this.setName(name);
  }
  setName(name, aliases = []) {
    this.name = name.toLowerCase();
    this.names = [name, ...aliases].map((x) => x.toLowerCase());
    this.until = 0;
  }
  prefix(input) {
    const text = input.trim().replace(/^[.,!? ]+|[.,!? ]+$/g, "");
    const re = new RegExp(
      "^(?:(?:hey|hi|okay|ok)[, ]+)?(?:" +
        this.names
          .map((name) => name.replace(/ /g, "\\s+"))
          .sort((a, b) => b.length - a.length)
          .join("|") +
        ")\\b[,!:. ]*",
      "i",
    );
    const match = text.match(re);
    return match ? { command: text.slice(match[0].length).trim() } : null;
  }
  accept(input) {
    const match = this.prefix(input);
    if (match) {
      this.until = this.clock() + 12000;
      if (match.command) {
        this.until = 0;
        return match;
      }
      return { wake: true };
    }
    if (this.clock() < this.until) {
      this.until = 0;
      return { command: input.trim() };
    }
    return null;
  }
}
class VoiceService {
  constructor({
    onState,
    onCommand,
    onWake,
    onMeter = () => {},
    onTranscript = () => {},
  }) {
    this.onState = onState;
    this.onMeter = onMeter;
    this.onTranscript = onTranscript;
    this.onCommand = onCommand;
    this.onWake = onWake;
    this.options = voiceSettings();
    this.router = new WakeRouter();
    this.enabled = false;
    this.child = null;
    this.speaker = null;
    this.processing = false;
    this.generation = 0;
    this.acknowledged = false;
    this.acknowledgement = Promise.resolve();
  }
  status(text) {
    this.onState({
      enabled: this.enabled,
      listening: Boolean(this.child) && !this.processing,
      text,
      wakeName: this.options.wakeName,
    });
  }
  async voices() {
    if (process.platform !== "darwin") return [];
    const { stdout } = await exec("/usr/bin/say", ["-v", "?"]);
    return stdout
      .split("\n")
      .map((line) => line.match(/^(.+?)\s{2,}([a-z]{2}_[A-Z]{2})\s+#/))
      .filter(Boolean)
      .map((m) => ({ name: m[1].trim(), language: m[2] }));
  }
  async configure(value) {
    const next = voiceSettings(value);
    if (next.voice) {
      const voices = await this.voices();
      if (!voices.some((v) => v.name === next.voice))
        throw new Error("Select an installed macOS voice.");
    }
    const renamed =
      this.options.wakeName !== next.wakeName ||
      JSON.stringify(this.options.wakeAliases) !==
        JSON.stringify(next.wakeAliases);
    this.options = next;
    this.router.setName(next.wakeName, next.wakeAliases);
    if (renamed && this.enabled) {
      this.stopListener();
      this.acknowledged = false;
      this.listen();
    }
    return next;
  }
  stopListener() {
    this.generation++;
    if (this.child) {
      this.child.kill("SIGTERM");
      this.child = null;
    }
  }
  stop() {
    this.enabled = false;
    this.acknowledged = false;
    this.stopListener();
    this.speaker?.kill("SIGTERM");
    this.status("Voice off.");
  }
  start() {
    if (process.platform !== "darwin")
      throw new Error("Native voice mode is currently available on macOS.");
    if (this.child) return;
    this.enabled = true;
    this.listen();
  }
  listen() {
    if (!this.enabled || this.child || this.processing) return;
    const token = ++this.generation;
    const binary = path.join(
      __dirname.replace("app.asar", "app.asar.unpacked"),
      "../native/build/DRERNative.app/Contents/MacOS/DRERNative",
    );
    const child = spawn(
      binary,
      ["--listen", "--wake-name", this.options.wakeName],
      {
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    this.child = child;
    child.stdin.on("error", () => {});
    this.status("Requesting microphone and speech access…");
    let buffer = "";
    child.stdout.on("data", (data) => {
      buffer += data.toString();
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 1);
        if (token !== this.generation) continue;
        try {
          const event = JSON.parse(line);
          if (event.type === "level") this.onMeter(event.level);
          if (event.type === "partial") this.onTranscript(event.text);
          if (event.type === "listening")
            this.status(
              "Listening for “" + this.options.wakeName + "” · Hey is optional",
            );
          if (event.type === "error") {
            this.stop();
            this.status(event.text);
          }
          if (
            event.type === "partial" &&
            !this.processing &&
            !this.acknowledged &&
            this.router.prefix(event.text)
          ) {
            this.acknowledged = true;
            this.onWake();
            this.status("I’m listening…");
          }
          if (event.type === "utterance")
            this.heard(event.text).catch((error) => this.status(error.message));
        } catch {}
      }
    });
    child.stderr.on("data", () => {});
    child.on("error", (error) => {
      if (token !== this.generation) return;
      this.enabled = false;
      this.child = null;
      this.status(error.message);
    });
    child.on("exit", () => {
      if (token !== this.generation) return;
      this.child = null;
      this.enabled = false;
      this.status("Voice stopped. Enable it again to retry.");
    });
  }
  async speak(text) {
    if (process.platform !== "darwin")
      throw new Error("Speech playback requires macOS.");
    const args = [
      "-r",
      "205",
      ...(this.options.voice ? ["-v", this.options.voice] : []),
    ];
    await new Promise((resolve, reject) => {
      const child = spawn("/usr/bin/say", args, {
        stdio: ["pipe", "ignore", "pipe"],
      });
      this.speaker = child;
      child.stderr.on("data", () => {});
      child.on("error", reject);
      child.on("exit", (code) => {
        this.speaker = null;
        code === 0 ? resolve() : reject(new Error("Speech playback stopped."));
      });
      child.stdin.end(String(text).slice(0, 800));
    });
  }
  greeting() {
    return (
      "How can I help you today" +
      (this.options.preferredName ? ", " + this.options.preferredName : "") +
      "?"
    );
  }
  pauseListener() {
    if (this.child && !this.child.stdin.destroyed)
      this.child.stdin.write('{"muted":true}\n');
  }
  resumeListener() {
    if (this.child && !this.child.stdin.destroyed)
      this.child.stdin.write('{"muted":false}\n');
    else this.listen();
  }
  async preview() {
    if (this.processing) throw new Error("Wait for the current voice request.");
    this.processing = true;
    this.pauseListener();
    try {
      await this.speak(this.greeting());
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 120));
      this.processing = false;
      this.resumeListener();
    }
  }
  async heard(text) {
    if (!this.enabled || this.processing) return;
    this.acknowledged = false;
    const cleaned = text.replace(/\b(?:hmm|hm|um)\b[?,.! ]*/gi, "");
    const intent = this.router.accept(cleaned);
    if (!intent) return;
    this.processing = true;
    this.pauseListener();
    try {
      if (intent.wake) {
        this.onWake();
        await this.speak(this.greeting());
        this.router.until = this.router.clock() + 12000;
      } else {
        const result = await this.onCommand(intent.command);
        await this.acknowledgement;
        if (this.options.spokenReplies)
          await this.speak(result.text || "Done.");
      }
    } finally {
      await new Promise((resolve) => setTimeout(resolve, 120));
      this.processing = false;
      this.resumeListener();
    }
  }
}
module.exports = { VoiceService, WakeRouter, voiceSettings };
