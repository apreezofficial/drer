const $ = (id) => document.getElementById(id);
const qa = (sel) => [...document.querySelectorAll(sel)];
let state = {},
  busyChats = new Map(), // chatKey -> requestId
  busy = false,
  voiceEnabled = false,
  voiceLoaded = false,
  view = "chat";

/* ---------- storage (per-viewer conveniences; the app works without it) ---------- */
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

/* ---------- chats ---------- */
let chats = store.get("drer.chats", []);
let current = null;
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function saveChats() {
  chats = chats.slice(0, 50);
  store.set("drer.chats", chats);
}
function ensureChat() {
  if (current) return current;
  current = { id: newId(), title: "New chat", messages: [], at: Date.now() };
  chats.unshift(current);
  return current;
}
function renderChatList() {
  const list = $("chat-list");
  list.replaceChildren();
  const items = chats.filter((c) => c.messages.length);
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "chat-empty";
    p.textContent = "Your conversations will appear here.";
    list.append(p);
    return;
  }
  for (const chat of items) {
    const row = document.createElement("div");
    row.className = "side-item chat-item" + (chat === current ? " active" : "");
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    const title = document.createElement("span");
    title.textContent = chat.title;
    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "×";
    del.setAttribute("aria-label", "Delete chat");
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      chats = chats.filter((c) => c !== chat);
      if (current === chat) startNewChat();
      saveChats();
      renderChatList();
    });
    const open = () => openChat(chat);
    row.addEventListener("click", open);
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter") open();
    });
    row.append(title, del);
    list.append(row);
  }
}
function openChat(chat) {
  current = chat;
  $("messages").replaceChildren();
  for (const m of chat.messages) message(m.role, m.text, m.kind, false);
  syncEmpty();
  setView("chat");
  renderChatList();
}
function startNewChat() {
  current = null;
  $("messages").replaceChildren();
  syncEmpty();
  renderChatList();
  setView("chat");
  $("question").focus();
}
function syncEmpty() {
  $("chat-scroll").classList.toggle("has-messages", $("messages").children.length > 0);
}

/* ---------- views ---------- */
function setView(name) {
  view = name;
  const settings = name === "settings";
  $("app").classList.toggle("settings-open", settings);
  $("settings").hidden = !settings;
  for (const id of ["chat", "tasks", "voice"]) $("view-" + id).hidden = id !== name;
  qa(".rail-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
  if (settings) {
    refresh();
    loadVoiceSettings().catch((e) => ($("voice-settings-status").textContent = e.message));
  }
}
function showSection(name) {
  qa(".pane").forEach((p) => (p.hidden = p.id !== "pane-" + name));
  qa("[data-section]").forEach((b) => b.classList.toggle("active", b.dataset.section === name));
}
const sectionWords = {
  general: "general app launch login shortcut workspace",
  ai: "ai models provider on-device groq key vision model local",
  voice: "voice wake name speech reply speak microphone",
  permissions: "permissions screen recording capture privacy",
  about: "about version help build",
};
$("settings-search").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  let first = null;
  qa("[data-section]").forEach((b) => {
    const hit = !q || (b.textContent + " " + sectionWords[b.dataset.section]).toLowerCase().includes(q);
    b.hidden = !hit;
    if (hit && !first) first = b.dataset.section;
  });
  if (first && q) showSection(first);
});

/* ---------- messages ---------- */
/* ---------- markdown (safe: builds DOM nodes, never innerHTML) ---------- */
function inline(parent, text) {
  // **bold**, `code`, [label](https://...) — everything else is plain text.
  const re = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\(https?:\/\/[^\s)]+\))/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parent.append(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) {
      const b = document.createElement("strong");
      b.textContent = tok.slice(2, -2);
      parent.append(b);
    } else if (tok.startsWith("`")) {
      const c = document.createElement("code");
      c.textContent = tok.slice(1, -1);
      parent.append(c);
    } else {
      const [, label, url] = tok.match(/^\[([^\]]+)\]\((.+)\)$/);
      const a = document.createElement("span");
      a.className = "md-link";
      a.textContent = label;
      a.title = url;
      parent.append(a);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) parent.append(text.slice(last));
}
function renderMarkdown(container, text) {
  const lines = String(text).replace(/\r/g, "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const body = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++;
      const pre = document.createElement("pre");
      pre.className = "md-code";
      pre.textContent = body.join("\n");
      container.append(pre);
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const el = document.createElement(h[1].length === 1 ? "h2" : h[1].length === 2 ? "h3" : "h4");
      el.className = "md-h";
      inline(el, h[2]);
      container.append(el);
      i++;
      continue;
    }
    if (/^\s*([-*•])\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const list = document.createElement(ordered ? "ol" : "ul");
      list.className = "md-list";
      while (i < lines.length && (ordered ? /^\s*\d+[.)]\s+/ : /^\s*([-*•])\s+/).test(lines[i])) {
        const li = document.createElement("li");
        inline(li, lines[i].replace(/^\s*(?:[-*•]|\d+[.)])\s+/, ""));
        list.append(li);
        i++;
      }
      container.append(list);
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const p = document.createElement("p");
    inline(p, line);
    container.append(p);
    i++;
  }
}

function message(role, text, kind = "", persist = true) {
  const article = document.createElement("article");
  article.className = "message " + role + " " + kind;
  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "reminder" ? "Reminder delivered" : role === "test" ? "Recorded system test" : "DRER";
  const content = document.createElement("div");
  content.className = "md";
  if (role === "assistant" && kind !== "error" && kind !== "task") renderMarkdown(content, text);
  else {
    const p = document.createElement("p");
    p.textContent = text;
    content.append(p);
  }
  article.append(label, content);
  $("messages").append(article);
  syncEmpty();
  article.scrollIntoView({ block: "nearest", behavior: "smooth" });
  if (persist && role !== "test" && kind !== "task") {
    const chat = ensureChat();
    chat.messages.push({ role, text: String(text).slice(0, 4000), kind });
    chat.messages = chat.messages.slice(-200);
    if (chat.title === "New chat" && role === "user")
      chat.title = String(text).replace(/\s+/g, " ").trim().slice(0, 48) || "New chat";
    chat.at = Date.now();
    saveChats();
    renderChatList();
  }
  return article;
}

/* ---------- reminders ---------- */
function updateCountdowns() {
  document.querySelectorAll("[data-due]").forEach((node) => {
    const seconds = Math.max(0, Math.ceil((new Date(node.dataset.due).getTime() - Date.now()) / 1000));
    const h = Math.floor(seconds / 3600),
      m = Math.floor((seconds % 3600) / 60),
      s = seconds % 60;
    node.textContent = (h ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  });
}
function showReminders(items = []) {
  const box = $("reminders");
  box.replaceChildren();
  if (!items.length) {
    const p = document.createElement("p");
    p.textContent = "No reminders yet. Try “set a timer for 10 seconds”.";
    box.append(p);
  }
  for (const item of items.slice(-20).reverse()) {
    const row = document.createElement("div");
    row.className = "reminder-row " + item.status;
    const name = document.createElement("span");
    name.textContent = (item.status === "delivered" ? "✓ " : item.status === "cancelled" ? "– " : "") + item.title;
    const detail = document.createElement("div");
    detail.className = "reminder-detail";
    const time = document.createElement("small");
    time.textContent =
      new Date(item.dueAt).toLocaleTimeString() + " · " + (item.native ? "Apple Reminders · " : "") + item.status;
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
          showReminders((await window.drer.cancelReminder(item.id)).reminders);
        } catch (e) {
          message("assistant", e.message, "error");
        }
      });
      detail.append(cancel);
    }
    row.append(name, detail);
    box.append(row);
  }
  updateCountdowns();
}
setInterval(updateCountdowns, 250);
$("dismiss-alarm").addEventListener("click", () => ($("alarm-banner").hidden = true));

/* ---------- state ---------- */
const modeLabel = { auto: "On-device", local: "On-device only", groq: "Groq" };
function setSwitch(el, on) {
  el.setAttribute("aria-checked", on ? "true" : "false");
}
async function refresh() {
  state = await window.drer.state();
  $("platform-name").textContent = { darwin: "macOS", win32: "Windows", linux: "Linux" }[state.platform] || state.platform;
  const shortcut =
    state.platform === "darwin" && state.shortcut === "CommandOrControl+Shift+Space"
      ? "⌘ ⇧ Space"
      : state.shortcut || "Open from the menu bar";
  $("shortcut").textContent = shortcut;
  $("shortcut-2").textContent = shortcut;
  const mode = state.aiMode || "auto";
  $("connection-status").textContent =
    mode === "groq" ? (state.hasKey ? "Groq connected" : "Add a Groq key") : state.hasKey ? "On-device + Groq" : "On-device AI";
  $("status-dot").classList.toggle("warn", mode === "groq" && !state.hasKey);
  $("mode-chip").textContent = modeLabel[mode] || "On-device";
  $("key-state").textContent = state.hasKey
    ? "A key is configured. Leave the field empty to keep it."
    : "No key configured. Needed for screen analysis.";
  $("model").value = state.model || "";
  $("screen-status").textContent = "Permission status: " + state.screenPermission;
  $("workspace-path").textContent = state.workspace || "—";
  $("app-version").textContent = state.version || "—";
  setSwitch($("set-login"), state.launchAtLogin !== false);
  $("set-login").disabled = !state.canLaunchAtLogin;
  $("set-login").title = state.canLaunchAtLogin ? "" : "Available in the packaged app";
  qa("#ai-mode button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === mode)));
  $("local-model").value = state.localModel || "auto";
  showReminders(state.reminders);
}
const chatKey = () => (current ? current.id : "new");
function setBusy(value) {
  busy = busyChats.has(chatKey());
  $("send").disabled = false;
  $("cancel-request").hidden = !busy;
  $("request-status").textContent = busy
    ? "Working on this request…"
    : busyChats.size
      ? busyChats.size + " request" + (busyChats.size > 1 ? "s" : "") + " running in other chats"
      : "Ready";
  updateActivityBadge();
}

/* ---------- results ---------- */
function openResultButton(article, result) {
  if (result.application) {
    const open = document.createElement("button");
    open.className = "action-button";
    open.textContent = "Open " + result.service;
    open.addEventListener("click", () =>
      window.drer.openNative(result.application).catch((e) => message("assistant", e.message, "error")),
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
  if (result.type === "task") return renderTaskCard(result.task);
  if (result.type === "plan") {
    const article = message("assistant", result.plan.text, "plan");
    const buttons = document.createElement("div");
    buttons.className = "plan-actions";
    const confirm = document.createElement("button");
    confirm.className = "action-button";
    confirm.textContent = "Confirm action";
    const cancel = document.createElement("button");
    cancel.className = "pill";
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
  const article = message("assistant", result.text, result.type === "error" ? "error" : "success");
  if (result.screenshot) {
    const image = document.createElement("img");
    image.src = result.screenshot;
    image.alt = "Screen shared for this request";
    image.className = "screen-result";
    article.append(image);
  }
  if (result.model) {
    const meta = document.createElement("small");
    const how = result.route === "ai-tool" ? "Action via AI tool" : result.local ? "On-device response" : "Groq response";
    meta.textContent = [how, result.model, result.tokens ? result.tokens + " tokens" : ""].filter(Boolean).join(" · ");
    article.append(meta);
  }
  if (result.reminders) showReminders(result.reminders);
  openResultButton(article, result);
  hideProgress();
}

/* ---------- composer ---------- */
function setScreen(on) {
  $("with-screen").checked = on;
  $("screen-chip").setAttribute("aria-pressed", String(on));
  $("screen-chip-text").textContent = on ? "Screen shared" : "This computer";
  document.querySelector(".screen-toggle").hidden = !on;
}
setScreen(false);
$("screen-chip").addEventListener("click", () => setScreen(!$("with-screen").checked));
$("with-screen").addEventListener("change", (e) => setScreen(e.target.checked));
function autoGrow() {
  const t = $("question");
  t.style.height = "auto";
  t.style.height = Math.min(180, t.scrollHeight) + "px";
}
$("question").addEventListener("input", autoGrow);
$("request-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const question = $("question").value.trim();
  if (!question) return;
  const withScreen = $("with-screen").checked;
  const chat = ensureChat();
  const key = chat.id;
  if (busyChats.has(key)) return;
  message("user", question + (withScreen ? "\n[Primary screen shared with Groq]" : ""));
  $("question").value = "";
  autoGrow();
  const requestId = newId();
  busyChats.set(key, requestId);
  setBusy();
  try {
    const history = chat.messages.slice(-7, -1);
    const result = await window.drer.request({ question, withScreen, requestId, chatId: key, history });
    renderResult(result, key);
  } catch (err) {
    message("assistant", err.message, "error");
  } finally {
    busyChats.delete(key);
    setBusy();
  }
});
$("question").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
    e.preventDefault();
    $("request-form").requestSubmit();
  }
});
$("cancel-request").addEventListener("click", () => {
  const id = busyChats.get(chatKey());
  if (id) window.drer.cancelRequest(id);
});
qa("[data-request]").forEach((button) =>
  button.addEventListener("click", () => {
    $("question").value = button.dataset.request;
    autoGrow();
    $("question").focus();
  }),
);

/* ---------- model download progress ---------- */
let hideTimer = null;
function hideProgress() {
  clearTimeout(hideTimer);
  $("progress-banner").hidden = true;
}
window.drer.on("ai:progress", ({ fraction }) => {
  const f = Math.max(0, Math.min(1, Number(fraction) || 0));
  $("progress-banner").hidden = false;
  $("model-progress").value = f;
  $("progress-text").textContent =
    f >= 1 ? "Model ready." : "Downloading the model once (" + Math.round(f * 100) + "%). After this, nothing leaves your computer.";
  clearTimeout(hideTimer);
  if (f >= 1) hideTimer = setTimeout(hideProgress, 1500);
});


/* ---------- commands (approval, live output, background) ---------- */
let tasksById = new Map();
const taskCards = new Map(); // taskId -> element in chat
const statusWords = {
  pending: "Waiting for your approval",
  running: "Running",
  done: "Finished",
  failed: "Failed",
  stopped: "Stopped",
  denied: "Denied",
};
function renderTaskCard(task) {
  tasksById.set(task.id, task);
  const article = message("assistant", "DRER wants to run a command on this computer.", "task");
  const code = document.createElement("pre");
  code.className = "cmd";
  code.textContent = "$ " + task.command;
  const status = document.createElement("small");
  status.className = "task-status";
  const out = document.createElement("pre");
  out.className = "cmd-out";
  out.hidden = true;
  const buttons = document.createElement("div");
  buttons.className = "plan-actions";
  const approve = document.createElement("button");
  approve.className = "action-button";
  approve.textContent = "Approve & run";
  const bg = document.createElement("button");
  bg.className = "pill";
  bg.textContent = "Run in background";
  const deny = document.createElement("button");
  deny.className = "pill";
  deny.textContent = "Deny";
  buttons.append(approve, bg, deny);
  const stop = document.createElement("button");
  stop.className = "pill";
  stop.textContent = "Stop";
  stop.hidden = true;
  article.append(code, status, out, buttons, stop);
  taskCards.set(task.id, { article, status, out, buttons, stop });
  const go = async (background) => {
    approve.disabled = bg.disabled = deny.disabled = true;
    try {
      const t = await window.drer.approveTask(task.id, { background });
      applyTask(t);
    } catch (e) {
      status.textContent = e.message;
    }
  };
  approve.addEventListener("click", () => go(false));
  bg.addEventListener("click", () => go(true));
  deny.addEventListener("click", async () => {
    buttons.remove();
    applyTask(await window.drer.denyTask(task.id));
  });
  stop.addEventListener("click", () => window.drer.stopTask(task.id));
  applyTask(task);
  return article;
}
function applyTask(t) {
  if (!t || !t.id) return;
  tasksById.set(t.id, t);
  const card = taskCards.get(t.id);
  if (card) {
    card.status.textContent = statusWords[t.status] + (t.background ? " · background" : "") + (t.exitCode != null ? " · exit " + t.exitCode : "");
    card.out.hidden = !t.output;
    card.out.textContent = t.output || "";
    card.out.scrollTop = card.out.scrollHeight;
    card.stop.hidden = t.status !== "running";
    if (t.status !== "pending") card.buttons.remove();
  }
  renderActivity();
  updateActivityBadge();
}
function renderActivity() {
  const box = $("tasks");
  if (!box) return;
  box.replaceChildren();
  const list = [...tasksById.values()].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  if (!list.length) {
    const p = document.createElement("p");
    p.textContent = "No commands yet. When DRER proposes one, it appears here and in the chat for your approval.";
    box.append(p);
    return;
  }
  for (const t of list) {
    const row = document.createElement("div");
    row.className = "task-row " + t.status;
    const head = document.createElement("div");
    head.className = "task-head";
    const cmd = document.createElement("code");
    cmd.textContent = "$ " + t.command;
    const st = document.createElement("small");
    st.textContent = statusWords[t.status] + (t.background ? " · background" : "");
    head.append(cmd, st);
    row.append(head);
    if (t.output) {
      const o = document.createElement("pre");
      o.className = "cmd-out";
      o.textContent = t.output.slice(-1500);
      row.append(o);
    }
    if (t.status === "running") {
      const b = document.createElement("button");
      b.className = "pill";
      b.textContent = "Stop";
      b.addEventListener("click", () => window.drer.stopTask(t.id));
      row.append(b);
    }
    box.append(row);
  }
}
function updateActivityBadge() {
  const running = [...tasksById.values()].filter((t) => t.status === "running" || t.status === "pending").length;
  const badge = $("activity-badge");
  if (!badge) return;
  badge.hidden = !running;
  badge.textContent = String(running);
}
window.drer.on("tasks:update", (list) => {
  for (const t of list) tasksById.set(t.id, t);
  for (const t of list) applyTask(t);
});
window.drer.on("tasks:done", (t) => applyTask(t));
window.drer.tasks().then((list) => {
  for (const t of list) tasksById.set(t.id, t);
  renderActivity();
  updateActivityBadge();
});
$("clear-tasks").addEventListener("click", async () => {
  await window.drer.clearTasks();
  for (const [id, t] of tasksById) if (!["pending", "running"].includes(t.status)) tasksById.delete(id);
  renderActivity();
  updateActivityBadge();
});

/* ---------- navigation ---------- */
qa(".rail-btn").forEach((b) => b.addEventListener("click", () => setView(b.dataset.view)));
qa("[data-section]").forEach((b) => b.addEventListener("click", () => showSection(b.dataset.section)));
$("new-chat").addEventListener("click", startNewChat);
window.drer.on("nav:settings", () => setView("settings"));
window.drer.on("app:state", (data) => showReminders(data.reminders));
window.drer.on("agent:busy", (data) => {
  // The submit handler owns busyChats for chat requests; this covers voice.
  if (!data.busy && data.requestId && !busyChats.has(data.chatId)) return;
  if (data.busy && data.requestId && data.chatId && !busyChats.has(data.chatId))
    busyChats.set(data.chatId, data.requestId);
  setBusy();
});
window.drer.on("reminder:due", async (item) => {
  $("alarm-title").textContent = item.title;
  $("alarm-banner").hidden = false;
  message("reminder", item.title + "\nDelivered at " + new Date(item.deliveredAt).toLocaleTimeString(), "success");
  await refresh();
});
window.drer.on("app:error", (item) => message("assistant", item.text, "error"));
window.drer.on("test:result", (data) => {
  message("test", data.question, "", false);
  renderResult(data.result);
});
window.drer.on("config:ready", () => refresh());

/* ---------- settings: save handlers ---------- */
async function save(patch, statusEl) {
  try {
    await window.drer.saveConfig(patch);
    await refresh();
    return true;
  } catch (e) {
    if (statusEl) statusEl.textContent = e.message;
    return false;
  }
}
$("set-login").addEventListener("click", () =>
  save({ launchAtLogin: $("set-login").getAttribute("aria-checked") !== "true" }),
);
qa("#ai-mode button").forEach((b) => b.addEventListener("click", () => save({ aiMode: b.dataset.mode })));
$("local-model").addEventListener("change", (e) => save({ localModel: e.target.value }));
$("get-key").addEventListener("click", () => window.drer.openLink("https://console.groq.com/keys"));
$("screen-settings").addEventListener("click", () => window.drer.permissions());
$("settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("save-settings").disabled = true;
  const status = $("settings-status");
  status.textContent = "";
  const ok = await save({ key: $("api-key").value, model: $("model").value }, status);
  if (ok) {
    $("api-key").value = "";
    status.textContent = "Saved. Your key is encrypted and never sent to this window.";
  }
  $("save-settings").disabled = false;
});

/* ---------- voice ---------- */
function paintVoice(enabled, text) {
  voiceEnabled = enabled;
  $("voice-toggle").textContent = enabled ? "Turn voice off" : "Enable voice";
  $("voice-headline").textContent = enabled ? "Listening" : "Voice is off";
  $("orb").classList.toggle("live", enabled);
  $("composer-mic").classList.toggle("on", enabled);
  if (text) $("voice-status").textContent = text;
  if (enabled) $("voice-tip").hidden = true;
}
async function toggleVoice() {
  try {
    const result = await window.drer.toggleVoice(!voiceEnabled);
    paintVoice(result.enabled);
  } catch (error) {
    $("voice-status").textContent = error.message;
    setView("voice");
  }
}
$("voice-toggle").addEventListener("click", toggleVoice);
$("composer-mic").addEventListener("click", toggleVoice);
$("tip-enable-voice").addEventListener("click", toggleVoice);
$("tip-dismiss").addEventListener("click", () => {
  $("voice-tip").hidden = true;
  store.set("drer.tipDismissed", true);
});
window.drer.on("voice:state", (data) => paintVoice(data.enabled, data.text));
window.drer.on("voice:heard", (data) => message("user", data.question + " [voice]"));
window.drer.on("voice:result", renderResult);
window.drer.on("voice:wake", () => {
  $("voice-status").textContent = "Hmm? Listening for your request…";
});
window.drer.on("voice:meter", (data) => ($("mic-level").value = data.level));
window.drer.on("voice:transcript", (data) => ($("heard-speech").textContent = "Heard: " + data.text));

async function loadVoiceSettings() {
  const cfg = await window.drer.state();
  const options = cfg.voice || {};
  $("wake-name").value = options.wakeName || "Buddy";
  $("preferred-name").value = options.preferredName || "";
  $("wake-aliases").value = (options.wakeAliases || []).join(", ");
  $("spoken-replies").checked = options.spokenReplies !== false;
  setSwitch($("spoken-replies-switch"), $("spoken-replies").checked);
  if (!voiceLoaded) {
    voiceLoaded = true;
    try {
      for (const item of await window.drer.voices()) {
        const option = document.createElement("option");
        option.value = item.name;
        option.textContent = item.name + " · " + item.language;
        $("spoken-voice").append(option);
      }
    } catch {
      voiceLoaded = false;
    }
  }
  $("spoken-voice").value = options.voice || "";
}
$("spoken-replies-switch").addEventListener("click", () => {
  const on = $("spoken-replies-switch").getAttribute("aria-checked") !== "true";
  $("spoken-replies").checked = on;
  setSwitch($("spoken-replies-switch"), on);
});
$("voice-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await window.drer.configureVoice({
      wakeName: $("wake-name").value,
      preferredName: $("preferred-name").value,
      wakeAliases: $("wake-aliases").value.split(","),
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

/* ---------- boot ---------- */
(async function boot() {
  const started = performance.now();
  renderChatList();
  try {
    await refresh();
    $("voice-tip").hidden = Boolean(store.get("drer.tipDismissed", false)) || voiceEnabled;
  } catch (e) {
    message("assistant", e.message, "error", false);
  }
  // Keep the loading state up long enough to read as intentional, not a flash.
  const wait = Math.max(0, 900 - (performance.now() - started));
  setTimeout(() => $("splash").classList.add("done"), wait);
})();
