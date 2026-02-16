/**
 * AuraAI — Preload Script
 * Exposes a safe, typed bridge between the renderer and main process.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('aura', {
  // Trigger a screen capture + AI query
  query: (question) =>
    ipcRenderer.invoke('ai:capture-and-query', { question }),

  // Hide the overlay
  hide: () => ipcRenderer.send('overlay:hide'),

  // Config
  getConfig: () => ipcRenderer.invoke('config:get'),
  getKey:    () => ipcRenderer.invoke('config:get-key'),
  setConfig: (cfg) => ipcRenderer.invoke('config:set', cfg),

  // Listen for events from main
  on: (channel, fn) => {
    const allowed = ['ai:loading', 'ai:result', 'nav:settings'];
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => fn(...args));
    }
  },

  off: (channel, fn) => {
    ipcRenderer.removeListener(channel, fn);
  },
});
