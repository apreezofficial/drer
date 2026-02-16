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
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const exec = promisify(execFile);
const path = require("node:path");
const fs = require("node:fs/promises");
const { pathToFileURL } = require("node:url");
const { ActionStore, parseRequest, cleanText } = require("./actions");
const { nativeRequest } = require("./native");
const { queryAI, DEFAULT_MODEL } = require("./ai");
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
  busy = false,
  controller = null,
  shortcut = "",
  configurationReady = Promise.resolve(),
  encryptedKey = null;
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
async function loadConfig() {
  await fs.mkdir(app.getPath("userData"), { recursive: true, mode: 0o700 });
  try {
    const cfg = JSON.parse(await fs.readFile(configFile(), "utf8"));
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
    width: 1000,
    height: 760,
    minWidth: 760,
    minHeight: 580,
    x: Math.max(display.x, display.x + Math.round((display.width - 1000) / 2)),
    y: Math.max(display.y, display.y + Math.round((display.height - 760) / 2)),
    backgroundColor: "#141719",
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
    model,
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
async function executeAction(action) {
  if (process.platform === "darwin" && action.kind === "reminder") {
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
        application: action.application,
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
async function runRequest(payload) {
  if (busy)
    throw new Error(
      "A request is already running. Cancel it or wait for the result.",
    );
  const question = cleanText(
    payload?.question || "Describe what is on my screen.",
  );
  const withScreen = payload?.withScreen === true;
  busy = true;
  controller = new AbortController();
  notify("agent:busy", { busy: true });
  try {
    if (!withScreen) {
      const action = parseRequest(question);
      if (action)
        return {
          type: "result",
          route: "local-action",
          ...(await executeAction(action)),
        };
    }
    await configurationReady;
    if (!key && encryptedKey) {
      const decrypted = await safeStorage.decryptStringAsync(
        Buffer.from(encryptedKey, "base64"),
      );
      key = decrypted.result;
    }
    if (!key)
      throw new Error(
        "That request needs the AI connection. Add a key in Settings, or try “set a timer for 10s”, “open calculator”, or “save a note called Ideas: my idea”.",
      );
    const image = withScreen ? await captureScreen() : null;
    if (controller.signal.aborted) throw new Error("Request cancelled.");
    const result = await queryAI({
      key,
      model,
      question,
      image,
      signal: controller.signal,
    });
    if (result.action) {
      if (controller.signal.aborted) throw new Error("Request cancelled.");
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
      text: controller?.signal.aborted
        ? "Request cancelled."
        : e.message || "Request failed.",
    };
  } finally {
    busy = false;
    controller = null;
    notify("agent:busy", { busy: false });
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
handle("agent:cancel-request", () => {
  controller?.abort();
  return { ok: true };
});
handle("config:save", async (cfg) => {
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
    await fs.writeFile(
      configFile(),
      JSON.stringify({ encryptedKey: encrypted.toString("base64"), model }),
      { mode: 0o600 },
    );
    key = candidate;
  } else {
    let existing = {};
    try {
      existing = JSON.parse(await fs.readFile(configFile(), "utf8"));
    } catch {}
    await fs.writeFile(configFile(), JSON.stringify({ ...existing, model }), {
      mode: 0o600,
    });
  }
  return config();
});
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
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Open DRER", click: () => showWindow() },
      { label: "Settings", click: () => showWindow(true) },
      { type: "separator" },
      {
        label: "Quit DRER",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
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
      configurationReady = loadConfig().then(() => notify("config:ready"));
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
      if (!process.argv.includes("--background-test"))
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
  controller?.abort();
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
