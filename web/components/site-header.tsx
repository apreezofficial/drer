"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  Search,
  X,
  Menu,
} from "lucide-react";
import { DrerMark } from "./brand";
import { productLinks, siteLinks } from "@/lib/site";
export default function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState<string | null>(null),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null),
    searchTrigger = useRef<HTMLButtonElement>(null),
    menuTrigger = useRef<HTMLButtonElement>(null);
  const productTrigger = useRef<HTMLButtonElement>(null),
    resourceTrigger = useRef<HTMLButtonElement>(null),
    quickTrigger = useRef<HTMLButtonElement>(null);
  const groupTriggers = useRef<Record<string, HTMLButtonElement | null>>({});
  function close() {
    setOpen(null);
    setMobile(false);
    setSearch(false);
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((v) => !v);
        setOpen(null);
        setMobile(false);
      }
      if (e.key === "Escape") {
        if (search) quickTrigger.current?.focus();
        else if (mobile) menuTrigger.current?.focus();
        else if (open === "Products") productTrigger.current?.focus();
        else if (open === "Start") quickTrigger.current?.focus();
        else if (open) groupTriggers.current[open]?.focus();
        close();
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, mobile, search]);
  useEffect(() => {
    document.body.style.overflow = mobile || search ? "hidden" : "";
    if (search) input.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobile, search]);
  const active = (href: string) => path === href;
  const primaryGroup: Record<string, string[]> = {
    Products: ["/products", "/desktop", "/auraos", "/build"],
    "Use cases": ["/automations", "/agent"],
    Developers: ["/docs", "/resources"],
    Project: ["/community"],
  };
  const developerLinks = siteLinks.filter((item) =>
    ["/docs", "/build", "/resources"].includes(item.href),
  );
  const useCaseLinks = siteLinks.filter((item) =>
    ["/automations", "/build", "/agent"].includes(item.href),
  );
  const projectLinks = siteLinks.filter((item) =>
    ["/community", "/roadmap", "/auraos"].includes(item.href),
  );
  const quickLinks = siteLinks.filter((item) =>
    ["/get-started", "/desktop", "/platforms", "/docs"].includes(item.href),
  );
  function group(
    title: string,
    href: string,
    links: typeof siteLinks,
    ref: React.RefObject<HTMLButtonElement | null>,
  ) {
    return (
      <div
        className="refnav-group"
        onMouseEnter={() => setOpen(title)}
        onMouseLeave={() => setOpen(null)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOpen(null);
        }}
      >
        <div
          className="refnav-group-label"
          data-active={primaryGroup[title]?.includes(path)}
        >
          <Link
            href={href}
            onClick={close}
            className={active(href) ? "active" : ""}
            aria-current={active(href) ? "page" : undefined}
          >
            {title}
          </Link>
          <button
            ref={(node) => {
              ref.current = node;
              groupTriggers.current[title] = node;
            }}
            aria-label={`Open ${title.toLowerCase()} menu`}
            aria-controls={`nav-${title}`}
            aria-expanded={open === title}
            onClick={() => setOpen(open === title ? null : title)}
          >
            <ChevronDown size={15} />
          </button>
        </div>
        {open === title && (
          <div className="refnav-panel" id={`nav-${title}`}>
            <div className="refnav-panel-inner">
              <div className="refnav-panel-intro">
                <span className="x-eyebrow">
                  {title === "Products"
                    ? "THE DRER ECOSYSTEM"
                    : title === "Use cases"
                      ? "EVERYDAY POSSIBILITIES"
                      : title === "Developers"
                        ? "BUILD WITH DRER"
                        : "THE OPEN-SOURCE PROJECT"}
                </span>
                <p>
                  {title === "Products"
                    ? "An assistant for the computer you already use."
                    : title === "Use cases"
                      ? "Plan your day. Build your idea. Make room for more."
                      : title === "Developers"
                        ? "Explore the source. Build the next useful piece."
                        : "A direction we can build together."}
                </p>
                <Link href={href} onClick={close}>
                  View overview <ArrowRight size={15} />
                </Link>
              </div>
              <div className="refnav-panel-links">
                {links.map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    aria-current={active(item.href) ? "page" : undefined}
                  >
                    <span className="refnav-item-number">0{i + 1}</span>
                    <span>
                      {item.title}
                      <small>{item.description}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  return (
    <>
      <header className="refnav">
        <div className="refnav-inner">
          <Link
            href="/"
            className="refnav-brand"
            aria-label="DRER home"
            onClick={close}
          >
            <DrerMark />
            <span>DRER</span>
          </Link>
          <nav className="refnav-desktop" aria-label="Main navigation">
            {group("Products", "/products", productLinks, productTrigger)}
            {group("Use cases", "/automations", useCaseLinks, resourceTrigger)}
            {group("Developers", "/docs", developerLinks, resourceTrigger)}
            {group("Project", "/community", projectLinks, resourceTrigger)}
            <Link
              href="/platforms"
              onClick={close}
              aria-current={active("/platforms") ? "page" : undefined}
            >
              Platforms
            </Link>
            <Link
              href="/roadmap"
              onClick={close}
              aria-current={active("/roadmap") ? "page" : undefined}
            >
              Roadmap
            </Link>
          </nav>
          <div className="refnav-actions">
            <Link
              href="/community"
              className="refnav-secondary"
              onClick={close}
            >
              Contribute
            </Link>
            <div
              className="refnav-split-wrap"
              onMouseLeave={() => {
                if (open === "Start") setOpen(null);
              }}
              onBlur={(e) => {
                if (
                  !e.currentTarget.contains(e.relatedTarget) &&
                  open === "Start"
                )
                  setOpen(null);
              }}
            >
              <div className="refnav-split">
                <Link href="/get-started" onClick={close}>
                  Get started
                </Link>
                <button
                  ref={quickTrigger}
                  aria-label="Open get started menu"
                  aria-expanded={open === "Start"}
                  aria-controls="nav-start"
                  onClick={() => setOpen(open === "Start" ? null : "Start")}
                >
                  <ChevronDown size={20} />
                </button>
              </div>
              {open === "Start" && (
                <div className="refnav-quick" id="nav-start">
                  <span>START EXPLORING DRER</span>
                  {quickLinks.map((item) => (
                    <Link key={item.href} href={item.href} onClick={close}>
                      {item.title}
                      <ArrowUpRight size={15} />
                    </Link>
                  ))}
                  <button
                    ref={searchTrigger}
                    onClick={() => {
                      close();
                      setQuery("");
                      setSearch(true);
                    }}
                  >
                    <Search size={15} />
                    Search all pages<kbd>⌘ K</kbd>
                  </button>
                </div>
              )}
            </div>
            <button
              ref={menuTrigger}
              className="refnav-mobile-toggle refnav-icon"
              aria-label={mobile ? "Close navigation" : "Open navigation"}
              aria-expanded={mobile}
              onClick={() => {
                setOpen(null);
                setMobile(!mobile);
              }}
            >
              {mobile ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <button
          className="refnav-scrim"
          aria-label="Close navigation dropdown"
          onClick={() => setOpen(null)}
        />
      )}
      {mobile && (
        <nav className="refnav-mobile" aria-label="Mobile navigation">
          <div className="refnav-mobile-main">
            {siteLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={active(item.href) ? "page" : undefined}
              >
                <span>{item.title}</span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
          <button
            className="mobile-search"
            onClick={() => {
              close();
              setQuery("");
              setSearch(true);
            }}
          >
            <Search size={17} />
            Search all pages
          </button>
          <p>
            Open source. In development.
            <br />
            Windows · macOS · Linux
          </p>
        </nav>
      )}
      {search && (
        <div
          className="xsearch-backdrop"
          onClick={() => {
            setSearch(false);
            quickTrigger.current?.focus();
          }}
        >
          <section
            className="xsearch-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search DRER pages"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Tab") {
                const elements =
                  e.currentTarget.querySelectorAll<HTMLElement>(
                    "input,button,a",
                  );
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
            <div className="xsearch-field">
              <Search size={20} />
              <input
                ref={input}
                aria-label="Search"
                placeholder="Search the DRER project"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="refnav-icon"
                aria-label="Close search"
                onClick={() => {
                  setSearch(false);
                  quickTrigger.current?.focus();
                }}
              >
                <X size={19} />
              </button>
            </div>
            <div className="xsearch-results">
              {siteLinks
                .filter((x) =>
                  `${x.title} ${x.description}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((x) => (
                  <Link href={x.href} key={x.href} onClick={close}>
                    <span>
                      {x.title}
                      <small>{x.description}</small>
                    </span>
                    <ArrowUpRight size={16} />
                  </Link>
                ))}
              {!siteLinks.some((x) =>
                `${x.title} ${x.description}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              ) && (
                <p>No pages match. Try “calendar”, “build”, or “Windows”.</p>
              )}
            </div>
            <div className="xsearch-hint">
              Search pages and guides <kbd>Esc</kbd> to close
            </div>
          </section>
        </div>
      )}
    </>
  );
}
