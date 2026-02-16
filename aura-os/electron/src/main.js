/**
 * AuraAI — Main Process
 *
 * Responsibilities:
 *  - System tray icon + menu
 *  - Global hotkey registration (Win+A+O)
 *  - Screen capture via desktopCapturer
 *  - Groq Vision API call
 *  - Overlay window management
 *
 * Created by Precious Adedokun — https://preciousadedokun.com.ng
 * Project: https://auraos.com
 */

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
} = require('electron');

const path = require('path');
const fs   = require('fs');

// ---- Config ----------------------------------------------------------------

const HOTKEY        = 'Super+A+O';   // Win+A+O
const HOTKEY_ALT    = 'Alt+Shift+A'; // fallback if Super combo fails
const OVERLAY_W     = 680;
const OVERLAY_H     = 520;
const GROQ_MODEL    = 'llama-3.2-11b-vision-preview';
const CONFIG_FILE   = path.join(app.getPath('userData'), 'config.json');

// ---- State -----------------------------------------------------------------

let overlayWindow  = null;
let tray           = null;
let isCapturing    = false;
let groqApiKey     = '';
let isDev          = process.argv.includes('--dev');

// ---- Config persistence ----------------------------------------------------

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      groqApiKey = cfg.groqApiKey || process.env.GROQ_API_KEY || '';
    } else {
      groqApiKey = process.env.GROQ_API_KEY || '';
    }
  } catch {
    groqApiKey = process.env.GROQ_API_KEY || '';
  }
}

function saveConfig(cfg) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  } catch (e) {
    console.error('Failed to save config:', e);
  }
}

// ---- Overlay window --------------------------------------------------------

function createOverlay() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width:           OVERLAY_W,
    height:          OVERLAY_H,
    x:               Math.round((width  - OVERLAY_W) / 2),
    y:               Math.round((height - OVERLAY_H) / 2),
    frame:           false,
    transparent:     true,
    alwaysOnTop:     true,
    skipTaskbar:     true,
    resizable:       true,
    movable:         true,
    show:            false,
    webPreferences: {
      nodeIntegration:     false,
      contextIsolation:    true,
      preload:             path.join(__dirname, 'preload.js'),
    },
  });

  overlayWindow.loadFile(path.join(__dirname, '../renderer/overlay.html'));

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  // Close on Escape
  overlayWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      hideOverlay();
    }
  });

  if (isDev) {
    overlayWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function showOverlay() {
  if (!overlayWindow) createOverlay();
  overlayWindow.show();
  overlayWindow.focus();
}

function hideOverlay() {
  if (overlayWindow) {
    overlayWindow.hide();
  }
}

// ---- Screen capture --------------------------------------------------------

async function captureScreen() {
  const sources = await desktopCapturer.getSources({
    types:          ['screen'],
    thumbnailSize:  { width: 1920, height: 1080 },
  });

  if (!sources.length) return null;

  // Use the primary display source
  const primary = sources[0];
  return primary.thumbnail.toDataURL(); // base64 PNG data URL
}

// ---- Groq Vision call ------------------------------------------------------

async function queryGroqVision(imageDataUrl, question) {
  if (!groqApiKey) {
    return {
      success: false,
      text: 'No Groq API key set. Click the tray icon → Settings to add your key.\nGet a free key at https://console.groq.com',
    };
  }

  // Strip the data URL prefix to get raw base64
  const base64 = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');

  const prompt = question && question.trim()
    ? question.trim()
    : 'Analyse this screen. Describe what you see and provide any relevant code, suggestions, or insights. Be specific and actionable.';

  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: groqApiKey });

    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content:
            'You are AuraAI, a screen-aware AI assistant. ' +
            'You can see the user\'s screen and help them with whatever they\'re working on. ' +
            'If you see a UI design, generate clean HTML/CSS/Tailwind code for it. ' +
            'If you see code, help debug or improve it. ' +
            'If you see an error, explain and fix it. ' +
            'Be concise and practical. Format code in markdown code blocks.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64}`,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    return {
      success: true,
      text: response.choices[0].message.content,
      model: GROQ_MODEL,
      tokens: response.usage?.total_tokens || 0,
    };
  } catch (err) {
    console.error('Groq error:', err);
    return {
      success: false,
      text: `Groq error: ${err.message || err}`,
    };
  }
}

// ---- Hotkey trigger --------------------------------------------------------

async function triggerScreenAI(question = null) {
  if (isCapturing) return;
  isCapturing = true;

  try {
    // Hide overlay first so it doesn't appear in the screenshot
    hideOverlay();

    // Small delay to let the overlay fully hide
    await new Promise(r => setTimeout(r, 150));

    // Show overlay in loading state
    showOverlay();
    if (overlayWindow) {
      overlayWindow.webContents.send('ai:loading', { question });
    }

    // Capture the screen
    const imageDataUrl = await captureScreen();
    if (!imageDataUrl) {
      if (overlayWindow) {
        overlayWindow.webContents.send('ai:result', {
          success: false,
          text: 'Screen capture failed.',
          screenshot: null,
        });
      }
      return;
    }

    // Query Groq
    const result = await queryGroqVision(imageDataUrl, question);

    // Send result to overlay
    if (overlayWindow) {
      overlayWindow.webContents.send('ai:result', {
        ...result,
        screenshot: imageDataUrl,
      });
    }
  } catch (err) {
    console.error('triggerScreenAI error:', err);
    if (overlayWindow) {
      overlayWindow.webContents.send('ai:result', {
        success: false,
        text: `Error: ${err.message}`,
        screenshot: null,
      });
    }
  } finally {
    isCapturing = false;
  }
}

// ---- IPC handlers ----------------------------------------------------------

ipcMain.handle('ai:query', async (event, { question }) => {
  await triggerScreenAI(question);
});

ipcMain.handle('ai:capture-and-query', async (event, { question }) => {
  await triggerScreenAI(question);
});

ipcMain.on('overlay:hide', () => {
  hideOverlay();
});

ipcMain.handle('config:get', () => {
  return { groqApiKey: groqApiKey ? '***' + groqApiKey.slice(-4) : '' };
});

ipcMain.handle('config:set', (event, { groqApiKey: key }) => {
  groqApiKey = key;
  saveConfig({ groqApiKey: key });
  return { success: true };
});

ipcMain.handle('config:get-key', () => {
  return { groqApiKey };
});

// ---- Tray ------------------------------------------------------------------

function createTray() {
  // Use a simple programmatic icon if no asset file exists
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  let icon;

  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    // 16x16 transparent placeholder
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('AuraAI — Win+A+O to analyse screen');

  const menu = Menu.buildFromTemplate([
    {
      label: 'AuraAI',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Analyse Screen  (Win+A+O)',
      click: () => triggerScreenAI(),
    },
    {
      label: 'Settings',
      click: () => {
        showOverlay();
        if (overlayWindow) {
          overlayWindow.webContents.send('nav:settings');
        }
      },
    },
    { type: 'separator' },
    {
      label: 'GitHub',
      click: () => shell.openExternal('https://auraos.com'),
    },
    {
      label: 'Get Groq API Key',
      click: () => shell.openExternal('https://console.groq.com'),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ]);

  tray.setContextMenu(menu);
  tray.on('click', () => triggerScreenAI());
}

// ---- App lifecycle ---------------------------------------------------------

app.whenReady().then(() => {
  loadConfig();
  createTray();
  createOverlay();

  // Register global hotkey — Win+A+O
  // On Windows "Super" = Windows key
  let registered = globalShortcut.register(HOTKEY, () => {
    triggerScreenAI();
  });

  if (!registered) {
    console.warn(`Hotkey ${HOTKEY} failed, trying fallback ${HOTKEY_ALT}`);
    globalShortcut.register(HOTKEY_ALT, () => {
      triggerScreenAI();
    });
  }

  console.log('AuraAI running. Hotkey: Win+A+O');
  console.log('Groq key:', groqApiKey ? 'set' : 'NOT SET — open tray → Settings');
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Keep app running when all windows are closed (tray app)
app.on('window-all-closed', (e) => {
  e.preventDefault();
});
