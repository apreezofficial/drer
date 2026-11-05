"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Mic,
  Monitor,
  CalendarDays,
  Bell,
  Code2,
  GitBranch,
  FolderOpen,
  Terminal,
  Layers3,
  Sparkles,
} from "lucide-react";
import { BuildVisual, PlatformVisual } from "./home";
import { DrerMark } from "./brand";
export function CommandBlock({
  code,
  label = "TERMINAL",
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false),
    [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setFailed(false);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  }
  return (
    <div className="command-block">
      <div className="command-block-head">
        <span>{label}</span>
        <button
          onClick={copy}
          aria-label={`Copy ${label.toLowerCase()} commands`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
      <span role="status" className={failed ? "command-error" : "sr-only"}>
        {failed
          ? "Copy unavailable. Select the command text to copy it."
          : copied
            ? "Commands copied."
            : ""}
      </span>
    </div>
  );
}
export function SetupGuide({ compact = false }: { compact?: boolean }) {
  const [os, setOS] = useState("Windows");
  const env =
    os === "Windows"
      ? '$env:GROQ_API_KEY="gsk_your_key_here"'
      : 'export GROQ_API_KEY="gsk_your_key_here"';
  const packaging =
    os === "Windows"
      ? "npm run build"
      : os === "macOS"
        ? "npm run build:mac"
        : "npm run build:linux";
  return (
    <section className="setup-guide" id="setup">
      <div className="setup-guide-header">
        <div>
          <span className="x-eyebrow">LOCAL SETUP</span>
          <h2>Choose your platform.</h2>
        </div>
        <div
          className="platform-switch"
          role="group"
          aria-label="Setup operating system"
        >
          {["Windows", "macOS", "Linux"].map((x) => (
            <button key={x} onClick={() => setOS(x)} aria-pressed={os === x}>
              {x}
            </button>
          ))}
        </div>
      </div>
      <div className="setup-step">
        <span>01</span>
        <div>
          <h3>Get the source and dependencies.</h3>
          <p>
            Clone the repository and enter the existing Electron application.
          </p>
          <CommandBlock
            label="INSTALL"
            code={
              "git clone https://github.com/apreezofficial/drer.git\ncd drer/aura-os/electron\nnpm install"
            }
          />
        </div>
      </div>
      <div className="setup-step">
        <span>02</span>
        <div>
          <h3>Configure Groq and run the prototype.</h3>
          <p>
            {os === "Windows"
              ? "Use PowerShell for this environment variable."
              : "Use a shell such as bash or zsh for this environment variable."}{" "}
            Replace the placeholder with your own key. App settings are another
            configuration option.
          </p>
          <CommandBlock
            label={os === "Windows" ? "POWERSHELL" : "SHELL"}
            code={`${env}\nnpm start`}
          />
        </div>
      </div>
      {!compact && (
        <div className="setup-step" id="packaging">
          <span>03</span>
          <div>
            <h3>Explore the {os} packaging target.</h3>
            <p>
              This runs the repository’s target build script. Packaging assets,
              permissions, and the resulting application still need validation
              on the target OS.
            </p>
            <CommandBlock label="PACKAGING" code={packaging} />
          </div>
        </div>
      )}
      <p className="page-small-note">
        Screen captures are sent to Groq when invoked. The prototype is still
        named AuraAI in the source; DRER describes the broader assistant
        direction.
      </p>
    </section>
  );
}
const requests = [
  {
    label: "Plan my day",
    text: "Hey DRER, plan my day around my meetings.",
    answer:
      "A proposed plan starts with your connected calendar, finds focus time, and prepares reminders for review.",
    Icon: CalendarDays,
  },
  {
    label: "Research an idea",
    text: "DRER, research this idea and organize the useful findings.",
    answer:
      "The goal is to browse relevant sources, keep references, and turn the findings into a reviewable summary.",
    Icon: FolderOpen,
  },
  {
    label: "Build something",
    text: "DRER, build me a habit tracker.",
    answer:
      "The planned workflow turns a description into files, a working preview, and a conversation about the next improvement.",
    Icon: Code2,
  },
];
function AgentVisual() {
  const [index, setIndex] = useState(0);
  const item = requests[index];
  return (
    <div className="agent-console">
      <div className="console-chrome">
        <DrerMark />
        <span>drer / a conversation with possibilities</span>
        <span className="console-status">CONCEPT</span>
      </div>
      <div className="console-orb">
        <Mic size={28} />
        <i />
        <i />
      </div>
      <p className="console-request">“{item.text}”</p>
      <div className="console-answer">
        <Sparkles size={16} />
        <p>{item.answer}</p>
      </div>
      <div className="console-options" role="group" aria-label="Agent examples">
        {requests.map((x, i) => (
          <button
            key={x.label}
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            <x.Icon size={13} />
            {x.label}
          </button>
        ))}
      </div>
      <small>
        Illustrative requests · connected tools and actions are planned.
      </small>
    </div>
  );
}
const workflows = [
  {
    label: "Morning briefing",
    request: "Every weekday at 8:30, show my meetings and priorities.",
    steps: [
      "Gather the connected calendar",
      "Include reminders and upcoming deadlines",
      "Prepare a short briefing",
    ],
    schedule: "Weekdays / 08:30 / your time zone",
  },
  {
    label: "Organize a meeting",
    request: "Find a good time for a project check-in.",
    steps: [
      "Review availability from connected calendars",
      "Draft a meeting time, guests, and description",
      "Ask you to review before creating an event",
    ],
    schedule: "Event draft / review required",
  },
  {
    label: "Remember a deadline",
    request: "Remind me tomorrow at 9 to submit the project.",
    steps: [
      "Capture the task and deadline",
      "Resolve tomorrow in your time zone",
      "Prepare a reminder for confirmation",
    ],
    schedule: "Tomorrow / 09:00 / reminder draft",
  },
];
function AutomationVisual() {
  const [index, setIndex] = useState(0);
  const item = workflows[index];
  return (
    <div className="automation-console">
      <div className="console-chrome">
        <CalendarDays size={16} />
        <span>drer / workflow preview</span>
        <span className="console-status">PLANNED</span>
      </div>
      <div
        className="automation-tabs"
        role="group"
        aria-label="Automation examples"
      >
        {workflows.map((x, i) => (
          <button
            key={x.label}
            aria-pressed={index === i}
            onClick={() => setIndex(i)}
          >
            {x.label}
          </button>
        ))}
      </div>
      <p className="console-request">“{item.request}”</p>
      <ol className="automation-steps">
        {item.steps.map((step, i) => (
          <li key={step}>
            <span>0{i + 1}</span>
            {step}
            <Check size={13} />
          </li>
        ))}
      </ol>
      <div className="automation-schedule">
        <Bell size={15} />
        {item.schedule}
      </div>
      <small>
        Concept only. No accounts are connected and no schedules are created.
      </small>
    </div>
  );
}
export function RouteVisual({ kind }: { kind: string }) {
  if (kind === "agent") return <AgentVisual />;
  if (kind === "automation") return <AutomationVisual />;
  if (kind === "build")
    return (
      <div className="route-feature-visual route-build">
        <BuildVisual />
      </div>
    );
  if (kind === "platforms")
    return (
      <div className="route-feature-visual">
        <PlatformVisual />
      </div>
    );
  if (kind === "desktop")
    return (
      <div className="desktop-console">
        <div className="console-chrome">
          <Monitor size={15} />
          <span>screen context / illustrative response</span>
          <span className="console-status">PROTOTYPE</span>
        </div>
        <div className="desktop-capture">
          <span className="capture-label">SHARED SCREEN</span>
          <Terminal size={30} />
          <code>Error: Cannot find module</code>
          <span>project / terminal</span>
        </div>
        <div className="desktop-insight">
          <DrerMark />
          <div>
            <h3>A useful starting point.</h3>
            <p>
              Ask about the error, a design, or the content on your screen. The
              prototype returns an explanation in a floating overlay.
            </p>
          </div>
        </div>
      </div>
    );
  if (kind === "kernel")
    return (
      <div className="kernel-route">
        <div className="console-chrome">
          <Layers3 size={15} />
          <span>AuraOS / architecture</span>
          <span className="console-status">RESEARCH</span>
        </div>
        <div className="kernel-route-layer">Interactive shell</div>
        <i />
        <div className="kernel-route-layer emphasized">
          <DrerMark /> AI core + system context
        </div>
        <i />
        <div className="kernel-route-base">
          <span>Memory</span>
          <span>Interrupts</span>
          <span>Drivers</span>
        </div>
        <p>Kernel context → serial proxy → Groq</p>
      </div>
    );
  if (kind === "roadmap")
    return (
      <div className="roadmap-console">
        <div className="console-chrome">
          <GitBranch size={16} />
          <span>drer / project stages</span>
        </div>
        {[
          { label: "Existing", title: "Screen-aware prototype", state: "now" },
          {
            label: "Planned",
            title: "Voice and connected tools",
            state: "next",
          },
          {
            label: "Planned",
            title: "Actions, routines, and building",
            state: "later",
          },
        ].map((x, i) => (
          <div className="roadmap-console-row" key={x.title}>
            <span>0{i + 1}</span>
            <div>
              <small>{x.label}</small>
              <p>{x.title}</p>
            </div>
            <i className={x.state} />
          </div>
        ))}
        <p className="page-small-note">
          Stages describe direction, not promised release dates.
        </p>
      </div>
    );
  return (
    <div className="project-orbit" aria-hidden="true">
      <div className="orbit-grid" />
      <div className="project-orbit-ring ring-a" />
      <div className="project-orbit-ring ring-b" />
      <div className="project-orbit-core">
        <DrerMark />
      </div>
      <span className="orbit-caption">OPEN SOURCE / OPEN POSSIBILITY</span>
      <span className="orbit-point point-a">VOICE</span>
      <span className="orbit-point point-b">CONTEXT</span>
      <span className="orbit-point point-c">ACTION</span>
    </div>
  );
}
