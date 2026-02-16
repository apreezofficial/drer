const { contextBridge, ipcRenderer } = require("electron");
const listeners = new Map();
contextBridge.exposeInMainWorld("drer", {
  state: () => ipcRenderer.invoke("app:state"),
  request: (payload) => ipcRenderer.invoke("agent:request", payload),
  confirm: (id) => ipcRenderer.invoke("agent:confirm", id),
  cancelPlan: (id) => ipcRenderer.invoke("agent:cancel-plan", id),
  cancelRequest: () => ipcRenderer.invoke("agent:cancel-request"),
  cancelReminder: (id) => ipcRenderer.invoke("agent:cancel-reminder", id),
  saveConfig: (cfg) => ipcRenderer.invoke("config:save", cfg),
  openNative: (application) =>
    ipcRenderer.invoke("app:open-native", application),
  openResult: (file) => ipcRenderer.invoke("app:open-result", file),
  openLink: (url) => ipcRenderer.invoke("app:open-link", url),
  permissions: () => ipcRenderer.invoke("app:permissions"),
  hide: () => ipcRenderer.invoke("app:hide"),
  on: (channel, fn) => {
    if (
      ![
        "config:ready",
        "nav:settings",
        "app:state",
        "agent:busy",
        "reminder:due",
        "app:error",
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
