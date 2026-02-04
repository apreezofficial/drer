# AuraOS Go (DRER) & AuraOS

**Created by [Precious Adedokun](https://preciousadedokun.com.ng) · [apreezofficial](https://github.com/apreezofficial)**

An assistant for the computer you already use, and an experimental operating system exploring what comes next.

This repository contains two connected projects:

| Project | What it is | Where to start |
| --- | --- | --- |
| **AuraOS Go (DRER)** | A desktop assistant that works with your existing apps, files, reminders, and calendar. | [Desktop app](aura-os/electron/README.md) |
| **AuraOS** | An experimental x86 operating system with an AI subsystem integrated into its kernel and shell. | [Kernel project](aura-os/README.md) |

## AuraOS Go — DRER

DRER brings the AuraOS assistant idea to your current desktop. Ask by text or use a configurable wake name, then let it carry out supported actions on your computer.

The desktop app targets Windows, macOS, and Linux. **The native integrations and voice experience have been tested on macOS; equivalent Windows and Linux integrations are still in development.** You do not need to install a new operating system to use DRER.

### What works today

- **Open installed apps:** launch Mail, Spotify, a browser, or another installed app by name, with matching for common typos.
- **Control Spotify:** play or pause the current queue and skip tracks.
- **Manage reminders and your calendar:** create timed Apple Reminders alerts, save Apple Calendar events, and read your schedule with permission.
- **Save and read notes:** keep DRER notes as real files in `Documents/DRER`.
- **Use voice:** choose a wake name, pronunciation aliases, a reply voice, and a personalized greeting. The listener stays active when the window is hidden while DRER runs.
- **Ask about your screen:** explicitly share screen context for analysis through Groq, with Screen Recording permission and a configured key.
- **Run approved commands:** review a proposed shell command before it runs, follow its output, and stop the task when needed.
- **Keep separate conversations:** use multiple chats and cancel requests independently.
- **Open web searches and create a starter:** launch a search in your browser or generate the built-in habit-tracker template.

These are the current integrations, not unrestricted control of every app. Recurring automations, general autonomous browsing, and arbitrary app building remain work in progress. The habit tracker is a starter template. Spotify playback resumes the existing queue rather than selecting any requested song.

### Try it

```text
Open Mail
Play Spotify music for me
Remind me in 10 minutes to stretch
Schedule a meeting called Design review tomorrow at 10am for 30 minutes
Save a note called Ideas: Build something useful this weekend.
```

In Settings, choose a wake name such as **Buddy** and optionally add your name. Say **“Buddy”** to hear “How can I help you today?”, or say **“Buddy, open Mail”** in one sentence. “Hey” is optional.

On macOS, close the window to keep DRER in the menu bar and press **⌘⇧Space** to reopen it. Quit DRER to stop the assistant and microphone listener.

### Run the desktop app

Install Node.js and npm. macOS native builds also require Xcode Command Line Tools.

From the repository root:

```sh
cd aura-os/electron
npm ci
npm start
```

To package the current Apple Silicon macOS build:

```sh
npm run pack:mac
```

Copy `dist/mac-arm64/DRER.app` to Applications and launch it from Finder. Use the installed app for voice testing so macOS associates microphone and speech permissions with DRER. Public distribution still requires signing and notarization.

See the [desktop README](aura-os/electron/README.md) for detailed setup, voice settings, and integration tests.

### AI and permissions

Common actions have direct local routes. Flexible requests can use Groq or the on-device inference engine:

- **`auto`** prefers Groq when a key is configured and uses on-device inference without a key or if Groq is unavailable for text requests.
- **`local`** keeps inference on your computer after the initial model download. Screen analysis is unavailable in this mode.
- **`groq`** uses your configured Groq connection.

Choose the provider in Settings or with `DRER_AI`. On-device inference uses `@zeroth-ai/sdk-node`; model selection is available through `DRER_LOCAL_MODEL`. Screen analysis currently needs a Groq vision model and does not fall back to local inference.

Each user grants their own macOS permissions for the features they enable. Groq keys are encrypted in the local DRER profile and are not included in the app bundle. Voice recognition uses macOS on-device English speech recognition; commands that need AI may send their recognized text to Groq, depending on the selected provider.

Native reminders and Calendar events remain saved after DRER quits. If Reminders access is unavailable, timers fall back to DRER's local scheduler and require the app to keep running. Timed Reminders alerts are separate from Clock app alarms.

### Website

The Next.js website lives in [`web/`](web/README.md):

```sh
cd web
npm ci
npm run dev
```

The original root [`index.html`](index.html) is also retained. Website demos do not themselves execute desktop actions.

## AuraOS — the operating system

AuraOS explores the longer-term idea of an AI-native operating system. It is a separate experimental 32-bit x86 kernel written in freestanding C and NASM, booted through GRUB Multiboot and developed with QEMU.

Its existing foundation includes:

- GDT, IDT, interrupt handlers, and PIC configuration.
- Physical memory allocation and x86 paging.
- VGA text output, serial debugging, a PS/2 keyboard driver, and a PIT timer.
- An interactive shell with an AI event buffer, system-context collection, and an inference backend.
- A Groq serial-port proxy for AI requests, with a mock backend available for development.

The kernel's AI subsystem works with operating-system context such as memory statistics, timer state, and shell activity. This is research code, not a replacement for a daily-use desktop OS. Process scheduling, a filesystem, networking, and broader local inference remain on its roadmap.

### Build and run AuraOS

Set up `nasm`, the `i686-elf-gcc` / `i686-elf-ld` cross-toolchain, and `qemu-system-i386`. ISO builds additionally need `grub-mkrescue` and `xorriso`.

From the repository root:

```sh
make -C aura-os
make -C aura-os run
```

For toolchain installation, serial-proxy setup, and other build targets, see:

- [AuraOS README](aura-os/README.md)
- [Running AuraOS](aura-os/docs/run.md)
- [Kernel architecture](aura-os/docs/architecture.md)
- [AI subsystem](aura-os/docs/ai-layer.md)

## Repository layout

```text
README.md             Overview of DRER and AuraOS
index.html            Original landing page
web/                  Next.js website
  app/                Routes and styles
  components/         Shared website components
aura-os/
  electron/           AuraOS Go / DRER desktop assistant
  boot/               Multiboot entry and linker script
  kernel/             Kernel, interrupts, memory, and timers
  drivers/            Display, serial, keyboard-related support
  ai/                 Kernel AI context and inference subsystem
  shell/              Interactive kernel shell
  tools/              Host-side tools, including the Groq proxy
  docs/               Kernel architecture and setup guides
```

For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).
