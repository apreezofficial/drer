import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileCode2,
  Terminal,
  ShieldCheck,
} from "lucide-react";
import type { PageData } from "@/lib/page-data";
import { repository, prototypeSource } from "@/lib/site";
import { RouteVisual, SetupGuide } from "./page-interactions";

function Docs() {
  return (
    <div className="docs-layout">
      <aside className="docs-rail" aria-label="Documentation contents">
        <span className="x-eyebrow">ON THIS PAGE</span>
        {[
          ["Overview", "overview"],
          ["Requirements", "requirements"],
          ["Setup", "setup"],
          ["Packaging", "packaging"],
          ["Data flow", "data-flow"],
          ["Troubleshooting", "troubleshooting"],
        ].map(([title, id]) => (
          <a href={`#${id}`} key={id}>
            {title}
            <ArrowRight size={12} />
          </a>
        ))}
        <a href={prototypeSource}>
          Source README <ArrowUpRight size={12} />
        </a>
      </aside>
      <div className="docs-content">
        <section id="overview">
          <span className="x-eyebrow">START HERE</span>
          <h2>A prototype, with a bigger direction.</h2>
          <p>
            The existing desktop app is named AuraAI and lives at{" "}
            <code>aura-os/electron</code>. It provides screen capture and a
            Groq-powered response overlay. DRER is the direction for a broader
            assistant with voice, connected tools, and actions.
          </p>
        </section>
        <section id="requirements">
          <h2>What you need.</h2>
          <ul>
            <li>A desktop development environment with Node.js and npm.</li>
            <li>
              The repository source and a Groq API key for image analysis.
            </li>
            <li>
              The ability to grant the desktop permissions requested by your
              operating system.
            </li>
          </ul>
          <p>
            The project declares Electron 29.1.4. Build targets exist for
            Windows, macOS, and Linux; target-platform testing and packaging
            remain development work.
          </p>
        </section>
        <SetupGuide />
        <section id="data-flow">
          <h2>How a request moves.</h2>
          <div className="docs-flow">
            {[
              "Invoke the desktop overlay",
              "Capture the shared screen",
              "Send it to Groq with your key",
              "Render the response in the overlay",
            ].map((x, i) => (
              <div key={x}>
                <span>0{i + 1}</span>
                {x}
              </div>
            ))}
          </div>
          <p>
            This is cloud inference. The screenshot leaves your device for
            analysis when you invoke the prototype. Voice listening, calendars,
            reminders, and computer-control actions are planned capabilities.
          </p>
        </section>
        <section id="troubleshooting">
          <h2>Make an issue reproducible.</h2>
          <p>
            Record your operating system and version, the exact command you ran,
            and the error you observed. Useful areas to check include
            screen-capture permissions, global shortcuts, tray behavior, API
            configuration, and packaging assets.
          </p>
          <a className="page-inline-link" href={`${repository}/issues`}>
            Open the issue tracker <ArrowUpRight size={14} />
          </a>
        </section>
      </div>
    </div>
  );
}
export default function DetailPage({
  slug,
  page,
}: {
  slug: string;
  page: PageData;
}) {
  const centered = [
    "products",
    "resources",
    "community",
    "docs",
    "get-started",
  ].includes(slug);
  return (
    <main id="main" className={`detail-page detail-${slug}`}>
      <div className="page-frame">
        <div className="page-breadcrumb">
          <Link href="/">DRER</Link>
          <span>/</span>
          <span>{page.eyebrow}</span>
        </div>
        <section className={`page-hero ${centered ? "page-hero-wide" : ""}`}>
          <div className="page-hero-copy">
            <span className="x-eyebrow">
              <span className="page-status-dot" />
              {page.eyebrow}
            </span>
            <h1>
              {page.title.split("\n").map((line, i) => (
                <span key={line}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </h1>
            <p>{page.description}</p>
            <div className="page-hero-actions">
              <a href={page.primary.href} className="page-primary">
                {page.primary.title}
                <ArrowUpRight size={16} />
              </a>
              {slug !== "roadmap" && (
                <Link href="/roadmap" className="page-secondary">
                  Project status <ArrowRight size={15} />
                </Link>
              )}
            </div>
            <span className="page-status">
              <span />
              {page.status}
            </span>
          </div>
          {!centered && (
            <div className="page-hero-art">
              <RouteVisual kind={page.visual} />
            </div>
          )}
          {centered && slug !== "docs" && slug !== "get-started" && (
            <span className="page-hero-index" aria-hidden="true">
              DRER / {slug.toUpperCase()}
            </span>
          )}
        </section>
        {slug === "get-started" && <SetupGuide compact />}
        {slug === "docs" && <Docs />}
        <section className="page-section">
          <div className="page-section-heading">
            <span className="x-eyebrow">
              {slug === "roadmap"
                ? "PROJECT STAGES"
                : slug === "resources"
                  ? "FIND YOUR WAY"
                  : "TAKE A CLOSER LOOK"}
            </span>
            <h2>{page.sectionTitle}</h2>
            <p>{page.sectionDescription}</p>
          </div>
          <div
            className={`page-card-grid ${page.cards.length === 4 ? "page-card-grid-four" : ""}`}
          >
            {page.cards.map((card, i) => {
              const body = (
                <>
                  <span className="page-card-index">
                    {card.label || `0${i + 1}`}
                    {card.href && <ArrowUpRight size={16} />}
                  </span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  {card.href && (
                    <span className="page-card-action">
                      Explore <ArrowRight size={13} />
                    </span>
                  )}
                </>
              );
              return card.href ? (
                <a className="page-card" href={card.href} key={card.title}>
                  {body}
                </a>
              ) : (
                <article className="page-card" key={card.title}>
                  {body}
                </article>
              );
            })}
          </div>
        </section>
        {slug === "community" && (
          <section className="contribution-strip">
            <div>
              <FileCode2 />
              <h2>
                A focused contribution
                <br />
                is a good contribution.
              </h2>
            </div>
            <ol>
              <li>
                <span>01</span>Read the relevant source and reproduce the
                behavior.
              </li>
              <li>
                <span>02</span>Keep the change small enough to review clearly.
              </li>
              <li>
                <span>03</span>Explain what changed and how you checked it.
              </li>
            </ol>
          </section>
        )}
        {slug === "desktop" && (
          <section className="page-source-band">
            <Terminal />
            <div>
              <span className="x-eyebrow">WHERE THE CODE LIVES</span>
              <h2>aura-os/electron</h2>
              <p>
                The source keeps its original AuraAI name. Start here to explore
                the existing desktop implementation.
              </p>
            </div>
            <Link href="/docs">
              Read the setup guide <ArrowRight size={15} />
            </Link>
          </section>
        )}
        <section className="page-closing">
          <div>
            <span className="x-eyebrow">
              <ShieldCheck size={13} /> THE NEXT USEFUL STEP
            </span>
            <h2>{page.closing}</h2>
            <p>{page.closingText}</p>
          </div>
          <Link
            href={
              slug === "community"
                ? "/docs"
                : slug === "get-started"
                  ? "/community"
                  : "/get-started"
            }
            className="page-primary"
          >
            {slug === "community"
              ? "Read the docs"
              : slug === "get-started"
                ? "Join the project"
                : "Get started"}
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
    </main>
  );
}
