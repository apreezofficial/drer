"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FileCode2,
  GitBranch,
  Github,
  Layers3,
  Menu,
  Monitor,
  Mic,
  CalendarDays,
  Bell,
  WandSparkles,
  Repeat2,
  MousePointer2,
  FolderOpen,
  AppWindow,
  Globe,
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";

const repo = "https://github.com/apreezofficial/drer";
const docs = `${repo}/tree/main/aura-os/electron`;
const kernelDocs = `${repo}/blob/main/aura-os/docs/run.md`;
const overlay = `${repo}/tree/main/aura-os/electron`;
const command = "git clone https://github.com/apreezofficial/drer.git";

function DrerMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`aura-mark ${className}`}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 3 36 32H4L20 3Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="m13 32 7-13 7 13"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function Arrow() {
  return <ArrowUpRight size={16} aria-hidden="true" />;
}
function CopyCommand({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setFailed(false);
      timer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      setFailed(true);
    }
  }
  return (
    <div className={`copy-command ${compact ? "compact" : ""}`}>
      <span>Get the source</span>
      <div>
        <code>
          <b>git</b> clone https://github.com/apreezofficial/drer.git
        </code>
        <button
          onClick={copy}
          aria-label={copied ? "Command copied" : "Copy clone command"}
          title={failed ? command : "Copy command"}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
      <span className="sr-only" role="status">
        {copied
          ? "Clone command copied."
          : failed
            ? `Copy unavailable. ${command}`
            : ""}
      </span>
    </div>
  );
}
function AnimatedTitle() {
  const text = "Say what you need. Let DRER take it from there.";
  let offset = 0;
  return (
    <h1 aria-label={text}>
      <span aria-hidden="true">
        {text.split(" ").map((word, i) => {
          const start = offset;
          offset += word.length + 1;
          return (
            <span className="title-word" key={i}>
              {word.split("").map((letter, j) => (
                <span
                  className="title-character"
                  style={{ animationDelay: `${100 + (start + j) * 22}ms` }}
                  key={j}
                >
                  {letter}
                </span>
              ))}
              &nbsp;
            </span>
          );
        })}
      </span>
      <span className="title-caret" aria-hidden="true" />
    </h1>
  );
}
const searchItems = [
  {
    title: "DRER desktop assistant",
    description: "Voice, connected tools, and the desktop prototype",
    href: overlay,
  },
  {
    title: "Windows, macOS, and Linux",
    description: "Explore the platform build targets",
    href: "#platforms",
  },
  {
    title: "Agent roadmap",
    description:
      "Wake phrase, calendars, reminders, automations, and building apps",
    href: "#roadmap",
  },
  {
    title: "Calendars and reminders",
    description: "Plan your week and follow up on what matters",
    href: "#calendar",
  },
  {
    title: "Vibe-build with DRER",
    description: "Describe an app, preview it, and refine it",
    href: "#build",
  },
  {
    title: "Recurring automations",
    description: "Daily briefings and routines across connected tools",
    href: "#calendar",
  },
  {
    title: "AuraOS research kernel",
    description: "The long-term AI-native operating system",
    href: kernelDocs,
  },
  {
    title: "Source code",
    description: "Build and contribute on GitHub",
    href: repo,
  },
];

function Header() {
  const [menu, setMenu] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  function closeSearch() {
    setSearch(false);
    searchTrigger.current?.focus();
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenu(false);
        setDropdown(null);
        setSearch(false);
        searchTrigger.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (search) searchInput.current?.focus();
    document.body.style.overflow = search || menu ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [search, menu]);
  return (
    <>
      <header className="site-header">
        <a className="logo" href="#" aria-label="DRER home">
          <DrerMark />
          <span className="logo-outline">DRER</span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#intelligence">AGENT</a>
          <div
            className="nav-dropdown"
            onMouseEnter={() => setDropdown("apps")}
            onMouseLeave={() => setDropdown(null)}
          >
            <button
              aria-expanded={dropdown === "apps"}
              onClick={() => setDropdown(dropdown === "apps" ? null : "apps")}
            >
              APPS <ChevronDown size={13} />
            </button>
            {dropdown === "apps" && (
              <div className="dropdown-panel">
                <a href="#companion" onClick={() => setDropdown(null)}>
                  <Monitor size={19} />
                  <span>
                    DRER desktop
                    <small>The assistant for your existing OS</small>
                  </span>
                  <Arrow />
                </a>
                <a href="#auraos" onClick={() => setDropdown(null)}>
                  <Cpu size={19} />
                  <span>
                    AuraOS<small>The long-term operating system</small>
                  </span>
                  <Arrow />
                </a>
              </div>
            )}
          </div>
          <a href="#platforms">PLATFORMS</a>
          <a href={docs}>DOCS</a>
          <a href={repo}>
            COMMUNITY <Arrow />
          </a>
          <div
            className="nav-dropdown"
            onMouseEnter={() => setDropdown("resources")}
            onMouseLeave={() => setDropdown(null)}
          >
            <button
              aria-expanded={dropdown === "resources"}
              onClick={() =>
                setDropdown(dropdown === "resources" ? null : "resources")
              }
            >
              RESOURCES <ChevronDown size={13} />
            </button>
            {dropdown === "resources" && (
              <div className="dropdown-panel">
                {searchItems.slice(0, 4).map((x) => (
                  <a
                    key={x.title}
                    href={x.href}
                    onClick={() => setDropdown(null)}
                  >
                    <span>
                      {x.title}
                      <small>{x.description}</small>
                    </span>
                    <Arrow />
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>
        <div className="header-actions">
          <button
            ref={searchTrigger}
            className="icon-button search-button"
            aria-label="Search documentation"
            onClick={() => {
              setSearch(true);
              setQuery("");
            }}
          >
            <Search size={20} />
          </button>
          <a className="button button-outline header-source" href={repo}>
            SOURCE <Github size={14} />
          </a>
          <a className="button button-white header-build" href="#get-started">
            GET STARTED
          </a>
          <button
            className="mobile-toggle icon-button"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {menu && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {[
            ["The agent", "#intelligence"],
            ["Desktop companion", "#companion"],
            ["Windows, macOS, Linux", "#platforms"],
            ["Roadmap", "#roadmap"],
            ["Calendars & routines", "#calendar"],
            ["Vibe-building", "#build"],
            ["AuraOS", "#auraos"],
            ["Documentation", docs],
            ["Get started", "#get-started"],
          ].map(([label, href]) => (
            <a href={href} key={label} onClick={() => setMenu(false)}>
              {label}
              <Arrow />
            </a>
          ))}
          <button
            onClick={() => {
              setMenu(false);
              setQuery("");
              setSearch(true);
            }}
          >
            Search documentation <Search size={19} />
          </button>
        </nav>
      )}
      {dropdown && (
        <button
          className="dropdown-dismiss"
          aria-label="Close navigation menu"
          onClick={() => setDropdown(null)}
        />
      )}
      {search && (
        <div className="modal-backdrop" onClick={closeSearch}>
          <section
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search DRER documentation"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const focusable =
                  e.currentTarget.querySelectorAll<HTMLElement>(
                    "input,button,a",
                  );
                const first = focusable[0],
                  last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <div className="search-field">
              <Search size={21} />
              <input
                ref={searchInput}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search DRER..."
                aria-label="Search"
              />
              <button
                className="icon-button"
                onClick={closeSearch}
                aria-label="Close search"
              >
                <X size={20} />
              </button>
            </div>
            <div className="search-results">
              {searchItems
                .filter((x) =>
                  `${x.title} ${x.description}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((x) => (
                  <a href={x.href} key={x.title} onClick={closeSearch}>
                    <FileCode2 size={20} />
                    <div>
                      {x.title}
                      <small>{x.description}</small>
                    </div>
                    <Arrow />
                  </a>
                ))}
              {!searchItems.some((x) =>
                `${x.title} ${x.description}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && <p>No results. Try “desktop” or “Windows”.</p>}
            </div>
            <div className="search-hint">
              Search the project documentation <kbd>esc</kbd> to close
            </div>
          </section>
        </div>
      )}
    </>
  );
}
const demoScenarios = [
  {
    id: "calendar",
    label: "Plan my week",
    Icon: CalendarDays,
    title: "Make room for what matters.",
    utterance: "Hey DRER, plan my week around my meetings.",
    reply:
      "Here is a proposed schedule: keep your existing meetings, add two focus blocks, and set a reminder before your deadline. Review it before anything is added.",
    context: "calendar / proposed week",
    steps: [
      "Check connected calendar availability",
      "Suggest focus time around meetings",
      "Review events and reminders",
    ],
    terminal: [
      "you › Hey DRER, help me plan my week",
      "✳ DRER / concept session",
      "  → Check calendar availability",
      "  → Find two open focus blocks",
      "  → Prepare a deadline reminder",
      "",
      "  A calmer week, ready for your review.",
      "",
      "Calendar integration: planned",
    ],
  },
  {
    id: "reminders",
    label: "Remind me",
    Icon: Bell,
    title: "A thought now. A nudge later.",
    utterance: "DRER, remind me to submit this tomorrow at 9.",
    reply:
      "The idea is simple: tell DRER what to remember, when to remind you, and where it fits. Here is a reminder draft for tomorrow morning.",
    context: "reminders / draft",
    steps: [
      "Submit the project",
      "Tomorrow · 09:00 · your time zone",
      "Confirm to save the reminder",
    ],
    terminal: [
      "you › Remind me tomorrow at 9",
      "✳ DRER / reminder concept",
      "  → Capture what you want to remember",
      "  → Resolve the date and your time zone",
      "  → Prepare the reminder",
      "",
      "  Submit the project · tomorrow · 09:00",
      "",
      "Reminder integration: planned",
    ],
  },
  {
    id: "build",
    label: "Build an app",
    Icon: WandSparkles,
    title: "An idea you can build on.",
    utterance: "Hey DRER, build me a habit tracker.",
    reply:
      "Start with a simple app: daily habits, a weekly progress view, and a clean interface. Then preview the result and tell DRER what you want to change.",
    context: "habit-tracker / proposed build",
    steps: [
      "Plan the screens and data",
      "Create a working first version",
      "Preview, check, and refine together",
    ],
    terminal: [
      "you › Build me a habit tracker",
      "✳ DRER / vibe-build concept",
      "  → Plan the interface",
      "  → Create the project files",
      "  → Prepare a preview",
      "",
      "  Your next instruction: make it yours.",
      "",
      "Software-building tools: planned",
    ],
  },
  {
    id: "routines",
    label: "Run a routine",
    Icon: Repeat2,
    title: "Ask once. Make it a routine.",
    utterance: "Every weekday, show my calendar and priorities.",
    reply:
      "A proposed morning routine: gather today’s meetings, include upcoming reminders, and prepare a short briefing. Choose when it runs and which tools it can use.",
    context: "routines / morning briefing",
    steps: [
      "Weekdays · 08:30 · your time zone",
      "Calendar + reminders + priorities",
      "Review the routine before enabling",
    ],
    terminal: [
      "you › Set up my morning briefing",
      "✳ DRER / automation concept",
      "  → Gather the calendar and reminders",
      "  → Summarize today’s priorities",
      "  → Schedule a weekday briefing",
      "",
      "  A routine you can review and pause.",
      "",
      "Recurring automation: planned",
    ],
  },
  {
    id: "screen",
    label: "Understand my screen",
    Icon: Monitor,
    title: "A second pair of eyes.",
    utterance: "DRER, explain the error on my screen.",
    reply:
      "That message points to a missing dependency. The existing screen-aware prototype can explain what you are looking at without making you retype the error.",
    context: "desktop / captured context",
    steps: [
      "Capture a screen on request",
      "Send the image to Groq for analysis",
      "Read the explanation in the overlay",
    ],
    terminal: [
      "you › Explain this error",
      "✳ DRER / screen-aware prototype",
      "  → Capture the shared screen",
      "  → Analyze the visible context",
      "  → Explain a useful next step",
      "",
      "  A little context makes a difference.",
      "",
      "Explore the prototype from source",
    ],
  },
];
function Demo() {
  const [active, setActive] = useState("calendar");
  const scenario = demoScenarios.find((x) => x.id === active)!;
  const [playing, setPlaying] = useState(true);
  const [line, setLine] = useState(1);
  const demoRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.1,
    });
    if (demoRef.current) o.observe(demoRef.current);
    return () => o.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || !visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLine(scenario.terminal.length);
      return;
    }
    const timer = setTimeout(
      () => setLine((v) => (v >= scenario.terminal.length ? 1 : v + 1)),
      line >= scenario.terminal.length ? 5000 : 850,
    );
    return () => clearTimeout(timer);
  }, [playing, visible, line, scenario]);
  function choose(id: string) {
    setActive(id);
    setLine(1);
  }
  return (
    <div className="demo-scene" ref={demoRef}>
      <div className="os-window">
        <div className="os-topbar">
          <div className="window-dots">
            <i />
            <i />
            <i />
          </div>
          <span>
            <DrerMark /> DRER workspace
          </span>
          <span className="os-top-right">
            <span className="online-dot" /> Product concept
          </span>
        </div>
        <div className="os-body">
          <aside className="os-sidebar">
            <div className="os-brand">
              <DrerMark /> drer
            </div>
            <div className="sidebar-caption">JUST ASK DRER</div>
            {demoScenarios.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={active === id ? "selected" : ""}
                aria-pressed={active === id}
                onClick={() => choose(id)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
            <div className="sidebar-bottom">
              <span className="online-dot" /> Open source · in development
              <br />
              <small>Windows · macOS · Linux</small>
            </div>
          </aside>
          <div className="os-conversation">
            <div className="conversation-bar">
              <span>{scenario.label}</span>
              <Mic size={13} />
            </div>
            <div className="conversation-scroll">
              <div className="conversation-eyebrow">A LITTLE LESS FRICTION</div>
              <h3>{scenario.title}</h3>
              <div className="user-message">{scenario.utterance}</div>
              <div className="assistant-label">
                <DrerMark /> DRER{" "}
                <span>{active === "screen" ? "prototype" : "concept"}</span>
              </div>
              <p>{scenario.reply}</p>
              <div className="inline-code">
                <span>{scenario.context}</span>
                <code>
                  {scenario.steps.map((step, i) => (
                    <div key={step}>
                      <b>0{i + 1}</b> {step}
                    </div>
                  ))}
                </code>
              </div>
              <div className="context-pills">
                <span>✓ Your request</span>
                <span>✓ A clear plan</span>
                <span>✓ You decide</span>
              </div>
            </div>
            <div className="composer">
              Say it, type it, or bring in context...<span>↑</span>
            </div>
          </div>
          <aside className="context-panel">
            <div>
              CONNECTED POSSIBILITIES <Sparkles size={13} />
            </div>
            <p>
              One conversation.
              <br />
              <span>More ways to get things done.</span>
            </p>
            <div className="stat-row">
              <span>Calendar</span>
              <b>Plan</b>
            </div>
            <div className="stat-row">
              <span>Reminders</span>
              <b>Remember</b>
            </div>
            <div className="stat-row">
              <span>Apps & files</span>
              <b>Create</b>
            </div>
            <div className="context-graph">
              {Array.from({ length: 28 }, (_, i) => (
                <i
                  key={i}
                  style={{
                    height: `${18 + ((i * 37) % 70)}%`,
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              ))}
            </div>
            <small>ILLUSTRATIVE SESSION</small>
          </aside>
        </div>
      </div>
      <div className="floating-terminal">
        <div className="terminal-bar">
          <div className="window-dots">
            <i />
            <i />
            <i />
          </div>
          <span>DRER — {scenario.label.toLowerCase()}</span>
          <button
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? "Pause terminal demo" : "Play terminal demo"}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
          </button>
        </div>
        <div
          className="terminal-content"
          aria-label="Illustrative DRER workflow"
        >
          {scenario.terminal.slice(0, line).map((text, i) => (
            <div
              key={`${active}-${i}`}
              className={
                i === 0
                  ? "command"
                  : i === 1
                    ? "accent"
                    : text.includes("→")
                      ? "success"
                      : text.includes("planned")
                        ? "muted"
                        : ""
              }
            >
              {text || "\u00a0"}
            </div>
          ))}
          <span className="terminal-cursor" />
        </div>
      </div>
    </div>
  );
}
function VoiceVisual() {
  return (
    <div className="voice-visual">
      <div className="voice-label">
        <span className="development-dot" /> VOICE ACTIVATION · CONCEPT
      </div>
      <div className="voice-orb">
        <Mic size={30} />
      </div>
      <div className="voice-wave">
        {Array.from({ length: 35 }, (_, i) => (
          <i
            key={i}
            style={{
              height: `${12 + ((i * 29) % 45)}px`,
              animationDelay: `${i * 45}ms`,
            }}
          />
        ))}
      </div>
      <p>“Hey DRER, plan my day.”</p>
      <span>Your voice. A place to begin.</span>
    </div>
  );
}
function CalendarVisual() {
  return (
    <div className="calendar-visual">
      <div className="calendar-heading">
        <CalendarDays size={17} />
        <span>Your week, with room to breathe.</span>
        <span className="concept-tag">CONCEPT</span>
      </div>
      <div className="calendar-grid">
        {["MON", "TUE", "WED", "THU", "FRI"].map((day, i) => (
          <div className="calendar-day" key={day}>
            <span>{day}</span>
            <div className={`calendar-event event-${i}`}>
              <span>
                {
                  [
                    "Team sync",
                    "Focus time",
                    "Design review",
                    "Focus time",
                    "Weekly recap",
                  ][i]
                }
              </span>
              <small>{["10:00", "09:00", "11:30", "14:00", "16:00"][i]}</small>
            </div>
          </div>
        ))}
      </div>
      <div className="reminder-draft">
        <Bell size={16} />
        <span>
          Submit the project<small>Tomorrow at 09:00 · reminder draft</small>
        </span>
        <Check size={14} />
      </div>
      <p>Plan your week. Remember the details.</p>
    </div>
  );
}
function BuildVisual() {
  const [view, setView] = useState("preview");
  return (
    <div className="build-visual">
      <div className="build-tabs">
        <span>
          <WandSparkles size={14} /> habit-tracker
        </span>
        <div>
          <button
            aria-pressed={view === "code"}
            onClick={() => setView("code")}
          >
            Code
          </button>
          <button
            aria-pressed={view === "preview"}
            onClick={() => setView("preview")}
          >
            Preview
          </button>
        </div>
      </div>
      {view === "preview" ? (
        <div className="habit-preview">
          <span className="tiny-label">YOUR DAILY MOMENTUM</span>
          <h4>A little better, every day.</h4>
          {[
            "Read for 20 minutes",
            "Go for a walk",
            "Build something small",
          ].map((habit, i) => (
            <div className="habit-row" key={habit}>
              <span>{habit}</span>
              <div>
                {Array.from({ length: 5 }, (_, j) => (
                  <i key={j} className={j < 4 - i ? "done" : ""}>
                    {j < 4 - i ? <Check size={9} /> : null}
                  </i>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <pre className="build-code">
          <code>
            {
              'const habits = [\n  "Read for 20 minutes",\n  "Go for a walk",\n  "Build something small"\n];\n\n// Describe → build → preview → refine'
            }
          </code>
        </pre>
      )}
      <div className="build-footer">
        <span className="online-dot" /> Illustrative app · software-building
        tools planned
      </div>
    </div>
  );
}
function PlatformVisual() {
  const [platform, setPlatform] = useState("Windows");
  return (
    <div className="backend-visual">
      <div className="backend-menu">
        <span className="tiny-label">YOUR OPERATING SYSTEM</span>
        {[
          {
            name: "Windows",
            detail: "Electron · NSIS build target",
            tag: "WIN",
          },
          { name: "macOS", detail: "Electron · DMG build target", tag: "MAC" },
          {
            name: "Linux",
            detail: "Electron · AppImage build target",
            tag: "LINUX",
          },
        ].map((x) => (
          <button
            key={x.name}
            className={platform === x.name ? "active" : ""}
            onClick={() => setPlatform(x.name)}
          >
            <span>
              {x.name}
              <small>{x.detail}</small>
            </span>
            <span className="backend-badge">
              {platform === x.name ? <Check size={12} /> : x.tag}
            </span>
          </button>
        ))}
      </div>
      <div className="backend-composer">
        <Monitor size={14} />
        {platform} · same DRER direction
        <ArrowRight size={14} />
      </div>
      <div className="backend-status">
        <span className="online-dot" />
        Build from source · platform validation in progress
      </div>
    </div>
  );
}
const faqItems = [
  [
    "What is DRER?",
    "DRER is the open-source assistant we are building for your computer and connected tools. Call it by name or type what you need: plan your week, create a reminder, automate a routine, build an app, or get help across your desktop. Screen understanding is one capability, not the whole product.",
  ],
  [
    "Is this only for Mac?",
    "No. Windows, macOS, and Linux are all part of the product direction. The Electron project has NSIS, DMG, and AppImage build targets. Each platform still needs its own permission handling, integration work, and testing; these are build targets, not a claim of fully tested releases.",
  ],
  [
    "Can DRER already control my entire computer?",
    "Not yet. The current prototype captures a screen on request and returns an AI explanation. Wake-word activation, calendar and reminder connections, recurring automations, vibe-building, and desktop actions are planned development stages. The interactive examples show that product direction.",
  ],
  [
    "Can I call DRER by name?",
    "That is the intended experience: use a wake phrase, a shortcut, or text to make a request. Voice activation is planned, and its microphone controls and platform-specific behavior still need to be built.",
  ],
  [
    "What could I automate or build?",
    "The planned workflows include scheduling events, creating reminders, preparing recurring briefings, working across apps and files, and building websites or small applications from a description. Connected services will need explicit setup; the website examples do not create real events, reminders, or projects.",
  ],
  [
    "How is DRER different from AuraOS?",
    "DRER is the desktop assistant for an existing operating system. AuraOS is the separate, long-term research project: an AI-native operating system built from the kernel up. You do not need to boot or install AuraOS to explore the desktop assistant.",
  ],
  [
    "What happens to my screen capture?",
    "The existing desktop prototype sends a screenshot to Groq for analysis when you invoke it, using your API key. It does not process the screenshot entirely on your device. Local inference and additional provider choices are future possibilities.",
  ],
  [
    "How do I try it or contribute?",
    "Open the source repository and follow the desktop setup instructions in aura-os/electron. Install the dependencies, configure your Groq API key, and run the prototype. You can contribute to screen understanding, platform integrations, the agent loop, or the interface.",
  ],
  [
    "Will I stay in control?",
    "That is the design goal. The agent should make its progress visible, let you interrupt it, and ask before consequential actions such as sending a message or deleting a file. These controls will be developed alongside desktop actions.",
  ],
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="faq section-container" id="faq">
      <h2>Common questions</h2>
      <div className="faq-list">
        {faqItems.map(([q, a], i) => (
          <div className={`faq-item ${open === i ? "open" : ""}`} key={q}>
            <h3>
              <button
                aria-expanded={open === i}
                aria-controls={`faq-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
              >
                {q}
                <span aria-hidden="true">{open === i ? "−" : "+"}</span>
              </button>
            </h3>
            <div id={`faq-${i}`} className="faq-answer" inert={open !== i}>
              <div>
                <p>{a}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <a href={docs} className="button button-outline">
        Explore the documentation <Arrow />
      </a>
    </section>
  );
}
function Walkthrough() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open]);
  return (
    <>
      <button
        ref={trigger}
        className="walkthrough-card"
        onClick={() => setOpen(true)}
      >
        <div>
          <span className="tiny-label">A SHORT WALKTHROUGH</span>
          <h3>
            From a question to
            <br />a clear next step.
          </h3>
          <p>Ask. Plan. Automate. Build.</p>
          <span className="watch-label">
            <Play size={14} fill="currentColor" /> Watch the demo
          </span>
        </div>
        <div className="play-art">
          <Play fill="currentColor" size={34} />
          <span />
          <span />
        </div>
      </button>
      {open && (
        <div
          className="modal-backdrop video-backdrop"
          onClick={() => {
            setOpen(false);
            trigger.current?.focus();
          }}
        >
          <section
            className="video-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="DRER illustrative walkthrough"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const elements =
                  e.currentTarget.querySelectorAll<HTMLElement>("button,video");
                const first = elements[0],
                  last = elements[elements.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              autoFocus
              className="video-close icon-button"
              aria-label="Close walkthrough"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <X />
            </button>
            <video
              tabIndex={0}
              ref={videoRef}
              src="/media/drer-walkthrough.webm"
              controls
              autoPlay
              playsInline
              preload="metadata"
            />
            <p>
              DRER product concept · voice and desktop actions are on the
              roadmap.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    document.querySelectorAll(".reveal").forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, []);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <section className="hero section-container">
          <div className="hero-main">
            <AnimatedTitle />
            <p className="hero-description">
              Call DRER by name. Plan your week, remember the little things,
              automate a routine, or build the app you have in mind. An
              open-source assistant taking shape across Windows, macOS, and
              Linux.
            </p>
            <div className="hero-actions">
              <a href="#get-started" className="button button-orange">
                <Monitor size={18} /> Explore DRER <ArrowDown size={15} />
              </a>
              <a href={repo} className="button button-outline">
                <Github size={18} /> Build with us <Arrow />
              </a>
              <CopyCommand />
            </div>
            <div className="platform-strip">
              <span className="development-dot" /> IN DEVELOPMENT{" "}
              <span className="strip-divider" /> Windows <span>·</span> macOS{" "}
              <span>·</span> Linux
            </div>
          </div>
          <aside className="whats-new">
            <h2>
              <span /> THE NEXT CHAPTER
            </h2>
            <a href="#companion">
              A wake phrase. A whole world of possibilities. <Arrow />
            </a>
            <a href="#roadmap">
              Calendars, reminders, routines, and vibe-building <Arrow />
            </a>
            <a href="#platforms">
              Windows. macOS. Linux. <Arrow />
            </a>
          </aside>
        </section>
        <section
          className="product-section section-container"
          aria-label="DRER interactive concept preview"
        >
          <Demo />
          <p className="demo-caption">
            Interactive product concepts · voice activation, connected
            calendars, reminders, routines, and software-building are planned.
          </p>
        </section>
        <section className="features section-container" id="intelligence">
          <article className="feature-row reveal" id="companion">
            <div className="feature-copy">
              <h2>
                Call it. Say it.
                <br />
                Keep moving.
              </h2>
              <p>
                “Hey DRER, help me plan my day.” A wake phrase, a shortcut, or a
                typed request should be enough to start. We are building toward
                an assistant that understands your intent and works with the
                tools you choose to connect.
              </p>
              <a className="text-link" href={overlay}>
                Explore the current prototype <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <VoiceVisual />
            </div>
          </article>
          <article className="feature-row reveal" id="calendar">
            <div className="feature-copy">
              <h2>
                Your calendar. Your reminders.
                <br />A little more breathing room.
              </h2>
              <p>
                Find focus time around meetings. Remember a deadline. Ask for a
                morning briefing every weekday.{" "}
                <a href="#calendar">
                  Calendars, reminders, and recurring automations
                </a>{" "}
                are central to the DRER vision: useful help that follows your
                day, not just the window you have open.
              </p>
              <a className="text-link" href={repo}>
                Help build the agent <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <CalendarVisual />
            </div>
          </article>
          <article className="feature-row reveal" id="build">
            <div className="feature-copy">
              <h2>
                An idea in your head.
                <br />
                An app you can shape.
              </h2>
              <p>
                “DRER, build me a habit tracker.” Describe what you want, let
                the agent help create a first version, then preview and refine
                it together. <a href="#build">Vibe-building</a> belongs
                alongside everyday tasks: build a website, make a small tool, or
                turn a rough idea into something you can try.
              </p>
              <a className="text-link" href="#faq">
                See what works today <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <BuildVisual />
            </div>
          </article>
          <article className="feature-row reveal" id="platforms">
            <div className="feature-copy">
              <h2>
                Your assistant.
                <br />
                Your operating system.
              </h2>
              <p>
                Windows, macOS, and Linux are all part of the plan. The existing
                Electron foundation includes{" "}
                <a href={overlay}>NSIS, DMG, and AppImage build targets</a>. We
                are working toward the native permissions, integrations, and
                testing each platform needs.
              </p>
              <a className="text-link" href={overlay}>
                Explore platform setup <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <PlatformVisual />
            </div>
          </article>
        </section>
        <section className="principles section-container reveal" id="roadmap">
          <h2>Built around the way you work</h2>
          <div className="principle-grid">
            <article>
              <Code2 />
              <h3>Open source, from day one</h3>
              <p>
                Inspect the code, understand how context moves, and help shape
                the agent. This is a project you can build with, not just a
                product you can use.
              </p>
              <a href={repo}>
                Explore the repository <Arrow />
              </a>
            </article>
            <article>
              <ShieldCheck />
              <h3>You stay in the loop</h3>
              <p>
                The design goal is visible plans, interruptible work, and
                confirmation before consequential actions. Agency for your
                assistant should come with control for you.
              </p>
              <a href="#faq">
                Read the common questions <Arrow />
              </a>
            </article>
            <article>
              <Mic />
              <h3>A conversation, with context</h3>
              <p>
                Call DRER by name, type a request, or bring in screen context.
                Calendars, reminders, recurring routines, and building software
                all belong in the same conversation.
              </p>
              <a href="#roadmap">
                Follow the direction <Arrow />
              </a>
            </article>
          </div>
        </section>
        <section className="journey section-container reveal" id="auraos">
          <h2>
            One vision.
            <br />
            Two ways to build toward it.
          </h2>
          <div className="journey-grid">
            {[
              {
                n: "01",
                label: "THE STARTING POINT",
                title: "A screen-aware companion",
                text: "An Electron prototype that captures a screen on request and returns an AI explanation.",
                href: overlay,
              },
              {
                n: "02",
                label: "WHAT WE ARE BUILDING",
                title: "DRER, the desktop agent",
                text: "Wake-word activation, connected calendars, reminders, recurring routines, and vibe-building. For Windows, macOS, and Linux.",
                href: "#roadmap",
              },
              {
                n: "03",
                label: "THE LONG-TERM VISION",
                title: "AuraOS, the agentic OS",
                text: "A separate research kernel exploring what it means to put AI inside the operating system.",
                href: kernelDocs,
              },
            ].map((x) => (
              <a className="journey-card" href={x.href} key={x.n}>
                <span className="journey-number">
                  {x.n}
                  <Arrow />
                </span>
                <span className="tiny-label">{x.label}</span>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </a>
            ))}
          </div>
        </section>
        <section className="guides section-container reveal" id="get-started">
          <h2>Start exploring. Start building.</h2>
          <div className="guide-grid">
            <Walkthrough />
            <a className="guide-card" href={overlay}>
              <div>
                <span className="tiny-label">[ DESKTOP PROTOTYPE ]</span>
                <h3>Try the starting point</h3>
                <p>Screen capture, context, and a floating overlay.</p>
              </div>
              <div className="guide-icon">
                <Monitor size={29} />
              </div>
              <Arrow />
            </a>
            <a className="guide-card" href={repo}>
              <div>
                <span className="tiny-label">[ OPEN SOURCE ]</span>
                <h3>Build what comes next</h3>
                <p>Explore the source and contribute.</p>
              </div>
              <div className="guide-icon warm">
                <DrerMark />
              </div>
              <Arrow />
            </a>
          </div>
        </section>
        <FAQ />
        <section className="final-cta section-container reveal">
          <div className="cta-orbit orbit-one" />
          <div className="cta-orbit orbit-two" />
          <h2>
            A word. An idea.
            <br />A place to begin.
          </h2>
          <p>Help build an assistant for the things you want to do.</p>
          <div className="hero-actions">
            <a href={overlay} className="button button-white">
              <Monitor size={17} /> Explore the prototype <Arrow />
            </a>
            <a href={repo} className="button button-white">
              <Github size={17} /> Contribute <Arrow />
            </a>
            <CopyCommand compact />
          </div>
          <div className="cta-mark">
            <DrerMark />
          </div>
        </section>
      </main>
      <footer className="footer section-container">
        <div className="footer-main">
          <a href="#" className="logo" aria-label="DRER home">
            <span className="logo-outline">DRER</span>
          </a>
          <div className="footer-columns">
            {[
              {
                title: "PRODUCT",
                links: [
                  ["Desktop agent", "#intelligence"],
                  ["Screen companion", overlay],
                  ["Windows, macOS, Linux", "#platforms"],
                  ["AuraOS", kernelDocs],
                ],
              },
              {
                title: "EXPLORE",
                links: [
                  ["Roadmap", "#roadmap"],
                  ["Calendars & routines", "#calendar"],
                  ["Vibe-building", "#build"],
                  ["Get started", "#get-started"],
                  ["Source code", repo],
                  ["Questions", "#faq"],
                ],
              },
              {
                title: "RESOURCES",
                links: [
                  ["Documentation", docs],
                  ["Report an issue", `${repo}/issues`],
                  ["Creator", "https://preciousadedokun.com.ng"],
                  ["Design reference", "https://kiro.dev/"],
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h3>{col.title}</h3>
                {col.links.map(([name, href]) => (
                  <a key={name} href={href}>
                    {name}
                  </a>
                ))}
              </div>
            ))}
            <div>
              <h3>SOCIAL</h3>
              <a className="social-icon" href={repo} aria-label="GitHub">
                <Github size={20} />
              </a>
              <a
                className="social-icon"
                href="https://preciousadedokun.com.ng"
                aria-label="Creator website"
              >
                <ExternalLink size={19} />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            Created by{" "}
            <a href="https://preciousadedokun.com.ng">Precious Adedokun</a>
          </span>
          <span>DRER · Open source · In development</span>
          <a href={repo}>
            View source <Arrow />
          </a>
        </div>
      </footer>
    </>
  );
}
