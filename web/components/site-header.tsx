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
  Github,
} from "lucide-react";
import { DrerMark } from "./brand";
import { productLinks, resourceLinks, siteLinks, repository } from "@/lib/site";
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
    resourceTrigger = useRef<HTMLButtonElement>(null);
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
        if (search) searchTrigger.current?.focus();
        else if (mobile) menuTrigger.current?.focus();
        else if (open === "Products") productTrigger.current?.focus();
        else if (open === "Resources") resourceTrigger.current?.focus();
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
  function group(
    title: string,
    href: string,
    links: typeof siteLinks,
    ref: React.RefObject<HTMLButtonElement | null>,
  ) {
    return (
      <div
        className="xnav-group"
        onMouseEnter={() => setOpen(title)}
        onMouseLeave={() => setOpen(null)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOpen(null);
        }}
      >
        <div
          className="xnav-group-label"
          data-active={active(href) || links.some((item) => active(item.href))}
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
            ref={ref}
            aria-label={`Open ${title.toLowerCase()} menu`}
            aria-controls={`nav-${title}`}
            aria-expanded={open === title}
            onClick={() => setOpen(open === title ? null : title)}
          >
            <ChevronDown size={12} />
          </button>
        </div>
        {open === title && (
          <div className="xnav-panel" id={`nav-${title}`}>
            <div className="xnav-panel-inner">
              <div className="xnav-panel-intro">
                <span className="x-eyebrow">
                  {title === "Products"
                    ? "THE DRER ECOSYSTEM"
                    : "EXPLORE THE PROJECT"}
                </span>
                <p>
                  {title === "Products"
                    ? "More ways to put your computer to work."
                    : "Understand it. Build it. Help shape it."}
                </p>
                <Link href={href} onClick={close}>
                  View overview <ArrowRight size={15} />
                </Link>
              </div>
              <div className="xnav-panel-links">
                {links.map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    aria-current={active(item.href) ? "page" : undefined}
                  >
                    <span className="xnav-item-number">0{i + 1}</span>
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
      <header className="xnav">
        <div className="xnav-inner">
          <Link
            href="/"
            className="xnav-brand"
            aria-label="DRER home"
            onClick={close}
          >
            <DrerMark />
            <span>DRER</span>
          </Link>
          <nav className="xnav-desktop" aria-label="Main navigation">
            <Link
              href="/agent"
              onClick={close}
              aria-current={active("/agent") ? "page" : undefined}
            >
              Agent
            </Link>
            {group("Products", "/products", productLinks, productTrigger)}
            <Link
              href="/platforms"
              onClick={close}
              aria-current={active("/platforms") ? "page" : undefined}
            >
              Platforms
            </Link>
            <Link
              href="/community"
              onClick={close}
              aria-current={active("/community") ? "page" : undefined}
            >
              Community
            </Link>
            {group("Resources", "/resources", resourceLinks, resourceTrigger)}
          </nav>
          <div className="xnav-actions">
            <button
              ref={searchTrigger}
              className="xnav-icon"
              aria-label="Search pages"
              onClick={() => {
                close();
                setQuery("");
                setSearch(true);
              }}
            >
              <Search size={18} />
            </button>
            <a
              href={repository}
              className="xnav-github"
              aria-label="DRER source on GitHub"
            >
              <Github size={18} />
            </a>
            <Link href="/get-started" className="xnav-cta" onClick={close}>
              Get started <ArrowUpRight size={14} />
            </Link>
            <button
              ref={menuTrigger}
              className="xnav-mobile-toggle xnav-icon"
              aria-label={mobile ? "Close navigation" : "Open navigation"}
              aria-expanded={mobile}
              onClick={() => {
                setOpen(null);
                setMobile(!mobile);
              }}
            >
              {mobile ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
      </header>
      {open && (
        <button
          className="xnav-scrim"
          aria-label="Close navigation dropdown"
          onClick={() => setOpen(null)}
        />
      )}
      {mobile && (
        <nav className="xnav-mobile" aria-label="Mobile navigation">
          <div className="xnav-mobile-main">
            {siteLinks.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                onClick={close}
                aria-current={active(item.href) ? "page" : undefined}
              >
                <span>{item.title}</span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
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
            searchTrigger.current?.focus();
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
                className="xnav-icon"
                aria-label="Close search"
                onClick={() => {
                  setSearch(false);
                  searchTrigger.current?.focus();
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
