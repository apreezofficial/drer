export const repository = "https://github.com/apreezofficial/drer";
export const prototypeSource = `${repository}/tree/main/aura-os/electron`;
export const kernelGuide = `${repository}/blob/main/aura-os/docs/run.md`;
export const siteLinks = [
  {
    href: "/agent",
    title: "The DRER agent",
    description: "Voice, context, and a more helpful computer.",
  },
  {
    href: "/products",
    title: "Product overview",
    description: "The desktop assistant and the longer-term vision.",
  },
  {
    href: "/desktop",
    title: "Desktop prototype",
    description: "The existing screen-aware Electron starting point.",
  },
  {
    href: "/automations",
    title: "Automations",
    description: "Calendars, reminders, meetings, and recurring routines.",
  },
  {
    href: "/build",
    title: "Build with DRER",
    description: "Describe an app, preview it, and refine the idea.",
  },
  {
    href: "/platforms",
    title: "Windows, macOS, Linux",
    description: "Platform build targets and current development status.",
  },
  {
    href: "/docs",
    title: "Documentation",
    description: "Set up the prototype and understand the project.",
  },
  {
    href: "/roadmap",
    title: "Roadmap",
    description: "What exists today and what we are building next.",
  },
  {
    href: "/community",
    title: "Community",
    description: "Contribute code, test platforms, and share feedback.",
  },
  {
    href: "/resources",
    title: "Resources",
    description: "A guide to the project, source, and documentation.",
  },
  {
    href: "/auraos",
    title: "AuraOS",
    description: "The separate, long-term AI-native operating system.",
  },
  {
    href: "/get-started",
    title: "Get started",
    description: "Build the desktop prototype from source.",
  },
];
export const productLinks = siteLinks.filter((x) =>
  ["/desktop", "/automations", "/build", "/auraos"].includes(x.href),
);
export const resourceLinks = siteLinks.filter((x) =>
  ["/docs", "/roadmap", "/resources"].includes(x.href),
);
