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
  Pause,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";

const repo = "https://github.com/apreezofficial/drer";
const docs = `${repo}/blob/main/aura-os/docs/run.md`;
const overlay = `${repo}/tree/main/aura-os/electron`;
const command = "git clone https://github.com/apreezofficial/drer.git";

function AuraMark({ className = "" }: { className?: string }) {
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
  const text = "Intelligence at the heart of your system.";
  return (
    <h1 aria-label={text}>
      <span aria-hidden="true">
        {text.split(" ").map((word, i) => (
          <span
            className="title-word"
            style={{ animationDelay: `${120 + i * 85}ms` }}
            key={i}
          >
            {word}&nbsp;
          </span>
        ))}
      </span>
      <span className="title-caret" aria-hidden="true" />
    </h1>
  );
}
const searchItems = [
  {
    title: "Run AuraOS in QEMU",
    description: "Build prerequisites and kernel setup",
    href: docs,
  },
  {
    title: "AuraAI desktop companion",
    description: "Screen capture, overlay, and Groq setup",
    href: overlay,
  },
  {
    title: "Kernel architecture",
    description: "Memory, interrupts, drivers, and AI core",
    href: `${repo}/blob/main/aura-os/docs/architecture.md`,
  },
  {
    title: "AI layer",
    description: "Context collection and inference",
    href: `${repo}/blob/main/aura-os/docs/ai-layer.md`,
  },
  {
    title: "Source code",
    description: "Explore the project on GitHub",
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
        <a className="logo" href="#" aria-label="AuraOS home">
          <AuraMark />
          <span>
            AURA<span className="logo-outline">OS</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="#intelligence">INTELLIGENCE</a>
          <div className="nav-dropdown">
            <button
              aria-expanded={dropdown === "products"}
              onClick={() =>
                setDropdown(dropdown === "products" ? null : "products")
              }
            >
              PRODUCTS <ChevronDown size={13} />
            </button>
            {dropdown === "products" && (
              <div className="dropdown-panel">
                <a href="#kernel" onClick={() => setDropdown(null)}>
                  <Cpu size={19} />
                  <span>
                    AuraOS<small>The AI-native kernel</small>
                  </span>
                  <Arrow />
                </a>
                <a href="#companion" onClick={() => setDropdown(null)}>
                  <Monitor size={19} />
                  <span>
                    AuraAI<small>Your desktop companion</small>
                  </span>
                  <Arrow />
                </a>
              </div>
            )}
          </div>
          <a href="#architecture">ARCHITECTURE</a>
          <a href={docs}>DOCS</a>
          <a href={repo}>
            GITHUB <Arrow />
          </a>
          <div className="nav-dropdown">
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
                  <a key={x.title} href={x.href}>
                    <span>{x.title}</span>
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
          <a
            className="header-source"
            href={repo}
            aria-label="AuraOS on GitHub"
          >
            <Github size={19} />
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
            ["Intelligence", "#intelligence"],
            ["AuraOS kernel", "#kernel"],
            ["AuraAI companion", "#companion"],
            ["Architecture", "#architecture"],
            ["Documentation", docs],
            ["GitHub", repo],
            ["Get started", "#get-started"],
          ].map(([label, href]) => (
            <a href={href} key={label} onClick={() => setMenu(false)}>
              {label}
              <Arrow />
            </a>
          ))}
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
            aria-label="Search AuraOS documentation"
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
                placeholder="Search AuraOS..."
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
              ) && <p>No results. Try “kernel” or “desktop”.</p>}
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
  ["$ make run", "command"],
  ["[AuraOS] Kernel booting...", "muted"],
  ["  ✓ GDT · IDT · Interrupts enabled", "success"],
  ["  ✓ Physical and virtual memory online", "success"],
  ["  ✓ AI core initialized", "success"],
  ["", ""],
  ["aura@os › ai explain how paging works", "command"],
  ["", ""],
  ["✳ AuraAI", "accent"],
  ["  The kernel uses x86 two-level paging.", ""],
  ["  A page directory points to page tables;", ""],
  ["  each table maps 4 KB physical frames.", ""],
  ["", ""],
  ["  System context. A clearer answer.", "accent"],
];
function Demo({ small = false }: { small?: boolean }) {
  const [active, setActive] = useState<"kernel" | "screen">("kernel");
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
            <AuraMark /> AuraOS workspace
          </span>
          <span className="os-top-right">
            <span className="online-dot" /> Context connected
          </span>
        </div>
        <div className="os-body">
          <aside className="os-sidebar">
            <div className="os-brand">
              <AuraMark /> aura<span>os</span>
            </div>
            <div className="sidebar-caption">YOUR WORKSPACE</div>
            <button
              className={active === "kernel" ? "selected" : ""}
              onClick={() => setActive("kernel")}
            >
              <Terminal size={15} /> Kernel shell
            </button>
            <button
              className={active === "screen" ? "selected" : ""}
              onClick={() => setActive("screen")}
            >
              <Monitor size={15} /> Screen companion
            </button>
            <div className="sidebar-caption second">SYSTEM</div>
            <span>
              <Cpu size={14} /> Memory manager
            </span>
            <span>
              <Layers3 size={14} /> Interrupts & events
            </span>
            <span>
              <GitBranch size={14} /> Inference backend
            </span>
            <div className="sidebar-bottom">
              <span className="online-dot" /> Experimental build
              <br />
              <small>x86 · protected mode</small>
            </div>
          </aside>
          <div className="os-conversation">
            <div className="conversation-bar">
              <span>
                {active === "kernel"
                  ? "Kernel intelligence"
                  : "Screen companion"}
              </span>
              <span>✳</span>
            </div>
            <div className="conversation-scroll">
              <div className="conversation-eyebrow">
                CONTEXT MAKES THE DIFFERENCE
              </div>
              <h3>
                {active === "kernel"
                  ? "Your system, explained."
                  : "A second pair of eyes."}
              </h3>
              <div className="user-message">
                {active === "kernel"
                  ? "How does memory work in this kernel?"
                  : "Can you explain the error on my screen?"}
              </div>
              <div className="assistant-label">
                <AuraMark /> AuraAI <span>with context</span>
              </div>
              <p>
                {active === "kernel"
                  ? "Let’s look under the surface. AuraOS tracks physical memory in 4 KB frames and maps it with a two-level paging structure."
                  : "Capture your screen with the desktop companion, ask a question, and get an explanation in a floating overlay."}
              </p>
              <div className="inline-code">
                <span>
                  {active === "kernel"
                    ? "kernel / mm / pmm.c"
                    : "electron / screen context"}
                </span>
                <code>
                  {active === "kernel" ? (
                    <>
                      <b>uint32_t</b> frame = pmm_alloc_frame();
                      <br />
                      <b>vmm_map_page</b>(virtual, frame, flags);
                      <br />
                      <em>// Physical memory, mapped to your context.</em>
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
                <span>✓ Memory context</span>
                <span>✓ System events</span>
                <span>✓ Uptime</span>
              </div>
            </div>
            <div className="composer">
              Ask about your system...<span>↑</span>
            </div>
          </div>
          <aside className="context-panel">
            <div>
              SYSTEM CONTEXT <Cpu size={13} />
            </div>
            <p>
              Live understanding
              <br />
              <span>starts at the core.</span>
            </p>
            <div className="stat-row">
              <span>Architecture</span>
              <b>x86 / 32-bit</b>
            </div>
            <div className="stat-row">
              <span>Memory frames</span>
              <b>4 KB</b>
            </div>
            <div className="stat-row">
              <span>Timer</span>
              <b>1000 Hz</b>
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
          <span>Terminal — AuraOS</span>
          <button
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? "Pause terminal demo" : "Play terminal demo"}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
          </button>
        </div>
        <div
          className="terminal-content"
          aria-label="Animated illustrative AuraOS boot session"
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
function KernelVisual() {
  return (
    <div className="kernel-visual">
      <div className="mini-tabs">
        <span>Requirements</span>
        <span>Architecture</span>
        <span className="active">Kernel</span>
        <span className="tag">All systems</span>
      </div>
      <div className="kernel-task">
        <Check size={14} />
        <span>1. Initialize the core subsystems</span>
      </div>
      <div className="task-tree">
        {[
          "GDT + IDT · protected mode",
          "Physical memory · bitmap allocator",
          "Virtual memory · x86 paging",
          "PIT timer · 1000 Hz",
          "PS/2 keyboard · input stream",
        ].map((s, i) => (
          <div key={s} style={{ animationDelay: `${i * 0.15}s` }}>
            <span>✓</span>
            {s}
          </div>
        ))}
      </div>
      <div className="kernel-task">
        <Check size={14} />
        <span>2. Bring context into the conversation</span>
      </div>
      <div className="task-tree">
        <div>
          <span>✓</span>Collect system state
        </div>
        <div>
          <span>✓</span>Query the AI core
        </div>
        <div>
          <span>✓</span>Explain what is happening
        </div>
      </div>
      <div className="mini-progress">
        <i />
      </div>
    </div>
  );
}
function MemoryVisual() {
  return (
    <div className="memory-visual">
      <div className="memory-card">
        <span className="tiny-label">SYSTEM / MEMORY</span>
        <h4>Every bit has a purpose.</h4>
        <p>Physical memory manager</p>
        <div className="bitmap">
          {Array.from({ length: 96 }, (_, i) => (
            <i
              className={i < 21 || i % 17 === 0 ? "allocated" : ""}
              style={{ animationDelay: `${i * 25}ms` }}
              key={i}
            />
          ))}
        </div>
        <div className="bitmap-key">
          <span>
            <i /> Allocated
          </span>
          <span>
            <i /> Available
          </span>
        </div>
        <div className="memory-foot">1 bit → 1 physical frame → 4 KB</div>
      </div>
    </div>
  );
}
function IntegrationsVisual() {
  return (
    <div className="integrations-visual">
      <div className="tech-grid">
        {[
          { text: "C", color: "#4572bd" },
          { text: "ASM", color: "#fa6c4b" },
          { text: "Q", color: "#e79725" },
          { text: "G", color: "#f35a2c" },
          { text: "E", color: "#8cdded" },
          { text: "PY", color: "#ecc94b" },
          { text: "GIT", color: "#f2573b" },
          { text: "x86", color: "#9b63ed" },
        ].map((x) => (
          <div
            key={x.text}
            style={{ "--tech": x.color } as React.CSSProperties}
          >
            {x.text}
          </div>
        ))}
      </div>
      <div className="integrations-rule" />
      <p>
        C + ASSEMBLY <span>●</span> QEMU <span>●</span> ELECTRON
      </p>
    </div>
  );
}
function BackendVisual() {
  const [backend, setBackend] = useState("Groq");
  return (
    <div className="backend-visual">
      <div className="backend-menu">
        <span className="tiny-label">INFERENCE BACKEND</span>
        {[
          { name: "Groq", detail: "Host-side serial proxy", tag: "API" },
          {
            name: "Mock engine",
            detail: "Built in · no API key",
            tag: "LOCAL",
          },
          { name: "Local inference", detail: "On the roadmap", tag: "PLANNED" },
        ].map((x) => (
          <button
            disabled={x.tag === "PLANNED"}
            className={backend === x.name ? "active" : ""}
            key={x.name}
            onClick={() => setBackend(x.name)}
          >
            <span>
              {x.name}
              <small>{x.detail}</small>
            </span>
            <span className="backend-badge">
              {backend === x.name ? <Check size={12} /> : x.tag}
            </span>
          </button>
        ))}
      </div>
      <div className="backend-composer">
        ai explain this system <ArrowRight size={14} />
      </div>
      <div className="backend-status">
        <span className="online-dot" />
        {backend} selected · illustrative configuration
      </div>
    </div>
  );
}
const faqItems = [
  [
    "What is AuraOS?",
    "AuraOS is an experimental, AI-native, 32-bit x86 operating system. Its AI core is a kernel subsystem alongside memory management, interrupt handlers, and drivers. It is a project for exploration and learning, created by Precious Adedokun.",
  ],
  [
    "How is AuraAI different from AuraOS?",
    "AuraOS is the kernel project that runs in QEMU. AuraAI is a separate Electron application that runs on an existing desktop, captures your screen when invoked, and shows an AI response in a floating overlay. You can explore either independently.",
  ],
  [
    "How can I get started?",
    "Clone the repository and follow the setup guide. For the kernel you will need NASM, an x86 cross-compiler, and QEMU. For the desktop companion, install its npm dependencies and configure your Groq API key.",
  ],
  [
    "Does the AI run locally?",
    "The kernel includes a built-in mock responder that works without an API key. Real model inference uses Groq through a host-side serial proxy. Local model inference remains on the roadmap.",
  ],
  [
    "What happens to my screen capture?",
    "The desktop companion sends the screenshot you capture to Groq for analysis using your API key. The screen-aware workflow is a cloud inference feature; screenshots are not processed entirely on your device.",
  ],
  [
    "Can I use this as my everyday operating system?",
    "AuraOS is an early experimental kernel, not a complete everyday desktop. Run it in a virtual environment such as QEMU. A scheduler, filesystem, and networking are among the planned features.",
  ],
  [
    "Is the demo on this page a running operating system?",
    "The interactive workspace and walkthrough are illustrative demonstrations. They show how the project is structured and how the workflow feels. To run the actual software, build the kernel or launch the Electron companion from the repository.",
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
            From boot to
            <br />a better question.
          </h3>
          <p>Explore the AuraOS workflow.</p>
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
            aria-label="AuraOS illustrative walkthrough"
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
              src="/media/aura-walkthrough.webm"
              controls
              autoPlay
              playsInline
              preload="metadata"
            />
            <p>
              Illustrative AuraOS workflow · build and run the real project from
              source.
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
              AuraOS brings AI into the heart of the operating system.
              Understand your kernel with system context, or see your desktop in
              a new way with a screen-aware companion. Built from scratch. Built
              in the open.
            </p>
            <div className="hero-actions">
              <a href={docs} className="button button-purple">
                <Cpu size={18} /> Build AuraOS <Download size={16} />
              </a>
              <a href={overlay} className="button button-purple">
                <Monitor size={18} /> Get AuraAI <ArrowDown size={15} />
              </a>
              <CopyCommand />
            </div>
          </div>
          <aside className="whats-new">
            <h2>
              <span /> WHAT’S NEW
            </h2>
            <a href={overlay}>
              Meet AuraAI: your screen-aware desktop companion <Arrow />
            </a>
            <a href={`${repo}/blob/main/aura-os/docs/ai-layer.md`}>
              Kernel context meets Groq inference <Arrow />
            </a>
            <a href={`${repo}/blob/main/aura-os/docs/architecture.md`}>
              Explore the architecture, from boot to shell <Arrow />
            </a>
          </aside>
        </section>
        <section
          className="product-section section-container"
          aria-label="AuraOS interactive product preview"
        >
          <Demo />
          <p className="demo-caption">
            Illustrative workspace. Select a view to explore the kernel or
            desktop companion.
          </p>
        </section>
        <section className="features section-container" id="intelligence">
          <article className="feature-row reveal" id="kernel">
            <div className="feature-copy">
              <h2>
                Bring intelligence closer
                <br />
                to the operating system
              </h2>
              <p>
                AuraOS puts the{" "}
                <a href={`${repo}/blob/main/aura-os/docs/ai-layer.md`}>
                  AI core inside the kernel
                </a>
                , alongside memory management and interrupts. Every question can
                carry system context, so you can understand what the computer is
                actually doing.
              </p>
              <a
                className="text-link"
                href={`${repo}/blob/main/aura-os/docs/architecture.md`}
              >
                Explore the kernel <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <KernelVisual />
            </div>
          </article>
          <article className="feature-row reveal">
            <div className="feature-copy">
              <h2>
                A clearer picture of
                <br />
                what is happening inside
              </h2>
              <p>
                From physical frames to page tables, there is a lot beneath a
                prompt. AuraOS collects{" "}
                <a href={`${repo}/blob/main/aura-os/docs/ai-layer.md`}>
                  memory statistics and system state
                </a>{" "}
                before a query, giving the assistant a foundation for explaining
                the kernel.
              </p>
              <a
                className="text-link"
                href={`${repo}/tree/main/aura-os/kernel`}
              >
                Look under the surface <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <MemoryVisual />
            </div>
          </article>
          <article className="feature-row reveal" id="companion">
            <div className="feature-copy">
              <h2>
                Alongside you, across
                <br />
                your desktop
              </h2>
              <p>
                Working through a terminal error? Exploring a design? The
                separate <a href={overlay}>AuraAI desktop companion</a> captures
                the screen you invoke it on, sends it to Groq, and brings an
                explanation back in a floating overlay.
              </p>
              <a className="text-link" href={overlay}>
                Meet the desktop companion <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <IntegrationsVisual />
            </div>
          </article>
          <article className="feature-row reveal">
            <div className="feature-copy">
              <h2>
                A small core.
                <br />
                Room for possibility.
              </h2>
              <p>
                Use <a href={docs}>Groq through a host-side serial proxy</a>, or
                explore the kernel with the built-in mock responder. The
                inference layer is designed to be replaceable. Local model
                inference is part of the roadmap.
              </p>
              <a
                className="text-link"
                href={`${repo}/blob/main/aura-os/docs/ai-layer.md`}
              >
                Learn about inference <Arrow />
              </a>
            </div>
            <div className="feature-art">
              <BackendVisual />
            </div>
          </article>
        </section>
        <section
          className="principles section-container reveal"
          id="architecture"
        >
          <h2>Built for the curious</h2>
          <div className="principle-grid">
            <article>
              <Code2 />
              <h3>Open from the beginning</h3>
              <p>
                Read the C and Assembly. Follow the boot sequence. Trace the
                path from a keyboard interrupt to a question in the shell. The
                source is yours to explore.
              </p>
              <a href={repo}>
                Explore the repository <Arrow />
              </a>
            </article>
            <article>
              <ShieldCheck />
              <h3>Understand the boundaries</h3>
              <p>
                A research kernel, a separate desktop app, and a cloud inference
                backend. Clear architecture makes it easier to see what runs
                where and where context goes.
              </p>
              <a href={`${repo}/blob/main/aura-os/docs/architecture.md`}>
                Read the architecture <Arrow />
              </a>
            </article>
            <article>
              <Sparkles />
              <h3>Experiment on your terms</h3>
              <p>
                Boot the kernel in QEMU, use the mock responder without a key,
                or connect Groq. Start small, ask questions, and make the next
                piece your own.
              </p>
              <a href={docs}>
                Start building <Arrow />
              </a>
            </article>
          </div>
        </section>
        <section className="journey section-container reveal">
          <h2>
            From the first instruction
            <br />
            to your next idea
          </h2>
          <div className="journey-grid">
            {[
              {
                n: "01",
                label: "BOOT",
                title: "A foundation in C + Assembly",
                text: "Multiboot entry, protected mode, and the first kernel instructions.",
                href: `${repo}/tree/main/aura-os/boot`,
              },
              {
                n: "02",
                label: "UNDERSTAND",
                title: "A system with context",
                text: "Memory, timers, and events feed a context-aware AI core.",
                href: `${repo}/blob/main/aura-os/docs/ai-layer.md`,
              },
              {
                n: "03",
                label: "EXPLORE",
                title: "A different kind of interface",
                text: "Ask about the kernel, or bring the companion to your desktop.",
                href: overlay,
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
          <h2>Get started with quick guides</h2>
          <div className="guide-grid">
            <Walkthrough />
            <a className="guide-card" href={docs}>
              <div>
                <span className="tiny-label">[ GUIDE ]</span>
                <h3>Your first boot</h3>
                <p>Build and run AuraOS in QEMU.</p>
              </div>
              <div className="guide-icon">
                <Cpu size={29} />
              </div>
              <Arrow />
            </a>
            <a className="guide-card" href={overlay}>
              <div>
                <span className="tiny-label">[ GUIDE ]</span>
                <h3>Meet your companion</h3>
                <p>Set up the AuraAI desktop overlay.</p>
              </div>
              <div className="guide-icon lilac">
                <AuraMark />
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
            Build something
            <br />
            from the inside out.
          </h2>
          <p>Start with a little curiosity.</p>
          <div className="hero-actions">
            <a href={docs} className="button button-white">
              <Cpu size={17} /> Build AuraOS <Download size={15} />
            </a>
            <a href={overlay} className="button button-white">
              <Monitor size={17} /> Get AuraAI <Arrow />
            </a>
            <CopyCommand compact />
          </div>
          <div className="cta-mark">
            <AuraMark />
          </div>
        </section>
      </main>
      <footer className="footer section-container">
        <div className="footer-main">
          <a href="#" className="logo" aria-label="AuraOS home">
            <span className="logo-outline">AURAOS</span>
          </a>
          <div className="footer-columns">
            {[
              {
                title: "PRODUCT",
                links: [
                  ["AuraOS kernel", `${repo}/tree/main/aura-os`],
                  ["AuraAI companion", overlay],
                  ["AI layer", `${repo}/blob/main/aura-os/docs/ai-layer.md`],
                  ["Roadmap", `${repo}/tree/main/aura-os#roadmap`],
                ],
              },
              {
                title: "EXPLORE",
                links: [
                  [
                    "Architecture",
                    `${repo}/blob/main/aura-os/docs/architecture.md`,
                  ],
                  ["Build guide", docs],
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
          <span>Experimental software. Built in the open.</span>
          <a href={repo}>
            View source <Arrow />
          </a>
        </div>
      </footer>
    </>
  );
}
