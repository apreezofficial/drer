const $ = (id) => document.getElementById(id);
let state = {},
  busy = false;
function setView(name) {
  $("chat-view").hidden = name !== "chat";
  $("settings-view").hidden = name !== "settings";
  $("nav-chat").classList.toggle("active", name === "chat");
  $("nav-settings").classList.toggle("active", name === "settings");
  $("page-title").textContent =
    name === "chat" ? "A little less by hand." : "Settings";
  if (name === "settings") {
    refresh();
    loadVoiceSettings().catch(
      (error) => ($("voice-settings-status").textContent = error.message),
    );
  }
}
function message(role, text, kind = "") {
  const article = document.createElement("article");
  article.className = "message " + role + " " + kind;
  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent =
    role === "user"
      ? "YOU"
      : role === "reminder"
        ? "REMINDER DELIVERED"
        : "DRER";
  const content = document.createElement("p");
  content.textContent = text;
  article.append(label, content);
  $("messages").append(article);
  article.scrollIntoView({ block: "nearest", behavior: "smooth" });
  return article;
}
function updateCountdowns() {
  document.querySelectorAll("[data-due]").forEach((node) => {
    const seconds = Math.max(
      0,
      Math.ceil((new Date(node.dataset.due).getTime() - Date.now()) / 1000),
    );
    const h = Math.floor(seconds / 3600),
      m = Math.floor((seconds % 3600) / 60),
      s = seconds % 60;
    node.textContent =
      (h ? h + ":" : "") +
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0");
  });
}
function showReminders(items = []) {
  $("reminders").replaceChildren();
  if (!items.length) {
    const p = document.createElement("p");
    p.textContent = "No active timers. Try “set a timer for 10s”.";
    $("reminders").append(p);
  }
  for (const item of items.slice(-8).reverse()) {
    const row = document.createElement("div");
    row.className = "reminder-row " + item.status;
    const name = document.createElement("span");
    name.textContent =
      (item.status === "delivered"
        ? "✓ "
        : item.status === "cancelled"
          ? "− "
          : "◷ ") + item.title;
    const detail = document.createElement("div");
    detail.className = "reminder-detail";
    const time = document.createElement("small");
    time.textContent =
      new Date(item.dueAt).toLocaleTimeString() +
      " · " +
      (item.native ? "Apple Reminders · " : "") +
      item.status;
    detail.append(time);
    if (item.status === "scheduled") {
      const count = document.createElement("strong");
      count.className = "countdown";
      count.dataset.due = item.dueAt;
      detail.append(count);
      const cancel = document.createElement("button");
      cancel.textContent = "Cancel";
      cancel.setAttribute("aria-label", "Cancel " + item.title);
      cancel.addEventListener("click", async () => {
        try {
          const next = await window.drer.cancelReminder(item.id);
          showReminders(next.reminders);
        } catch (e) {
          message("assistant", e.message, "error");
        }
      });
      detail.append(cancel);
    }
    row.append(name, detail);
    $("reminders").append(row);
  }
  updateCountdowns();
}
setInterval(updateCountdowns, 250);
$("dismiss-alarm").addEventListener("click", () => {
  $("alarm-banner").hidden = true;
});
async function refresh() {
  state = await window.drer.state();
  $("platform-name").textContent =
    { darwin: "macOS", win32: "Windows", linux: "Linux" }[state.platform] ||
    state.platform;
  $("shortcut").textContent =
    state.platform === "darwin" &&
    state.shortcut === "CommandOrControl+Shift+Space"
      ? "⌘ + ⇧ + Space"
      : state.shortcut || "Open from the tray";
  $("connection-status").textContent = state.hasKey
    ? "Local tools + live Groq connected."
    : "Local tools ready. Add a key for AI.";
  $("key-state").textContent = state.hasKey
    ? "A key is configured. Leave the field empty to keep it."
    : "No key configured. Paste a key below to enable live AI.";
  $("model").value = state.model;
  $("screen-status").textContent =
    "Permission status: " + state.screenPermission;
  showReminders(state.reminders);
}
function setBusy(value) {
  busy = value;
  $("send").disabled = value;
  $("cancel-request").hidden = !value;
  $("request-status").textContent = value
    ? "Working on your request…"
    : "Ready · Local actions do not need an API key.";
}
function openResultButton(article, result) {
  if (result.application) {
    const open = document.createElement("button");
    open.className = "action-button";
    open.textContent = "Open " + result.service;
    open.addEventListener("click", () =>
      window.drer
        .openNative(result.application)
        .catch((e) => message("assistant", e.message, "error")),
    );
    article.append(open);
  }
  if (!result.path) return;
  const button = document.createElement("button");
  button.className = "action-button";
  button.textContent =
    result.kind === "habit_tracker"
      ? "Open working preview"
      : result.kind === "calendar_draft"
        ? "Open Calendar import draft"
        : "Open saved note";
  button.addEventListener("click", async () => {
    try {
      await window.drer.openResult(result.path);
    } catch (e) {
      message("assistant", e.message, "error");
    }
  });
  article.append(button);
}
function renderResult(result) {
  if (result.type === "plan") {
    const article = message("assistant", result.plan.text, "plan");
    const buttons = document.createElement("div");
    buttons.className = "plan-actions";
    const confirm = document.createElement("button");
    confirm.className = "action-button";
    confirm.textContent = "Confirm action";
    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    buttons.append(confirm, cancel);
    article.append(buttons);
    confirm.addEventListener("click", async () => {
      confirm.disabled = true;
      cancel.disabled = true;
      try {
        const done = await window.drer.confirm(result.plan.id);
        buttons.remove();
        const output = message("assistant", done.text, "success");
        openResultButton(output, done);
        showReminders(done.reminders);
      } catch (e) {
        message("assistant", e.message, "error");
      }
    });
    cancel.addEventListener("click", async () => {
      await window.drer.cancelPlan(result.plan.id);
      buttons.remove();
      const p = document.createElement("p");
      p.textContent = "Cancelled. Nothing changed.";
      article.append(p);
    });
    return;
  }
  const article = message(
    "assistant",
    result.text,
    result.type === "error" ? "error" : "success",
  );
  if (result.screenshot) {
    const image = document.createElement("img");
    image.src = result.screenshot;
    image.alt = "Screen shared for this request";
    image.className = "screen-result";
    article.append(image);
  }
  if (result.model) {
    const meta = document.createElement("small");
    meta.textContent = `${result.route === "ai-tool" ? "Executed through an AI tool" : "Live Groq response"} · ${result.model} · ${result.tokens} tokens`;
    article.append(meta);
  }
  if (result.reminders) showReminders(result.reminders);
  openResultButton(article, result);
}
$("request-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busy) return;
  const question = $("question").value.trim();
  if (!question) return;
  const withScreen = $("with-screen").checked;
  message(
    "user",
    question + (withScreen ? "\n[Primary screen shared with Groq]" : ""),
  );
  $("question").value = "";
  setBusy(true);
  try {
    renderResult(await window.drer.request({ question, withScreen }));
  } catch (e) {
    message("assistant", e.message, "error");
  } finally {
    setBusy(false);
  }
});
$("question").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("request-form").requestSubmit();
  }
});
$("cancel-request").addEventListener("click", () =>
  window.drer.cancelRequest(),
);
document.querySelectorAll("[data-request]").forEach((button) =>
  button.addEventListener("click", () => {
    $("question").value = button.dataset.request;
    $("question").focus();
  }),
);
$("nav-chat").addEventListener("click", () => setView("chat"));
$("nav-settings").addEventListener("click", () => setView("settings"));
$("hide").addEventListener("click", () => window.drer.hide());
$("get-key").addEventListener("click", () =>
  window.drer.openLink("https://console.groq.com/keys"),
);
$("screen-settings").addEventListener("click", () => window.drer.permissions());
$("settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("save-settings").disabled = true;
  try {
    await window.drer.saveConfig({
      key: $("api-key").value,
      model: $("model").value,
    });
    $("api-key").value = "";
    $("settings-status").textContent =
      "Settings saved. Your key is not shown or sent to the renderer.";
    await refresh();
  } catch (e) {
    $("settings-status").textContent = e.message;
  } finally {
    $("save-settings").disabled = false;
  }
});
window.drer.on("nav:settings", () => setView("settings"));
window.drer.on("app:state", (data) => showReminders(data.reminders));
window.drer.on("agent:busy", (data) => setBusy(data.busy));
window.drer.on("reminder:due", async (item) => {
  $("alarm-title").textContent = item.title;
  $("alarm-banner").hidden = false;
  message(
    "reminder",
    item.title +
      "\nDelivered at " +
      new Date(item.deliveredAt).toLocaleTimeString(),
    "success",
  );
  await refresh();
});
window.drer.on("app:error", (item) => message("assistant", item.text, "error"));
refresh().catch((e) => message("assistant", e.message, "error"));

window.drer.on("test:result", (data) => {
  const item = message("test", data.question);
  item.querySelector(".message-label").textContent = "RECORDED SYSTEM TEST";
  renderResult(data.result);
});

window.drer.on("config:ready", () => refresh());

let voiceEnabled = false,
  voiceLoaded = false;
async function loadVoiceSettings() {
  const cfg = await window.drer.state();
  const options = cfg.voice || {};
  $("wake-name").value = options.wakeName || "Buddy";
  $("spoken-replies").checked = options.spokenReplies !== false;
  if (!voiceLoaded) {
    for (const item of await window.drer.voices()) {
      const option = document.createElement("option");
      option.value = item.name;
      option.textContent = item.name + " · " + item.language;
      $("spoken-voice").append(option);
    }
    voiceLoaded = true;
  }
  $("spoken-voice").value = options.voice || "";
}
$("nav-settings").addEventListener("click", () =>
  loadVoiceSettings().catch(
    (e) => ($("voice-settings-status").textContent = e.message),
  ),
);
$("voice-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await window.drer.configureVoice({
      wakeName: $("wake-name").value,
      voice: $("spoken-voice").value,
      spokenReplies: $("spoken-replies").checked,
    });
    $("voice-settings-status").textContent = "Voice settings saved.";
  } catch (error) {
    $("voice-settings-status").textContent = error.message;
  }
});
$("voice-preview").addEventListener("click", async () => {
  try {
    await window.drer.previewVoice();
  } catch (error) {
    $("voice-settings-status").textContent = error.message;
  }
});
$("voice-toggle").addEventListener("click", async () => {
  try {
    const result = await window.drer.toggleVoice(!voiceEnabled);
    voiceEnabled = result.enabled;
    $("voice-toggle").textContent = voiceEnabled
      ? "Turn voice off"
      : "Enable voice";
  } catch (error) {
    $("voice-status").textContent = error.message;
  }
});
window.drer.on("voice:state", (data) => {
  voiceEnabled = data.enabled;
  $("voice-toggle").textContent = data.enabled
    ? "Turn voice off"
    : "Enable voice";
  $("voice-status").textContent = data.text;
});
window.drer.on("voice:heard", (data) =>
  message("user", data.question + " [voice]"),
);
window.drer.on("voice:result", renderResult);
window.drer.on("voice:wake", () => {
  $("voice-status").textContent = "Hmm? Listening for your request…";
});

window.drer.on("voice:meter", (data) => {
  $("mic-level").value = data.level;
});
window.drer.on("voice:transcript", (data) => {
  $("heard-speech").textContent = "Heard: " + data.text;
});
