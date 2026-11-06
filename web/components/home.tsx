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
  const text = "Your computer. Now with an agent.";
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
    description: "Screen understanding and the desktop prototype",
    href: overlay,
  },
  {
    title: "Windows, macOS, and Linux",
    description: "Explore the platform build targets",
    href: "#platforms",
  },
  {
    title: "Agent roadmap",
    description: "Voice, desktop actions, and multi-step workflows",
    href: "#roadmap",
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
                  <a href={x.href} key={x.title}>
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
const terminalLines = [
  ["you › help me with what’s on my screen", "command"],
  ["", ""],
  ["✳ DRER / illustrative agent session", "accent"],
  ["  ✓ Read the visible context", "success"],
  ["  ✓ Understand the request", "success"],
  ["  → Suggest the next step", "accent"],
  ["", ""],
  ["  This error points to a missing package.", ""],
  ["  I can explain the fix and help you", ""],
  ["  work through it, right here.", ""],
  ["", ""],
  ["  See → Understand → Plan → Act", "accent"],
  ["  Desktop actions & voice: on the roadmap", "muted"],
];

function Demo({ small = false }: { small?: boolean }) {
  const [active, setActive] = useState<"tasks" | "screen">("screen");
  const [playing, setPlaying] = useState(true);
  const [line, setLine] = useState(1);
  const demoRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.1 },
    );
    if (demoRef.current) observer.observe(demoRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!playing || !visible) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      setLine(terminalLines.length);
      return;
    }
    const timer = setInterval(
      () => setLine((v) => (v >= terminalLines.length ? 1 : v + 1)),
      line >= terminalLines.length ? 5000 : 650,
    );
    return () => clearInterval(timer);
  }, [playing, visible, line]);
  return (
    <div className={`demo-scene ${small ? "demo-small" : ""}`} ref={demoRef}>
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
            <span className="online-dot" /> Concept preview
          </span>
        </div>
        <div className="os-body">
          <aside className="os-sidebar">
            <div className="os-brand">
              <DrerMark /> drer
            </div>
            <div className="sidebar-caption">YOUR WORKSPACE</div>
            <button
              className={active === "tasks" ? "selected" : ""}
              onClick={() => setActive("tasks")}
            >
              <Layers3 size={15} /> Task planner
            </button>
            <button
              className={active === "screen" ? "selected" : ""}
              onClick={() => setActive("screen")}
            >
              <Monitor size={15} /> Screen context
            </button>
            <div className="sidebar-caption second">SYSTEM</div>
            <span>
              <Cpu size={14} /> Connected apps
            </span>
            <span>
              <Layers3 size={14} /> Files & folders
            </span>
            <span>
              <GitBranch size={14} /> Voice & text
            </span>
            <div className="sidebar-bottom">
              <span className="online-dot" /> Open source · in development
              <br />
              <small>Windows · macOS · Linux</small>
            </div>
          </aside>
          <div className="os-conversation">
            <div className="conversation-bar">
              <span>
                {active === "tasks" ? "Task planning" : "Screen understanding"}
              </span>
              <span>✳</span>
            </div>
            <div className="conversation-scroll">
              <div className="conversation-eyebrow">
                CONTEXT MAKES THE DIFFERENCE
              </div>
              <h3>
                {active === "tasks"
                  ? "A little help. All the way through."
                  : "A second pair of eyes."}
              </h3>
              <div className="user-message">
                {active === "tasks"
                  ? "Help me organize the notes for this project."
                  : "Can you explain the error on my screen?"}
              </div>
              <div className="assistant-label">
                <DrerMark /> DRER <span>with context</span>
              </div>
              <p>
                {active === "tasks"
                  ? "Start with a plan: find the relevant notes, group the useful information, then review the result before saving it. This previews the agent workflow we are building."
                  : "That message points to a missing dependency. The screen-aware prototype can help explain what you are looking at, without making you retype the error."}
              </p>
              <div className="inline-code">
                <span>
                  {active === "tasks"
                    ? "project / suggested plan"
                    : "desktop / captured context"}
                </span>
                <code>
                  {active === "tasks" ? (
                    <>
                      <b>01</b> Find the project notes
                      <br />
                      <b>02</b> Group, summarize, and review
                      <br />
                      <em>// Planned workflow · review before saving.</em>
                    </>
                  ) : (
                    <>
                      <b>capture</b> → screenshot
                      <br />
                      <b>analyze</b> → Groq Vision
                      <br />
                      <em>// Ask about the work in front of you.</em>
                    </>
                  )}
                </code>
              </div>
              <div className="context-pills">
                <span>✓ Screen context</span>
                <span>✓ Your request</span>
                <span>✓ Next steps</span>
              </div>
            </div>
            <div className="composer">
              Ask about anything on your screen...<span>↑</span>
            </div>
          </div>
          <aside className="context-panel">
            <div>
              YOUR COMPUTER <Cpu size={13} />
            </div>
            <p>
              A familiar desktop
              <br />
              <span>with a new kind of help.</span>
            </p>
            <div className="stat-row">
              <span>Windows</span>
              <b>Build target</b>
            </div>
            <div className="stat-row">
              <span>macOS</span>
              <b>Build target</b>
            </div>
            <div className="stat-row">
              <span>Linux</span>
              <b>Build target</b>
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
          <span>DRER — agent session</span>
          <button
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? "Pause terminal demo" : "Play terminal demo"}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
          </button>
        </div>
        <div
          className="terminal-content"
          aria-label="Animated illustrative DRER agent session"
        >
          {terminalLines.slice(0, line).map(([text, kind], i) => (
            <div key={i} className={kind}>
              {text || "\u00a0"}
            </div>
          ))}
          <span className="terminal-cursor" />
        </div>
      </div>
    </div>
  );
}
function PlanVisual() {
  return (
    <div className="kernel-visual">
      <div className="mini-tabs">
        <span>Context</span>
        <span>Plan</span>
        <span className="active">Steps</span>
        <span className="tag">CONCEPT</span>
      </div>
      <div className="kernel-task">
        <Check size={14} />
        <span>1. Understand the request</span>
      </div>
      <div className="task-tree">
        {[
          "Read the screen you share",
          "Keep your question in context",
          "Break the task into clear steps",
        ].map((x) => (
          <div key={x}>
            <span>✓</span>
            {x}
          </div>
        ))}
      </div>
      <div className="kernel-task">
        <MousePointer2 size={14} />
        <span>2. Help you follow through</span>
      </div>
      <div className="task-tree">
        {[
          "Find the right app or file",
          "Preview the proposed action",
          "Review the result together",
        ].map((x) => (
          <div key={x}>
            <span>→</span>
            {x}
          </div>
        ))}
      </div>
      <div className="plan-footnote">
        Multi-step actions are on the roadmap.
      </div>
      <div className="mini-progress">
        <i />
      </div>
    </div>
  );
}
function ScreenVisual() {
  return (
    <div className="screen-visual">
      <div className="capture-window">
        <div className="capture-top">
          <span className="window-dots">
            <i />
            <i />
            <i />
          </span>
          <span>project / terminal</span>
        </div>
        <div className="capture-code">
          <span>$ npm start</span>
          <br />
          <br />
          <b>Error: Cannot find module</b>
          <br />
          <span className="capture-muted">Check the project dependencies.</span>
        </div>
        <div className="capture-corners">
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="scan-line" />
      </div>
      <div className="screen-insight">
        <DrerMark />
        <div>
          A little context helps.
          <small>Ask about the screen in front of you.</small>
        </div>
        <Sparkles size={16} />
      </div>
    </div>
  );
}
function IntegrationsVisual() {
  return (
    <div className="integrations-visual">
      <div className="tech-grid">
        {[
          { Icon: Monitor, color: "#de6b30" },
          { Icon: FolderOpen, color: "#d9953e" },
          { Icon: Globe, color: "#b47447" },
          { Icon: AppWindow, color: "#b58965" },
          { Icon: Terminal, color: "#4f635c" },
          { Icon: FileCode2, color: "#b06a43" },
          { Icon: Mic, color: "#cf844e" },
          { Icon: MousePointer2, color: "#87644f" },
        ].map(({ Icon, color }, i) => (
          <div key={i} style={{ "--tech": color } as React.CSSProperties}>
            <Icon size={28} />
          </div>
        ))}
      </div>
      <div className="integrations-rule" />
      <p>
        YOUR APPS <span>●</span> YOUR FILES <span>●</span> YOUR WORK
      </p>
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
    "DRER is the open-source desktop agent we are building for the computer you already use. The goal is an assistant that understands the screen, accepts voice or text, and follows through on tasks across apps. The current starting point is the screen-aware Electron prototype.",
  ],
  [
    "Is this only for Mac?",
    "No. Windows, macOS, and Linux are all part of the product direction. The Electron project has NSIS, DMG, and AppImage build targets. Each platform still needs its own permission handling, integration work, and testing; these are build targets, not a claim of fully tested releases.",
  ],
  [
    "Can DRER already control my entire computer?",
    "Not yet. The current prototype captures a screen on request and returns an AI explanation. Voice, app control, file actions, and reliable multi-step task execution are the next development stages. The demos on this page illustrate that direction.",
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
          <p>Explore the DRER product direction.</p>
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
              An open-source agent for the computer you already use. See what’s
              on screen, understand what you need, and work toward getting it
              done. One direction, across Windows, macOS, and Linux.
            </p>
            <div className="hero-actions">
              <a href="#get-started" className="button button-orange">
                <Monitor size={18} /> Explore DRER <ArrowDown size={15} />
              </a>
              <a href={repo} className="button button-orange">
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
              A screen-aware starting point for your desktop <Arrow />
            </a>
            <a href="#roadmap">
              Voice, actions, and the agent loop <Arrow />
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
            Product concept · screen understanding is the starting point; voice
            and desktop actions are in development.
          </p>
        </section>
        <section className="features section-container" id="intelligence">
          <article className="feature-row reveal" id="companion">
            <div className="feature-copy">
              <h2>
                Start with what’s
                <br />
                right in front of you
              </h2>
              <p>
                An error, a document, a design, a browser tab. Your screen
                already holds the context. DRER starts with{" "}
                <a href={overlay}>screen understanding</a>, so you can ask about
                what you see without copying everything into a chat.
              </p>
              <a className="text-link" href={overlay}>
                Explore the screen-aware prototype <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <ScreenVisual />
            </div>
          </article>
          <article className="feature-row reveal" id="roadmap">
            <div className="feature-copy">
              <h2>
                From answering questions
                <br />
                to following through
              </h2>
              <p>
                “Find my project notes and summarize them.” The goal is an agent
                that can plan a task, work across apps, and help finish it.{" "}
                <a href={repo}>
                  Voice, desktop actions, and multi-step workflows
                </a>{" "}
                are the next chapters we are building toward.
              </p>
              <a className="text-link" href={repo}>
                Help build the agent <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <PlanVisual />
            </div>
          </article>
          <article className="feature-row reveal">
            <div className="feature-copy">
              <h2>
                Your apps. Your files.
                <br />A more helpful computer.
              </h2>
              <p>
                The ambition goes beyond a single chat window. Talk or type,
                bring in screen context, and get help where the work happens. We
                are designing DRER to connect{" "}
                <a href="#roadmap">understanding with action</a> across the
                tools you use every day.
              </p>
              <a className="text-link" href="#faq">
                See what works today <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <IntegrationsVisual />
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
        <section className="principles section-container reveal">
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
                Screen understanding comes first. Voice and text, useful
                actions, and a more capable agent loop are the next steps toward
                a desktop that can help.
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
                text: "Voice, app and file actions, and tasks that span steps. For Windows, macOS, and Linux.",
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
            A little less friction.
            <br />A lot more possibility.
          </h2>
          <p>Help build an agent for everyone’s computer.</p>
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
