const {
  app,
  BrowserWindow,
  globalShortcut,
  desktopCapturer,
  ipcMain,
  Tray,
  Menu,
  screen,
  nativeImage,
  shell,
  safeStorage,
  systemPreferences,
  Notification,
} = require("electron");
const { execFile, spawn } = require("node:child_process");
const { promisify } = require("node:util");
const exec = promisify(execFile);
const os = require("node:os");
const crypto = require("node:crypto");
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");
const { ActionStore, parseRequest, cleanText } = require("./actions");
const { nativeRequest } = require("./native");
const { resolveApplication } = require("./app-match");
const { queryAI, DEFAULT_MODEL } = require("./ai");
const { VoiceService } = require("./voice");
app.setName("DRER");
app.setPath(
  "userData",
  process.env.DRER_DATA_DIR || path.join(app.getPath("appData"), "DRER"),
);
const HOTKEY =
  process.platform === "darwin"
    ? "CommandOrControl+Shift+Space"
    : "Control+Alt+Space";
let window = null,
  tray = null,
  store = null,
  key = process.env.GROQ_API_KEY || "",
  model = process.env.DRER_MODEL || DEFAULT_MODEL,
  shortcut = "",
  configurationReady = Promise.resolve(),
  encryptedKey = null,
  savedVoiceEnabled = false;
const configFile = () => path.join(app.getPath("userData"), "config.json");
const trusted = (event) =>
  Boolean(
    window &&
    !window.isDestroyed() &&
    event.sender === window.webContents &&
    event.senderFrame === window.webContents.mainFrame,
  );
function handle(channel, fn) {
  ipcMain.handle(channel, async (event, ...args) => {
    if (!trusted(event)) throw new Error("Untrusted app request.");
    return fn(...args);
  });
}
function notify(channel, data) {
  if (window && !window.isDestroyed()) window.webContents.send(channel, data);
}
const voice = new VoiceService({
  onState: (state) => {
    notify("voice:state", state);
    console.info("DRER voice:", state.text);
  },
  onMeter: (level) => notify("voice:meter", { level }),
  onTranscript: (text) => notify("voice:transcript", { text }),
  onWake: () => {
    notify("voice:wake");
    showWindow();
  },
  onProblem: (text) => {
    if (Notification.isSupported())
      new Notification({ title: "DRER voice", body: text }).show();
  },
  onCommand: async (question) => {
    notify("voice:heard", { question });
    const result = await runRequest({ question, withScreen: false });
    notify("voice:result", result);
    return result;
  },
});
const AI_MODES = ["auto", "local", "groq"];
const LOCAL_MODELS = ["auto", "nano-1b", "lite-3b", "core-8b"];
let launchAtLogin = true;
async function patchConfig(patch) {
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(configFile(), "utf8"));
  } catch {}
  await fs.writeFile(configFile(), JSON.stringify({ ...existing, ...patch }), {
    mode: 0o600,
  });
}
// Start DRER (hidden, in the tray) when the user logs in so the wake name works
// after a reboot. Only for packaged builds: a dev run must not register itself.
function applyLaunchAtLogin() {
  if (!app.isPackaged) return;
  app.setLoginItemSettings({
    openAtLogin: launchAtLogin,
    openAsHidden: true,
    args: ["--background"],
  });
}
const startedHidden = () =>
  process.argv.includes("--background") ||
  (process.platform === "darwin" && app.getLoginItemSettings().wasOpenedAtLogin);
async function loadConfig() {
  await fs.mkdir(app.getPath("userData"), { recursive: true, mode: 0o700 });
  try {
    const cfg = JSON.parse(await fs.readFile(configFile(), "utf8"));
    if (cfg.voice) await voice.configure(cfg.voice);
    savedVoiceEnabled = cfg.voiceEnabled === true;
    if (typeof cfg.launchAtLogin === "boolean") launchAtLogin = cfg.launchAtLogin;
    if (!process.env.DRER_AI && AI_MODES.includes(cfg.aiMode))
      process.env.DRER_AI = cfg.aiMode;
    if (!process.env.DRER_LOCAL_MODEL && LOCAL_MODELS.includes(cfg.localModel))
      process.env.DRER_LOCAL_MODEL = cfg.localModel;
    encryptedKey =
      typeof cfg.encryptedKey === "string" ? cfg.encryptedKey : null;
    if (typeof cfg.model === "string" && cfg.model.length < 120)
      model = cfg.model;
  } catch (e) {
    if (e.code !== "ENOENT")
      console.warn(
        "Saved configuration could not be loaded. Open Settings to configure it.",
      );
  }
}
async function createWindow() {
  if (window && !window.isDestroyed()) return window;
  const display = screen.getPrimaryDisplay().workArea;
  window = new BrowserWindow({
    title: "DRER",
    width: 1120,
    height: 760,
    minWidth: 900,
    minHeight: 600,
    x: Math.max(display.x, display.x + Math.round((display.width - 1120) / 2)),
    y: Math.max(display.y, display.y + Math.round((display.height - 760) / 2)),
    backgroundColor: "#101214",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    trafficLightPosition: { x: 18, y: 16 },
    ...(process.platform === "darwin"
      ? {}
      : {
          titleBarOverlay: {
            color: "#101214",
            symbolColor: "#b6b9be",
            height: 44,
          },
        }),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (e) => e.preventDefault());
  window.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      window.hide();
    }
  });
  window.on("closed", () => {
    window = null;
  });
  window.webContents.on("before-input-event", (_, input) => {
    if (input.key === "Escape") window.hide();
  });
  await window.loadFile(path.join(__dirname, "../renderer/overlay.html"));
  return window;
}
async function showWindow(settings = false) {
  await createWindow();
  window.show();
  window.focus();
  if (settings) notify("nav:settings");
}
function config() {
  return {
    hasKey: Boolean(key || encryptedKey),
    voice: voice.options,
    model,
    launchAtLogin,
    canLaunchAtLogin: app.isPackaged,
    aiMode: (process.env.DRER_AI || "auto").toLowerCase(),
    localModel: process.env.DRER_LOCAL_MODEL || "auto",
    platform: process.platform,
    shortcut,
    screenPermission:
      process.platform === "darwin"
        ? systemPreferences.getMediaAccessStatus("screen")
        : "system-managed",
    workspace: path.join(app.getPath("documents"), "DRER"),
    version: app.getVersion(),
  };
}
async function captureScreen() {
  window.hide();
  await new Promise((resolve) => setTimeout(resolve, 250));
  try {
    const display = screen.getPrimaryDisplay();
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 1920, height: 1080 },
    });
    const source =
      sources.find((s) => s.display_id === String(display.id)) || sources[0];
    if (!source || source.thumbnail.isEmpty())
      throw new Error(
        "Screen capture is unavailable. On macOS, enable Electron/DRER in System Settings → Privacy & Security → Screen & System Audio Recording, then restart the app.",
      );
    return source.thumbnail.toDataURL();
  } finally {
    await showWindow();
  }
}
function dayRange(day) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (day === "tomorrow") start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}
// Real Apple Calendar events and due reminders for a day, as plain text.
async function readSchedule(day) {
  if (process.platform !== "darwin")
    throw new Error("Reading your calendar is available on macOS.");
  const { start, end } = dayRange(day);
  const [cal, rem] = await Promise.all([
    nativeRequest({
      operation: "read-calendar",
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    }),
    nativeRequest({ operation: "read-reminders", endAt: end.toISOString() }),
  ]);
  const time = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const lines = [];
  for (const e of cal.events || [])
    lines.push(
      (e.allDay ? "All day" : time(e.startAt) + "–" + time(e.endAt)) +
        "  " +
        e.title +
        (e.location ? " (" + e.location + ")" : "") +
        "  [" +
        e.calendar +
        "]",
    );
  const due = (rem.reminders || []).filter(
    (r) => !r.dueAt || new Date(r.dueAt) < end,
  );
  for (const r of due)
    lines.push(
      "Reminder " + (r.dueAt ? time(r.dueAt) : "(no time)") + "  " + r.title,
    );
  return {
    label: day,
    text: lines.length
      ? lines.join("\n")
      : "Nothing on your calendar or reminders for " + day + ".",
  };
}
// ---- Approved commands run as visible, stoppable tasks ----
const requests = new Map(); // requestId -> AbortController (many chats at once)
const tasks = new Map(); // taskId -> task
const taskView = (t) => ({
  id: t.id,
  command: t.command,
  status: t.status,
  output: t.output,
  chatId: t.chatId,
  background: t.background,
  exitCode: t.exitCode,
  createdAt: t.createdAt,
  startedAt: t.startedAt,
  endedAt: t.endedAt,
});
let publishTimer = null;
function publishTasks(now = false) {
  if (now) {
    clearTimeout(publishTimer);
    publishTimer = null;
    notify("tasks:update", [...tasks.values()].map(taskView));
    return;
  }
  publishTimer ??= setTimeout(() => {
    publishTimer = null;
    notify("tasks:update", [...tasks.values()].map(taskView));
  }, 200);
}
function createTask(command, chatId) {
  const t = {
    id: crypto.randomUUID(),
    command,
    status: "pending",
    output: "",
    chatId: chatId || null,
    background: false,
    createdAt: new Date().toISOString(),
  };
  tasks.set(t.id, t);
  while (tasks.size > 60) {
    const old = [...tasks.values()].find((x) => x.status !== "pending" && x.status !== "running");
    if (!old) break;
    tasks.delete(old.id);
  }
  publishTasks(true);
  if (Notification.isSupported() && !(window?.isVisible() && window.isFocused())) {
    const n = new Notification({
      title: "DRER needs your approval",
      body: "$ " + command.slice(0, 120),
    });
    n.on("click", () => showWindow());
    n.show();
  }
  return t;
}
function startTask(id, { background = false } = {}) {
  const t = tasks.get(id);
  if (!t || t.status !== "pending")
    throw new Error("This command was already handled or expired.");
  t.status = "running";
  t.background = background === true;
  t.startedAt = new Date().toISOString();
  const child = spawn("/bin/zsh", ["-lc", t.command], {
    cwd: os.homedir(),
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.child = child;
  const add = (d) => {
    t.output = (t.output + d.toString()).slice(-20000);
    publishTasks();
  };
  child.stdout.on("data", add);
  child.stderr.on("data", add);
  // Foreground commands are capped at 2 minutes; background ones at 30.
  const limit = t.background ? 30 * 60000 : 120000;
  t.timer = setTimeout(() => {
    t.timedOut = true;
    child.kill("SIGTERM");
  }, limit);
  const finish = (code, signal, error) => {
    if (t.endedAt) return;
    clearTimeout(t.timer);
    t.endedAt = new Date().toISOString();
    t.exitCode = code;
    if (error) t.output += "\n" + error.message;
    if (t.stopped) t.status = "stopped";
    else if (t.timedOut) {
      t.status = "stopped";
      t.output += "\n[stopped: took longer than " + limit / 60000 + " min]";
    } else t.status = code === 0 ? "done" : "failed";
    delete t.child;
    publishTasks(true);
    notify("tasks:done", taskView(t));
  };
  child.on("error", (e) => finish(null, null, e));
  child.on("close", (code, signal) => finish(code, signal));
  publishTasks(true);
  return taskView(t);
}
function stopTask(id) {
  const t = tasks.get(id);
  if (!t || t.status !== "running") return taskView(t || {});
  t.stopped = true;
  t.child?.kill("SIGTERM");
  setTimeout(() => t.child?.kill("SIGKILL"), 3000).unref();
  return taskView(t);
}
function readNotes(query = "") {
  const dir = store.workspace;
  return fs
    .readdir(dir)
    .catch(() => [])
    .then(async (names) => {
      const files = [];
      for (const n of names.filter((x) => x.endsWith(".md"))) {
        const st = await fs.stat(path.join(dir, n)).catch(() => null);
        if (st) files.push({ n, t: st.mtimeMs });
      }
      files.sort((a, b) => b.t - a.t);
      const q = query.trim().toLowerCase();
      const out = [];
      let total = 0;
      for (const f of files) {
        const body = await fs.readFile(path.join(dir, f.n), "utf8").catch(() => "");
        if (q && !(f.n + " " + body).toLowerCase().includes(q)) continue;
        const piece = "## " + f.n.replace(/-\d{17}-[0-9a-f]{4}\.md$/, "") + " (" + new Date(f.t).toLocaleDateString() + ")\n" + body.slice(0, 1500);
        if (total + piece.length > 6000) break;
        out.push(piece);
        total += piece.length;
        if (out.length >= 15) break;
      }
      return out.length ? out.join("\n\n") : "No saved DRER notes" + (q ? " matching “" + query + "”" : "") + " yet.";
    });
}
async function saveNativeReminder(action) {
    const saved = await nativeRequest({
      operation: "reminder",
      title: action.title,
      dueAt: action.dueAt,
    });
    const reminder = {
      id: saved.identifier,
      nativeId: saved.identifier,
      native: true,
      category: action.category || "reminder",
      title: action.title,
      dueAt: action.dueAt,
      status: "scheduled",
    };
    store.state.reminders.push(reminder);
    store.state.activity.push({
      kind: "native-reminder",
      at: new Date().toISOString(),
      text: action.title,
    });
    await store.persist();
    notify("app:state", store.summary());
    return {
      kind: "reminder",
      native: true,
      service: "Apple Reminders",
      application: "reminders",
      text: `Set in Apple Reminders: ${action.title}\n${new Date(action.dueAt).toLocaleString()}\nmacOS owns this timed alert. It remains scheduled after DRER quits.`,
      ...store.summary(),
    };
}

async function executeAction(action) {
  if (action.kind === "schedule") {
    const { label, text } = await readSchedule(action.day);
    return { kind: "schedule", text, label };
  }
  if (action.kind === "notes") {
    return { kind: "notes", text: await readNotes(action.query) };
  }
  if (process.platform === "darwin" && action.kind === "reminder") {
    try {
      return await saveNativeReminder(action);
    } catch (e) {
      // Reminders refused or unavailable: still run the timer inside DRER.
      const local = await store.execute(action);
      return {
        ...local,
        text:
          (local.text || "Timer set.") +
          "\n(Not in Apple Reminders: " +
          (e.message || "access not granted") +
          ". Grant access in Settings → Permissions to also get a macOS alert.)",
      };
    }
  }
  if (process.platform === "darwin" && action.kind === "calendar_draft") {
    const saved = await nativeRequest({
      operation: "calendar-event",
      title: action.title,
      startAt: action.startAt,
      endAt: action.endAt,
    });
    store.state.activity.push({
      kind: "native-calendar-event",
      at: new Date().toISOString(),
      identifier: saved.identifier,
      text: action.title,
    });
    await store.persist();
    return {
      kind: "calendar_event",
      native: true,
      service: "Apple Calendar",
      application: "calendar",
      text: `Created in Apple Calendar: ${action.title}\n${new Date(action.startAt).toLocaleString()} — ${new Date(action.endAt).toLocaleTimeString()}\nThe event is saved in your default macOS calendar.`,
      ...store.summary(),
    };
  }
  if (process.platform === "darwin" && action.kind === "cancel_reminders") {
    const items = store.state.reminders.filter(
      (x) => x.native && x.status === "scheduled",
    );
    for (const item of items) {
      await nativeRequest({
        operation: "complete-reminder",
        identifier: item.nativeId,
      });
      item.status = "cancelled";
    }
    await store.persist();
    notify("app:state", store.summary());
    return {
      kind: "cancel_reminders",
      text: `Completed ${items.length} active DRER-created item(s) in Apple Reminders.`,
      ...store.summary(),
    };
  }

  if (action.kind === "list_reminders") {
    const items = store.summary().reminders;
    return {
      kind: action.kind,
      text: items.length
        ? items
            .map(
              (x) =>
                `${x.status === "delivered" ? "✓" : "◷"} ${x.title} — ${new Date(x.dueAt).toLocaleString()} (${x.status})`,
            )
            .join("\n")
        : "No timers or reminders yet. Try “set a timer for 10s”.",
      ...store.summary(),
    };
  }
  if (action.kind === "web_search") {
    await shell.openExternal(
      "https://duckduckgo.com/?q=" + encodeURIComponent(action.query),
    );
    return {
      kind: action.kind,
      text: `Opened your browser to search for: ${action.query}`,
    };
  }
  if (action.kind === "list_applications") {
    const result = await nativeRequest({ operation: "list-apps" });
    return {
      kind: "list_applications",
      text:
        "Installed apps:\n" +
        result.applications
          .map((item) => item.name)
          .sort()
          .join(" · "),
    };
  }
  if (action.kind === "spotify_control") {
    if (process.platform !== "darwin")
      throw new Error(
        "Spotify playback control is currently implemented on macOS.",
      );
    await nativeRequest({ operation: "open-app", application: "Spotify" });
    const script = path.join(
      __dirname.replace("app.asar", "app.asar.unpacked"),
      "../native/spotify.applescript",
    );
    const result = await exec("/usr/bin/osascript", [script, action.command], {
      timeout: 45000,
    });
    const state = result.stdout.trim();
    if (action.command === "play" && state !== "playing")
      return {
        kind: action.kind,
        text: "Spotify is open, but playback did not start. Select a playlist or track in Spotify, then ask DRER to play again.",
      };
    return { kind: action.kind, text: "Spotify playback: " + state + "." };
  }
  if (action.kind === "open_application") {
    if (process.platform === "darwin") {
      const result = await nativeRequest({
        operation: "open-app",
        application: resolveApplication(
          action.application,
          (await nativeRequest({ operation: "list-apps" })).applications,
        ),
      });
      return { kind: action.kind, text: `Opened ${result.application}.` };
    }
    const name = String(action.application).toLowerCase();
    const map =
      process.platform === "win32"
        ? {
            calculator: "calc.exe",
            notes: "notepad.exe",
            textedit: "notepad.exe",
          }
        : {
            calculator: "gnome-calculator",
            calendar: "gnome-calendar",
            notes: "gedit",
            textedit: "gedit",
          };
    if (!map[name])
      throw new Error(
        "Installed-app discovery for this platform still needs implementation.",
      );
    await exec(map[name], [], { timeout: 10000 });
    return { kind: action.kind, text: "Opened " + action.application + "." };
  }
  const result = await store.execute(action);
  notify("app:state", store.summary());
  return { ...result, ...store.summary() };
}
function assistantContext(history = []) {
  const recent = (Array.isArray(history) ? history : [])
    .slice(-6)
    .map((m) => (m.role === "user" ? "User: " : "DRER: ") + String(m.text || "").slice(0, 400))
    .join("\n");
  return (
    (recent ? "Recent conversation (use it to resolve words like 'them' or 'that'):\n" + recent + "\n" : "") +
    "Platform: " + process.platform + ". Home folder: " + os.homedir() +
    ". DRER notes are saved in " + store.workspace +
    ". To check something on this computer, call run_command with one concrete, short, read-only shell command (for example `ls`, `df -h`, `pmset -g batt`, `git status`); the user must approve it. Apple Notes can be read with osascript. Never use sudo or destructive commands."
  );
}
// Deterministic routing for requests with a clear intent. A small on-device
// model picks tools unreliably, so these never depend on it.
function routeIntent(q) {
  const text = q.trim();
  if (
    /\bnotes?\b/i.test(text) &&
    /\b(check|read|show|what|list|find|search|look|open|summari[sz]e|any)\b/i.test(text) &&
    !/\b(save|write|create|make|new)\b/i.test(text)
  ) {
    const m = text.match(/\b(?:about|for|mentioning|with|on)\s+(.+)$/i);
    return { kind: "notes", query: m ? m[1].replace(/[?.!]+$/, "").trim() : "" };
  }
  if (
    /\b(schedules?|calendar|meetings?|agenda|appointments?|events?)\b/i.test(text) &&
    /\b(today|tomorrow|have|what|my|do i|on)\b/i.test(text)
  ) {
    return { kind: "schedule", day: /\btomorrow\b/i.test(text) ? "tomorrow" : "today" };
  }
  if (
    /\b(list|show|what)\b.*\b(installed\s+)?(apps|applications)\b/i.test(text) ||
    /\bapps?\s+(?:are\s+)?installed\b/i.test(text)
  )
    return { kind: "list_applications" };
  if (
    /\b(screen|screenshot)\b/i.test(text) &&
    /\b(what|read|look|see|describe|explain|summari[sz]e|on)\b/i.test(text) &&
    !/\b(save|write|create)\b/i.test(text)
  )
    return { kind: "look_screen", question: text };
  return null;
}
async function runRequest(payload) {
  const question = cleanText(
    payload?.question || "Describe what is on my screen.",
  );
  let withScreen = payload?.withScreen === true;
  const requestId =
    typeof payload?.requestId === "string" && payload.requestId.length < 80
      ? payload.requestId
      : crypto.randomUUID();
  const chatId =
    typeof payload?.chatId === "string" ? payload.chatId.slice(0, 80) : null;
  const controller = new AbortController();
  requests.set(requestId, controller);
  notify("agent:busy", { busy: true, requestId, chatId });
  try {
    if (!withScreen) {
      const action = parseRequest(question) || routeIntent(question);
      if (action) {
        if (action.kind === "look_screen") {
          withScreen = true; // handled by the screen path below (needs Groq)
        } else if (action.kind === "schedule" || action.kind === "notes" || action.kind === "list_applications") {
          await configurationReady;
          if (!key && encryptedKey) {
            const decrypted = await safeStorage.decryptStringAsync(Buffer.from(encryptedKey, "base64"));
            key = decrypted.result;
          }
          const data = await executeAction(action);
          return { type: "result", route: "local-action", ...data, ...store.summary() };
        } else {
          return {
            type: "result",
            route: "local-action",
            ...(await executeAction(action)),
          };
        }
      }
    }
    await configurationReady;
    if (!key && encryptedKey) {
      const decrypted = await safeStorage.decryptStringAsync(
        Buffer.from(encryptedKey, "base64"),
      );
      key = decrypted.result;
    }
    if (!key && withScreen)
      throw new Error(
        "Screen analysis needs a Groq key. Add one in Settings. Everything else works on-device.",
      );
    const image = withScreen ? await captureScreen() : null;
    if (controller.signal.aborted) throw new Error("Request cancelled.");
    const result = await queryAI({
      key,
      model,
      context: assistantContext(payload?.history),
      question,
      image,
      signal: controller.signal,
      onProgress: (f) => notify("ai:progress", { fraction: f }),
    });
    if (result.action) {
      if (controller.signal.aborted) throw new Error("Request cancelled.");
      const kind = result.action.kind;
      if (kind === "run_command") {
        // Never run a model-chosen command without the user's explicit OK.
        const task = createTask(result.action.command, chatId);
        return { type: "task", task: taskView(task) };
      }
      if (kind === "look_screen") {
        if (!key)
          throw new Error(
            "Looking at your screen needs a Groq key (the on-device model can’t see images yet). Add one in Settings.",
          );
        const shot = await captureScreen();
        const seen = await queryAI({
          key,
          model,
          question: result.action.question,
          image: shot,
          signal: controller.signal,
        });
        return { type: "reply", ...seen, screenshot: shot };
      }
      if (kind === "schedule" || kind === "notes") {
        const data = await executeAction(result.action);
        const source =
          kind === "schedule"
            ? "their calendar and reminders for " + result.action.day
            : "their saved DRER notes";
        try {
          const answer = await queryAI({
            key,
            model,
            noTools: true,
            question:
              'The user asked: "' +
              question +
              '"\nHere is the real data from ' +
              source +
              ". Answer briefly using only this data.\n\n" +
              data.text,
            signal: controller.signal,
          });
          return { type: "reply", ...answer, text: answer.text || data.text };
        } catch {
          return { type: "result", ...data };
        }
      }
      return {
        type: "result",
        route: "ai-tool",
        model: result.model,
        tokens: result.tokens,
        ...(await executeAction(result.action)),
      };
    }
    return { type: "reply", ...result, screenshot: image };
  } catch (e) {
    return {
      type: "error",
      text: controller.signal.aborted
        ? "Request cancelled."
        : e.message || "Request failed.",
    };
  } finally {
    requests.delete(requestId);
    notify("agent:busy", { busy: false, requestId, chatId });
  }
}
handle("app:state", () => ({ ...config(), ...store.summary() }));
handle("agent:request", runRequest);
handle("agent:confirm", async (id) => {
  if (typeof id !== "string") throw new Error("Invalid action.");
  return { type: "result", ...(await executeAction(store.take(id))) };
});
handle("agent:cancel-plan", (id) => {
  if (typeof id === "string") store.cancel(id);
  return { ok: true };
});
handle("agent:cancel-reminder", async (id) => {
  const reminder = store.state.reminders.find((x) => x.id === id);
  if (!reminder || reminder.status !== "scheduled")
    throw new Error("That timer is not active.");
  if (reminder.native)
    await nativeRequest({
      operation: "complete-reminder",
      identifier: reminder.nativeId,
    });
  reminder.status = "cancelled";
  await store.persist();
  notify("app:state", store.summary());
  return store.summary();
});
handle("agent:cancel-request", (requestId) => {
  if (typeof requestId === "string") requests.get(requestId)?.abort();
  else for (const c of requests.values()) c.abort();
  return { ok: true };
});
handle("tasks:list", () => [...tasks.values()].map(taskView));
handle("tasks:approve", (id, opts) => {
  if (typeof id !== "string") throw new Error("Invalid task.");
  return startTask(id, { background: opts?.background === true });
});
handle("tasks:deny", (id) => {
  const t = tasks.get(id);
  if (t?.status === "pending") {
    t.status = "denied";
    t.endedAt = new Date().toISOString();
    publishTasks(true);
  }
  return taskView(t || {});
});
handle("tasks:stop", (id) => stopTask(id));
handle("tasks:clear", () => {
  for (const [id, t] of tasks)
    if (!["pending", "running"].includes(t.status)) tasks.delete(id);
  publishTasks(true);
  return [...tasks.values()].map(taskView);
});
handle("config:save", async (cfg) => {
  const prefs = {};
  if (typeof cfg?.launchAtLogin === "boolean") {
    launchAtLogin = cfg.launchAtLogin;
    applyLaunchAtLogin();
    prefs.launchAtLogin = launchAtLogin;
  }
  if (cfg?.aiMode !== undefined) {
    if (!AI_MODES.includes(cfg.aiMode)) throw new Error("Invalid AI mode.");
    process.env.DRER_AI = cfg.aiMode;
    prefs.aiMode = cfg.aiMode;
  }
  if (cfg?.localModel !== undefined) {
    if (!LOCAL_MODELS.includes(cfg.localModel))
      throw new Error("Invalid on-device model.");
    process.env.DRER_LOCAL_MODEL = cfg.localModel;
    prefs.localModel = cfg.localModel;
  }
  if (Object.keys(prefs).length) await patchConfig(prefs);
  if (typeof cfg?.model === "string") {
    if (!/^[A-Za-z0-9._/-]{1,120}$/.test(cfg.model))
      throw new Error("Invalid model ID.");
    model = cfg.model;
  }
  const candidate = typeof cfg?.key === "string" ? cfg.key.trim() : "";
  if (candidate) {
    if (!/^gsk_[A-Za-z0-9_-]{10,200}$/.test(candidate))
      throw new Error("That does not look like a Groq API key.");
    if (
      !(await safeStorage.isAsyncEncryptionAvailable()) ||
      (process.platform === "linux" &&
        safeStorage.getSelectedStorageBackend() === "basic_text")
    )
      throw new Error(
        "Secure key storage is unavailable. Configure GROQ_API_KEY in the environment for this session.",
      );
    const encrypted = await safeStorage.encryptStringAsync(candidate);
    await patchConfig({
      encryptedKey: encrypted.toString("base64"),
      model,
      voice: voice.options,
    });
    key = candidate;
  } else {
    await patchConfig({ model, voice: voice.options });
  }
  return config();
});
handle("voice:configure", async (options) => {
  await voice.configure(options);
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(configFile(), "utf8"));
  } catch {}
  await fs.writeFile(
    configFile(),
    JSON.stringify({ ...existing, voice: voice.options }),
    { mode: 0o600 },
  );
  return voice.options;
});
handle("voice:toggle", async (enabled) => {
  if (typeof enabled !== "boolean") throw new Error("Invalid voice setting.");
  if (enabled) voice.start();
  else voice.stop();
  savedVoiceEnabled = enabled;
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(configFile(), "utf8"));
  } catch {}
  await fs.writeFile(
    configFile(),
    JSON.stringify({ ...existing, voiceEnabled: enabled }),
    { mode: 0o600 },
  );
  return { enabled: voice.enabled };
});
handle("voice:diagnostics", () => nativeRequest({ operation: "voice-status" }));
handle("voice:voices", () => voice.voices());
handle("voice:preview", () => voice.preview());
handle("app:open-native", (application) =>
  executeAction({ kind: "open_application", application }),
);
handle("app:open-result", async (file) => {
  if (
    typeof file !== "string" ||
    !store.state.activity.some((item) => item.path === file)
  )
    throw new Error("This file was not created by DRER.");
  const error = await shell.openPath(file);
  if (error) throw new Error(error);
  return { ok: true };
});
handle("app:open-link", async (url) => {
  if (
    ![
      "https://console.groq.com/keys",
      "https://console.groq.com/docs/vision",
      "https://github.com/apreezofficial/drer",
    ].includes(url)
  )
    throw new Error("Unsupported link.");
  await shell.openExternal(url);
  return { ok: true };
});
// Ask macOS for Reminders and Calendar access. The system shows the prompt
// the first time; afterwards it just reports the current state.
async function requestMacAccess() {
  if (process.platform !== "darwin") return { reminders: false, calendar: false };
  const result = { reminders: false, calendar: false };
  for (const [key, op] of [["reminders", "authorize-reminders"], ["calendar", "authorize-calendar"]]) {
    try {
      await nativeRequest({ operation: op }, { timeout: 120000 });
      result[key] = true;
    } catch {}
  }
  notify("app:state", store.summary());
  return result;
}
handle("app:request-access", () => requestMacAccess());
handle("app:permissions", async () => {
  if (process.platform === "darwin")
    await shell.openExternal(
      "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
    );
  return config();
});
handle("app:hide", () => window.hide());
function createTray() {
  const size = 22;
  const bitmap = Buffer.alloc(size * size * 4);
  function pixel(x, y) {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      const i = (y * size + x) * 4;
      bitmap[i + 3] = 255;
    }
  }
  function line(x0, y0, x1, y1) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let n = 0; n <= steps; n++) {
      const x = Math.round(x0 + ((x1 - x0) * n) / steps),
        y = Math.round(y0 + ((y1 - y0) * n) / steps);
      pixel(x, y);
      pixel(x + 1, y);
    }
  }
  line(11, 3, 20, 19);
  line(20, 19, 2, 19);
  line(2, 19, 11, 3);
  line(7, 19, 11, 11);
  line(11, 11, 15, 19);
  const image = nativeImage.createFromBitmap(bitmap, {
    width: size,
    height: size,
    scaleFactor: 1,
  });
  image.setTemplateImage(process.platform === "darwin");
  tray = new Tray(image);
  tray.setToolTip("DRER");
  const menu = () =>
    Menu.buildFromTemplate([
      { label: "Open DRER", click: () => showWindow() },
      { label: "Settings", click: () => showWindow(true) },
      { type: "separator" },
      {
        label: "Launch at login",
        type: "checkbox",
        checked: launchAtLogin,
        enabled: app.isPackaged,
        click: async (item) => {
          launchAtLogin = item.checked;
          applyLaunchAtLogin();
          await patchConfig({ launchAtLogin });
          tray.setContextMenu(menu());
        },
      },
      {
        label: "Quit DRER",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);
  tray.setContextMenu(menu());
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => showWindow());
  app
    .whenReady()
    .then(async () => {
      if (process.platform === "darwin") app.dock.hide();
      Menu.setApplicationMenu(
        Menu.buildFromTemplate([
          {
            label: "DRER",
            submenu: [
              {
                label: "Close window",
                accelerator: "CommandOrControl+W",
                click: () => window?.hide(),
              },
              { label: "Quit DRER", role: "quit" },
            ],
          },
          { role: "editMenu" },
        ]),
      );
      store = await new ActionStore(app.getPath("userData"), {
        workspace: path.join(app.getPath("documents"), "DRER"),
        onReminder: (item) => {
          notify("reminder:due", item);
          if (!process.argv.includes("--background-test")) {
            shell.beep();
            showWindow();
          }
          if (Notification.isSupported()) {
            const n = new Notification({
              title: "DRER reminder",
              body: item.title,
              silent: false,
            });
            n.on("click", () => showWindow());
            n.show();
          }
        },
      }).init();
      try {
        if (globalShortcut.register(HOTKEY, () => showWindow()))
          shortcut = HOTKEY;
        else if (globalShortcut.register("Alt+Shift+D", () => showWindow()))
          shortcut = "Alt+Shift+D";
      } catch {}
      configurationReady = loadConfig().then(() => {
        notify("config:ready");
        applyLaunchAtLogin();
        // Ask for Reminders/Calendar up front so timers become native alerts.
        requestMacAccess().catch(() => {});
        if (savedVoiceEnabled || process.argv.includes("--voice")) {
          voice.start();
          // Preload an already-downloaded model so the first command is fast.
          if ((process.env.DRER_AI || "auto").toLowerCase() !== "groq")
            require("./local-ai")
              .warmLocal()
              .catch((e) => console.warn("DRER warm-up skipped:", e.message));
        }
      });
      await createWindow();
      await createTray();
      const timer = setInterval(
        () =>
          store.tick().catch(() =>
            notify("app:error", {
              text: "A reminder could not be delivered. Check local storage.",
            }),
          ),
        500,
      );
      timer.unref();
      if (!process.argv.includes("--background-test") && !startedHidden())
        await showWindow(process.argv.includes("--settings"));
      console.log("DRER ready. Shortcut: " + (shortcut || "use the tray menu"));
    })
    .catch((err) => {
      console.error("DRER could not start:", err.message);
      app.quit();
    });
}
app.on("activate", () => {
  if (store) showWindow();
});
app.on("before-quit", () => {
  app.isQuitting = true;
  for (const c of requests.values()) c.abort();
  for (const t of tasks.values()) t.child?.kill("SIGTERM");
  voice.stop();
});
app.on("will-quit", () => globalShortcut.unregisterAll());
app.on("window-all-closed", () => {});

module.exports = { runRequest, executeAction };

if (process.argv.includes("--background-test"))
  app.__drerTestRequest = async (question) => {
    const result = await runRequest({ question, withScreen: false });
    notify("test:result", { question, result });
    return result;
  };
