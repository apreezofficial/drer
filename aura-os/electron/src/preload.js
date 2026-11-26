const { contextBridge, ipcRenderer } = require("electron");
const listeners = new Map();
contextBridge.exposeInMainWorld("drer", {
  configureVoice: (value) => ipcRenderer.invoke("voice:configure", value),
  toggleVoice: (enabled) => ipcRenderer.invoke("voice:toggle", enabled),
  voiceDiagnostics: () => ipcRenderer.invoke("voice:diagnostics"),
  voices: () => ipcRenderer.invoke("voice:voices"),
  previewVoice: () => ipcRenderer.invoke("voice:preview"),
  state: () => ipcRenderer.invoke("app:state"),
  request: (payload) => ipcRenderer.invoke("agent:request", payload),
  confirm: (id) => ipcRenderer.invoke("agent:confirm", id),
  cancelPlan: (id) => ipcRenderer.invoke("agent:cancel-plan", id),
  cancelRequest: (requestId) =>
    ipcRenderer.invoke("agent:cancel-request", requestId),
  tasks: () => ipcRenderer.invoke("tasks:list"),
  approveTask: (id, opts) => ipcRenderer.invoke("tasks:approve", id, opts),
  denyTask: (id) => ipcRenderer.invoke("tasks:deny", id),
  stopTask: (id) => ipcRenderer.invoke("tasks:stop", id),
  clearTasks: () => ipcRenderer.invoke("tasks:clear"),
  cancelReminder: (id) => ipcRenderer.invoke("agent:cancel-reminder", id),
  saveConfig: (cfg) => ipcRenderer.invoke("config:save", cfg),
  openNative: (application) =>
    ipcRenderer.invoke("app:open-native", application),
  openResult: (file) => ipcRenderer.invoke("app:open-result", file),
  openLink: (url) => ipcRenderer.invoke("app:open-link", url),
  permissions: () => ipcRenderer.invoke("app:permissions"),
  requestAccess: () => ipcRenderer.invoke("app:request-access"),
  hide: () => ipcRenderer.invoke("app:hide"),
  on: (channel, fn) => {
    if (
      ![
        "voice:meter",
        "voice:transcript",
        "voice:state",
        "voice:wake",
        "voice:heard",
        "voice:result",
        "config:ready",
        "nav:settings",
        "app:state",
        "agent:busy",
        "reminder:due",
        "app:error",
        "ai:progress",
        "tasks:update",
        "tasks:done",
        "test:result",
      ].includes(channel) ||
      typeof fn !== "function"
    )
      return;
    const wrapper = (_, data) => fn(data);
    listeners.set(fn, { channel, wrapper });
    ipcRenderer.on(channel, wrapper);
  },
  off: (fn) => {
    const item = listeners.get(fn);
    if (item) {
      ipcRenderer.removeListener(item.channel, item.wrapper);
      listeners.delete(fn);
    }
  },
});
