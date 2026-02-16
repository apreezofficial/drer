# AuraAI — Desktop Overlay

**Created by [Precious Adedokun](https://preciousadedokun.com.ng) — [auraos.com](https://auraos.com)**

A lightweight Electron app that sits in your system tray and gives you AI-powered screen analysis over any application — press **Win+A+O** from anywhere.

## What it does

- **Win+A+O** from any app → captures your screen → sends to Groq Vision → shows AI response in a floating overlay
- The app you're in never sees the keystrokes or knows anything happened
- Works over browsers, editors, design tools, terminals — everything
- Overlay disappears on Escape, screen is unchanged

## Use cases

| You see | You ask | You get |
|---------|---------|---------|
| Dribbble design | "generate HTML + Tailwind" | Full component code |
| A bug in your editor | "fix this error" | Explanation + fix |
| Any UI | "convert to React" | React component |
| Terminal output | "what does this mean" | Plain English explanation |
| Anything | (nothing — just Win+A+O) | AI describes what it sees |

## Setup

```bash
cd aura-os/electron
npm install
```

Set your Groq API key (free at [console.groq.com](https://console.groq.com)):

```bash
# Option 1: environment variable
export GROQ_API_KEY=gsk_your_key_here
npm start

# Option 2: set it in the app
npm start
# → click tray icon → Settings → paste key → Save
```

## Running

```bash
npm start
```

The app starts silently in the system tray. Press **Win+A+O** to trigger it.

## Building a distributable

```bash
npm run build        # Windows installer (.exe)
npm run build:mac    # macOS .dmg
npm run build:linux  # Linux AppImage
```

Output goes to `dist/`.

## How the hotkey works

`globalShortcut.register('Super+A+O')` registers the hotkey at the OS level via Electron. When triggered:

1. The overlay hides briefly (so it doesn't appear in the screenshot)
2. `desktopCapturer` grabs the full screen as a PNG
3. The image is sent to Groq's `llama-3.2-11b-vision-preview` model
4. The response is rendered in the overlay with syntax-highlighted code blocks
5. Press Escape or click ✕ to dismiss

The target application receives none of the keystrokes and has no way to detect the capture.

## Project structure

```
electron/
├── src/
│   ├── main.js       Main process — hotkey, capture, Groq, tray
│   └── preload.js    Context bridge (main ↔ renderer)
├── renderer/
│   ├── overlay.html  Overlay UI
│   ├── overlay.css   Dark glass styling
│   └── overlay.js    UI logic + markdown renderer
├── assets/           Icons (add tray-icon.png here)
└── package.json
```
