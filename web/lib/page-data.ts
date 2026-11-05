import { repository as repo, prototypeSource, kernelGuide } from "./site";
export type PageCard = {
  title: string;
  description: string;
  label?: string;
  href?: string;
};
export type PageData = {
  title: string;
  eyebrow: string;
  description: string;
  status: string;
  visual: string;
  primary: { title: string; href: string };
  sectionTitle: string;
  sectionDescription: string;
  cards: PageCard[];
  closing: string;
  closingText: string;
};
export const pages: Record<string, PageData> = {
  agent: {
    title: "A word from you.\nA way forward.",
    eyebrow: "THE DRER AGENT",
    description:
      "An open-source assistant for your computer and connected tools. Call DRER to plan, remember, research, automate, or build. One conversation, with more ways to help.",
    status: "Product vision · In development",
    visual: "agent",
    primary: { title: "Explore the prototype", href: "/desktop" },
    sectionTitle: "More than a chat window.",
    sectionDescription:
      "Screen context is a starting point. The direction is an agent that can understand a request, make a plan, and help carry it through.",
    cards: [
      {
        title: "Call it by name",
        description:
          "A wake phrase, a keyboard shortcut, or text should be enough to begin. Voice activation is planned.",
        label: "VOICE · PLANNED",
      },
      {
        title: "Bring your world into context",
        description:
          "Read a shared screen, work with files, and research across connected tools. Screen analysis exists in the prototype; broader tools are planned.",
        label: "CONTEXT",
        href: "/desktop",
      },
      {
        title: "Make a plan that matters",
        description:
          "Prepare events, reminders, research, and app-building steps that you can review before anything changes.",
        label: "ACTION · PLANNED",
        href: "/automations",
      },
    ],
    closing: "You stay part of the conversation.",
    closingText:
      "Visible progress, interruptible work, and review before consequential actions are part of the design direction. We are building the agent and these controls together.",
  },
  products: {
    title: "One idea.\nMore ways to build it.",
    eyebrow: "PRODUCTS",
    description:
      "DRER brings the assistant to the computer you already use. AuraOS explores the longer-term operating system. Here is how the pieces fit together.",
    status: "Open-source project",
    visual: "products",
    primary: { title: "Get started", href: "/get-started" },
    sectionTitle: "Explore the DRER ecosystem.",
    sectionDescription:
      "Each part has a different role and a clear development status.",
    cards: [
      {
        title: "DRER desktop",
        description:
          "The existing Electron prototype: capture your screen on request and get an AI explanation in a floating overlay.",
        label: "PROTOTYPE",
        href: "/desktop",
      },
      {
        title: "Everyday automations",
        description:
          "Calendars, alarms, reminders, meetings, and recurring briefings. Connected workflows are planned.",
        label: "PLANNED",
        href: "/automations",
      },
      {
        title: "Build with DRER",
        description:
          "Describe an app, website, or small tool. The goal is to create, preview, and refine it in a conversation.",
        label: "PLANNED",
        href: "/build",
      },
      {
        title: "AuraOS",
        description:
          "A separate experimental x86 kernel exploring AI as part of the operating system itself.",
        label: "RESEARCH",
        href: "/auraos",
      },
    ],
    closing: "Choose your starting point.",
    closingText:
      "Explore the desktop prototype without installing a new operating system, or study the AuraOS kernel independently.",
  },
  desktop: {
    title: "Help, right where\nyou are working.",
    eyebrow: "DRER DESKTOP",
    description:
      "The project’s existing starting point is a screen-aware Electron companion. Invoke it from your desktop, capture the current screen, and get an explanation in a floating overlay.",
    status: "Existing prototype · Source build",
    visual: "desktop",
    primary: { title: "Set up the prototype", href: "/get-started" },
    sectionTitle: "A small start with useful context.",
    sectionDescription:
      "The current desktop code lives in aura-os/electron under its original AuraAI name. DRER is the broader direction being built from that foundation.",
    cards: [
      {
        title: "Capture on request",
        description:
          "The prototype uses Electron desktop capture to take a screenshot when you invoke the overlay.",
        label: "01 / CAPTURE",
      },
      {
        title: "Ask about what is visible",
        description:
          "A configured Groq API key is used to send the capture for analysis. This is cloud inference, not entirely local screen processing.",
        label: "02 / UNDERSTAND",
      },
      {
        title: "Return to your work",
        description:
          "Read the response in a floating overlay and dismiss it to continue. Voice and computer-control actions are not implemented yet.",
        label: "03 / CONTINUE",
      },
    ],
    closing: "Explore it on your own computer.",
    closingText:
      "The repository includes Windows, macOS, and Linux build targets. Permissions, packaging, and end-to-end validation still need work on each platform.",
  },
  automations: {
    title: "A little less routine.\nA little more room.",
    eyebrow: "AUTOMATIONS",
    description:
      "Tell DRER what needs to happen. Plan a week, prepare a reminder, organize a meeting, or turn a repeated task into a routine. Connected automations are part of the product roadmap.",
    status: "Concepts · Integrations planned",
    visual: "automation",
    primary: { title: "See the roadmap", href: "/roadmap" },
    sectionTitle: "Useful help, on your schedule.",
    sectionDescription:
      "These are proposed workflows, not connected services or active schedules. The examples below do not create real events or reminders.",
    cards: [
      {
        title: "Calendars and meetings",
        description:
          "Find space around existing commitments, prepare event drafts, and review the time, guests, and details before creating anything.",
        label: "PLAN",
      },
      {
        title: "Reminders and alarms",
        description:
          "Capture a thought, resolve the date and time zone, and prepare the reminder for your review.",
        label: "REMEMBER",
      },
      {
        title: "Recurring briefings",
        description:
          "Ask for a weekday overview of meetings, deadlines, and priorities. Review when it runs and which tools it can use.",
        label: "REPEAT",
      },
    ],
    closing: "Your connections. Your choice.",
    closingText:
      "Calendar access, notification permissions, and account connections still need to be implemented. The intended experience makes these choices explicit and lets you pause a routine.",
  },
  build: {
    title: "An idea in your head.\nA first version to try.",
    eyebrow: "BUILD WITH DRER",
    description:
      "“DRER, build me a habit tracker.” The goal is to turn a description into a small app, website, or tool, then preview it and refine it together. Start with what you want to make.",
    status: "Vibe-building · Planned capability",
    visual: "build",
    primary: { title: "Help build the builder", href: "/community" },
    sectionTitle: "Describe. Build. Preview. Refine.",
    sectionDescription:
      "The example is an illustrative interface. A software-building toolchain is not connected to the website or implemented in the desktop prototype.",
    cards: [
      {
        title: "Start with a clear direction",
        description:
          "Describe the purpose, the people using it, and what a useful first version should do.",
        label: "01 / DESCRIBE",
      },
      {
        title: "Make the first version tangible",
        description:
          "The planned agent would create the project files and make its work visible, so you can understand what changed.",
        label: "02 / BUILD",
      },
      {
        title: "Try it and shape the details",
        description:
          "Preview the result, test the important paths, and ask for the next improvement in the same conversation.",
        label: "03 / REFINE",
      },
    ],
    closing: "Small tools. Real possibilities.",
    closingText:
      "Habit trackers, personal dashboards, landing pages, and simple utilities are useful examples of the direction. Reliable editing, execution, testing, and review are still work to build.",
  },
  platforms: {
    title: "Your computer.\nYour assistant.",
    eyebrow: "WINDOWS · MACOS · LINUX",
    description:
      "DRER is being built for the operating system you already use. The Electron foundation includes packaging targets for Windows, macOS, and Linux. A build target is a starting point; each platform still needs testing.",
    status: "Cross-platform direction · Validation in progress",
    visual: "platforms",
    primary: { title: "Build from source", href: "/get-started" },
    sectionTitle: "Three systems. One direction.",
    sectionDescription:
      "Use the source prototype today and help validate the desktop experience on your platform.",
    cards: [
      {
        title: "Windows",
        description:
          "The project defines a Windows x64 NSIS installer target through electron-builder. The packaging command is npm run build.",
        label: "NSIS",
        href: "/docs#packaging",
      },
      {
        title: "macOS",
        description:
          "The project defines a DMG target. Screen capture, global shortcuts, and packaging need validation on the target machine.",
        label: "DMG",
        href: "/docs#packaging",
      },
      {
        title: "Linux",
        description:
          "The project defines an AppImage target. Desktop environments, display servers, and permissions need platform-specific testing.",
        label: "APPIMAGE",
        href: "/docs#packaging",
      },
    ],
    closing: "Bring your platform knowledge.",
    closingText:
      "Reproducible reports about screen capture, shortcuts, tray behavior, packaging, and permissions help move the prototype toward a reliable cross-platform assistant.",
  },
  docs: {
    title: "Understand the project.\nBuild the starting point.",
    eyebrow: "DOCUMENTATION",
    description:
      "A practical guide to the existing desktop prototype, its setup, its inference flow, and the distinction between today’s code and the broader DRER vision.",
    status: "Desktop prototype guide",
    visual: "docs",
    primary: { title: "Open the source README", href: prototypeSource },
    sectionTitle: "Read the project in layers.",
    sectionDescription:
      "Start with the desktop guide, inspect the current implementation, and follow the separate kernel documentation if you want to explore AuraOS.",
    cards: [
      {
        title: "Desktop source",
        description:
          "Electron main process, preload bridge, and overlay renderer.",
        label: "SOURCE",
        href: prototypeSource,
      },
      {
        title: "AuraOS architecture",
        description:
          "Boot sequence, memory, interrupts, drivers, and the AI subsystem.",
        label: "RESEARCH",
        href: `${repo}/blob/main/aura-os/docs/architecture.md`,
      },
      {
        title: "Kernel build guide",
        description: "Toolchain prerequisites and running the kernel in QEMU.",
        label: "KERNEL",
        href: kernelGuide,
      },
    ],
    closing: "Documentation grows with the implementation.",
    closingText:
      "Keep setup steps reproducible, identify your platform, and distinguish observed behavior from planned features when reporting changes.",
  },
  roadmap: {
    title: "A direction you\ncan help shape.",
    eyebrow: "PROJECT ROADMAP",
    description:
      "From a screen-aware prototype to an assistant you can call on for your day, your desktop, and your next idea. This roadmap describes stages, without promising release dates.",
    status: "In development · No release dates announced",
    visual: "roadmap",
    primary: { title: "Contribute to the project", href: "/community" },
    sectionTitle: "Build from a visible foundation.",
    sectionDescription:
      "Progress means useful behavior that can be checked on a real computer. Platform support and user controls need to advance alongside capabilities.",
    cards: [
      {
        title: "The starting point",
        description:
          "Electron tray app, requested screen capture, Groq inference, and a floating response overlay exist in the repository.",
        label: "EXISTING PROTOTYPE",
        href: "/desktop",
      },
      {
        title: "The next connections",
        description:
          "Wake-phrase activation, voice and text interactions, calendars, reminders, notifications, and recurring routines.",
        label: "PLANNED",
        href: "/automations",
      },
      {
        title: "A more capable agent loop",
        description:
          "App and file actions, browsing and research tools, software building, visible plans, interruption, and review.",
        label: "PLANNED",
        href: "/agent",
      },
      {
        title: "The longer-term system",
        description:
          "Continue the separate AuraOS research kernel while DRER evolves on existing operating systems.",
        label: "RESEARCH",
        href: "/auraos",
      },
    ],
    closing: "Useful steps before big promises.",
    closingText:
      "The examples on this site show the direction. Calendar events, reminders, wake-word listening, and app creation are not active services on the website.",
  },
  community: {
    title: "Build it in the open.\nMake it useful together.",
    eyebrow: "COMMUNITY",
    description:
      "DRER is taking shape as an open-source project. Help with platform testing, screen understanding, integrations, interface work, documentation, or the agent loop.",
    status: "Created by Precious Adedokun",
    visual: "community",
    primary: { title: "Explore the repository", href: repo },
    sectionTitle: "Find a useful place to begin.",
    sectionDescription:
      "Use the real project repository to share a reproducible observation or a focused contribution. There is no separate community account to create here.",
    cards: [
      {
        title: "Test on your operating system",
        description:
          "Record the OS version, the command you ran, and the behavior of capture, shortcuts, the tray, or packaging.",
        label: "PLATFORMS",
        href: `${repo}/issues`,
      },
      {
        title: "Improve one clear piece",
        description:
          "Pick a focused change, explain what it improves, and show how you verified the behavior.",
        label: "CONTRIBUTE",
        href: repo,
      },
      {
        title: "Make the project easier to understand",
        description:
          "Improve setup instructions, clarify the architecture, or explain the difference between prototypes and planned features.",
        label: "DOCUMENTATION",
        href: "/docs",
      },
    ],
    closing: "Show the work. Share the learning.",
    closingText:
      "Report an issue, inspect the source, or follow the creator’s work. Contributions can be small and still make the project easier to build.",
  },
  resources: {
    title: "A good place\nto find your next step.",
    eyebrow: "RESOURCES",
    description:
      "The product direction, setup guide, roadmap, and source in one place. Everything here leads to a DRER page or a real project resource.",
    status: "Project directory",
    visual: "resources",
    primary: { title: "Read the documentation", href: "/docs" },
    sectionTitle: "Explore by what you need.",
    sectionDescription:
      "Follow the path that fits your question: understand the vision, try the prototype, or help build the next piece.",
    cards: [
      {
        title: "Understand DRER",
        description:
          "Learn how voice, context, connected tools, and action fit the desktop assistant.",
        label: "PRODUCT",
        href: "/agent",
      },
      {
        title: "Try the desktop prototype",
        description:
          "Clone the repository, install dependencies, configure Groq, and run the Electron app.",
        label: "SETUP",
        href: "/get-started",
      },
      {
        title: "Plan and automate",
        description:
          "Explore proposed calendars, reminders, meeting workflows, and recurring briefings.",
        label: "WORKFLOWS",
        href: "/automations",
      },
      {
        title: "Build an idea",
        description:
          "Explore the concept of creating and refining apps through a conversation.",
        label: "BUILD",
        href: "/build",
      },
      {
        title: "Follow the roadmap",
        description:
          "Separate the existing prototype from planned capabilities and long-term research.",
        label: "PROGRESS",
        href: "/roadmap",
      },
      {
        title: "Study AuraOS",
        description:
          "Explore the experimental kernel and its separate build and architecture guides.",
        label: "RESEARCH",
        href: "/auraos",
      },
    ],
    closing: "Still have a question?",
    closingText:
      "The repository is the place for implementation questions and reproducible issue reports. The community page explains how to make them useful.",
  },
  auraos: {
    title: "Intelligence, from\nthe inside out.",
    eyebrow: "AURAOS / RESEARCH",
    description:
      "The long-term exploration: an AI-native operating system built from the kernel up. AuraOS is separate from DRER, the assistant for your existing desktop.",
    status: "Experimental x86 kernel",
    visual: "kernel",
    primary: { title: "Read the kernel guide", href: kernelGuide },
    sectionTitle: "Understand what sits below the shell.",
    sectionDescription:
      "AuraOS is a 32-bit x86 kernel with its own memory management, interrupt handling, drivers, and AI subsystem. Run it in QEMU for exploration.",
    cards: [
      {
        title: "Boot and core subsystems",
        description:
          "Multiboot entry, protected mode, GDT and IDT setup, timers, and keyboard input.",
        label: "KERNEL",
      },
      {
        title: "Context-aware AI core",
        description:
          "System context is collected before a query. Real model inference uses a host-side serial proxy; a mock responder is built in.",
        label: "AI LAYER",
        href: `${repo}/blob/main/aura-os/docs/ai-layer.md`,
      },
      {
        title: "A research environment",
        description:
          "Scheduling, a filesystem, networking, and local model inference remain future work. This is not a complete everyday operating system.",
        label: "EXPERIMENTAL",
        href: kernelGuide,
      },
    ],
    closing: "You do not need a new OS to explore DRER.",
    closingText:
      "Build the desktop prototype on your current system, or investigate the AuraOS kernel as a separate project. They share a vision and have different starting points.",
  },
  "get-started": {
    title: "Start with the source.\nSee what comes next.",
    eyebrow: "GET STARTED",
    description:
      "Build the screen-aware desktop prototype on your own machine. Clone the repository, configure the inference backend, and explore the existing app.",
    status: "Source build · Prototype",
    visual: "start",
    primary: { title: "Read the full guide", href: "/docs" },
    sectionTitle: "A few things before your first run.",
    sectionDescription:
      "The desktop code is still named AuraAI and lives under aura-os/electron. This is the prototype foundation for DRER.",
    cards: [
      {
        title: "A local development setup",
        description:
          "Use Node.js and npm on a desktop operating system. You will run an Electron application locally.",
        label: "01 / REQUIREMENTS",
      },
      {
        title: "Your own Groq API key",
        description:
          "The prototype sends requested captures to Groq for analysis. Provide your key through the environment or app settings.",
        label: "02 / INFERENCE",
      },
      {
        title: "A prototype to explore",
        description:
          "Platform permissions, packaging, and the inference integration need verification in your environment. Voice and automations are not implemented yet.",
        label: "03 / EXPECTATIONS",
      },
    ],
    closing: "Run it. Understand it. Improve it.",
    closingText:
      "If something fails, record your OS, the command, and the exact error. Useful reports are a practical way to help build the next version.",
  },
};
