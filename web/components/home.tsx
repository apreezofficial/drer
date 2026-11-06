"use client";

import { useEffect, useRef, useState } from "react";
import { DrerMark } from "./brand";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  Github,
  Layers3,
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
  const text = "Not everything needs your hands. Let your fingers rest.";
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
function ScrollType({
  text,
  intro = false,
}: {
  text: string;
  intro?: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px", threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  let offset = 0;
  return (
    <p
      ref={ref}
      className={`${intro ? "feature-intro-text" : "feature-description"} scroll-type ${seen ? "has-entered" : ""}`}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(" ").map((word, i) => {
          const start = offset;
          offset += word.length + 1;
          return (
            <span className="scroll-word" key={i}>
              {word.split("").map((char, j) => (
                <span
                  key={j}
                  className="scroll-char"
                  style={
                    {
                      "--char-delay": `${(start + j) * (intro ? 15 : 5)}ms`,
                    } as React.CSSProperties
                  }
                >
                  {char}
                </span>
              ))}{" "}
            </span>
          );
        })}
      </span>
      {intro && <span className="intro-cursor" aria-hidden="true" />}
    </p>
  );
}
function FeatureIntroduction() {
  const icons = [
    Mic,
    CalendarDays,
    Bell,
    Repeat2,
    FolderOpen,
    WandSparkles,
    Code2,
    Sparkles,
    Globe,
    Monitor,
    AppWindow,
    Terminal,
    MousePointer2,
    Layers3,
    Mic,
  ];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visibility = new IntersectionObserver(([entry]) => {
      node.dataset.waveActive = String(entry.isIntersecting);
    });
    visibility.observe(node);
    let frame = 0;
    const update = () => {
      frame = 0;
      if (reduce.matches) return;
      const r = node.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const progress = Math.max(
        0,
        Math.min(1, (innerHeight - r.top) / (innerHeight + r.height)),
      );
      node.style.setProperty("--strip-travel", `${-150 * progress}px`);
    };
    const scroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    update();
    return () => {
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("resize", scroll);
      cancelAnimationFrame(frame);
      visibility.disconnect();
    };
  }, []);
  return (
    <div className="feature-introduction" ref={ref}>
      <div className="feature-orbit-strip" aria-hidden="true">
        <div className="feature-orbit-track">
          {icons.map((Icon, i) => (
            <div
              className="feature-orbit"
              key={i}
              style={
                { "--orbit-delay": `${-i * 0.48}s` } as React.CSSProperties
              }
            >
              <Icon strokeWidth={1.4} />
            </div>
          ))}
        </div>
      </div>
      <div className="section-container">
        <ScrollType
          intro
          text="DRER is an open-source assistant for your computer and connected tools. Call it to plan your day, remember what matters, automate a routine, or build your next idea."
        />
      </div>
    </div>
  );
}
export function VoiceVisual() {
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
export function CalendarVisual() {
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
export function BuildVisual() {
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
export function PlatformVisual() {
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
function LivePlayer() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setReduced(prefersReduced);
    if (prefersReduced) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const video = ref.current;
    if (!video || !video.duration) return;
    e.stopPropagation();
    const box = e.currentTarget.getBoundingClientRect();
    video.currentTime =
      Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)) *
      video.duration;
  }
  return (
    <div
      className="group relative overflow-hidden rounded-[18px] bg-panel leading-none shadow-[0_24px_60px_#0006]"
      data-playing={playing}
    >
      <video
        ref={ref}
        className="block max-h-[760px] w-full cursor-pointer bg-panel object-contain"
        muted
        loop
        playsInline
        preload="metadata"
        poster="/media/drer-macos-live-poster.png"
        aria-label="Actual DRER macOS integration test recording"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setProgress(v.duration ? v.currentTime / v.duration : 0);
        }}
        onClick={toggle}
      >
        <source src="/media/drer-macos-live.mp4" type="video/mp4" />
        Your browser does not support video playback.
      </video>
      <div className="absolute bottom-[18px] left-1/2 flex w-[min(360px,calc(100%-32px))] -translate-x-1/2 translate-y-2 items-center gap-3 rounded-full border border-line bg-panel py-2 pr-4 pl-2 opacity-0 shadow-[0_10px_30px_#0008] transition duration-200 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 group-data-[playing=false]:translate-y-0 group-data-[playing=false]:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
        <button
          type="button"
          className="grid size-[34px] flex-none cursor-pointer place-items-center rounded-full bg-accent text-black hover:bg-accent-soft"
          onClick={toggle}
          aria-label={playing ? "Pause recording" : "Play recording"}
        >
          {playing ? (
            <Pause size={15} fill="currentColor" />
          ) : (
            <Play size={15} fill="currentColor" />
          )}
        </button>
        <div
          className="relative h-1 flex-1 cursor-pointer rounded-sm bg-line before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-['']"
          onClick={seek}
          role="progressbar"
          aria-label="Recording progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span
            className="absolute inset-0 origin-left rounded-sm bg-accent"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>
      {!playing && reduced && (
        <button
          type="button"
          className="absolute inset-0 m-auto grid size-[84px] cursor-pointer place-items-center rounded-full bg-accent text-black"
          onClick={toggle}
          aria-label="Play recording"
        >
          <Play size={30} fill="currentColor" />
        </button>
      )}
    </div>
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
      <main id="main">
        <section className="hero section-container">
          <div className="hero-main">
            <AnimatedTitle />
            <p className="hero-description">
              From reading screens and capturing captions to browsing,
              researching, managing calendars, setting alarms, and organizing
              meetings—DRER is being built to turn everyday requests into
              action. Call it by name and put your routines on autopilot, across
              Windows, macOS, and Linux.
            </p>
            <div className="hero-actions">
              <a href="/get-started" className="button button-orange">
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
          aria-label="Recorded DRER macOS integration test"
        >
          <div className="rounded-[28px] bg-accent-soft p-[clamp(14px,3vw,40px)] min-[761px]:rounded-[44px]">
            <LivePlayer />
          </div>
          <p className="mx-auto mt-[18px] max-w-[760px] text-center font-body text-[13px] text-muted underline decoration-line underline-offset-4">
            Recorded macOS integration test · real Apple Reminders, a live AI
            tool call, Calculator, and Apple Calendar. Native reminders verified
            after DRER quit. Voice activation and broader automation are still
            in development.
          </p>
        </section>
        <section
          className="features"
          id="intelligence"
          aria-label="Explore DRER features"
        >
          <FeatureIntroduction />
          <div className="feature-explorer section-container">
            <article className="feature-row" id="companion">
              <div className="feature-copy">
                <span className="feature-kicker">01 / CALL YOUR ASSISTANT</span>
                <h2>Just say, “Hey DRER.”</h2>
                <ScrollType text="Start with a wake phrase, a shortcut, or a typed request. DRER is being built to understand your intent and help across your desktop and connected tools, whether you are planning your day or starting something new." />
                <a className="text-link" href={overlay}>
                  Explore the current prototype <Arrow />
                </a>
              </div>
              <div className="feature-art feature-voice">
                <VoiceVisual />
              </div>
            </article>
            <article className="feature-row" id="calendar">
              <div className="feature-copy">
                <span className="feature-kicker">
                  02 / PLAN, REMEMBER, AUTOMATE
                </span>
                <h2>
                  A little more room
                  <br />
                  in your day.
                </h2>
                <ScrollType text="Find focus time around meetings, remember a deadline, or ask for a morning briefing every weekday. Connected calendars, reminders, and recurring routines are central to the DRER vision: useful help that moves with your life." />
                <a className="text-link" href="#roadmap">
                  Explore the direction <Arrow />
                </a>
              </div>
              <div className="feature-art feature-calendar">
                <CalendarVisual />
              </div>
            </article>
            <article className="feature-row" id="build">
              <div className="feature-copy">
                <span className="feature-kicker">
                  03 / VIBE-BUILD WHAT YOU IMAGINE
                </span>
                <h2>
                  Your idea.
                  <br />A first version.
                </h2>
                <ScrollType text="“DRER, build me a habit tracker.” Describe the app, website, or small tool you have in mind. The goal is to help turn that description into a working first version you can preview, check, and refine together." />
                <a className="text-link" href="#get-started">
                  Help build what comes next <Arrow />
                </a>
              </div>
              <div className="feature-art feature-build">
                <BuildVisual />
              </div>
            </article>
            <article className="feature-row" id="platforms">
              <div className="feature-copy">
                <span className="feature-kicker">
                  04 / YOUR COMPUTER, YOUR CHOICE
                </span>
                <h2>
                  Windows. macOS.
                  <br />
                  Linux. DRER.
                </h2>
                <ScrollType text="An assistant for the computer you already use. Windows, macOS, and Linux are all part of the plan. The Electron foundation includes build targets for each; native permissions, integrations, and platform validation are still in development." />
                <a
                  className="button button-outline feature-explore-button"
                  href={overlay}
                >
                  Explore the project <Arrow />
                </a>
              </div>
              <div className="feature-art feature-platform">
                <PlatformVisual />
              </div>
            </article>
          </div>
          <p className="feature-development-note section-container">
            Product concepts · voice, connected tools, automations, and
            software-building are planned. The current prototype provides screen
            capture and AI explanations.
          </p>
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
    </>
  );
}
