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

/* Header proportions taken from the supplied x.ai screenshot.
   Breakpoints: 1800 / 1450 / 1250 / 1100 / 600 (same as the old navigation.css). */
const underline = "underline underline-offset-[6px] decoration-1";
const navLink =
  "flex h-full items-center transition-colors duration-[180ms] hover:text-muted aria-[current=page]:underline aria-[current=page]:underline-offset-[6px] aria-[current=page]:decoration-1";
const iconButton =
  "h-[38px] w-[34px] place-items-center rounded-md border-0 bg-transparent text-inherit";
const pillSize =
  "text-[18px] min-[1800px]:text-[21px] max-[1450px]:text-[17px] max-[1250px]:text-[15px] max-[1100px]:text-[16px]";

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
        className="flex h-full items-center"
        onMouseEnter={() => setOpen(title)}
        onMouseLeave={() => setOpen(null)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOpen(null);
        }}
      >
        <div
          className="flex h-full items-center gap-1.5 max-[1250px]:gap-[3px]"
          data-active={primaryGroup[title]?.includes(path)}
        >
          <Link
            href={href}
            onClick={close}
            className={`${navLink} ${primaryGroup[title]?.includes(path) ? underline : ""}`}
            aria-current={active(href) ? "page" : undefined}
          >
            {title}
          </Link>
          <button
            ref={(node) => {
              ref.current = node;
              groupTriggers.current[title] = node;
            }}
            className="grid h-[42px] w-[19px] place-items-center border-0 bg-transparent p-0 text-inherit max-[1250px]:w-[15px]"
            aria-label={`Open ${title.toLowerCase()} menu`}
            aria-controls={`nav-${title}`}
            aria-expanded={open === title}
            onClick={() => setOpen(open === title ? null : title)}
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 motion-reduce:transition-none ${open === title ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        {open === title && (
          <div
            className="absolute inset-x-0 top-full animate-nav-in border-y border-line bg-panel whitespace-normal text-text shadow-[0_25px_40px_#0009] motion-reduce:animate-none max-[1100px]:hidden"
            id={`nav-${title}`}
          >
            <div className="mx-auto grid w-[calc(100%-112px)] max-w-[1600px] grid-cols-[1fr_2fr] gap-20 pt-11 pb-[50px] max-[1250px]:w-[calc(100%-64px)] max-[1250px]:gap-10">
              <div>
                <span className="x-eyebrow text-[10px] text-muted">
                  {title === "Products"
                    ? "THE DRER ECOSYSTEM"
                    : title === "Use cases"
                      ? "EVERYDAY POSSIBILITIES"
                      : title === "Developers"
                        ? "BUILD WITH DRER"
                        : "THE OPEN-SOURCE PROJECT"}
                </span>
                <p className="mt-5 max-w-[340px] text-[31px] leading-[1.12] tracking-[-1px] text-text max-[1250px]:text-[27px]">
                  {title === "Products"
                    ? "An assistant for the computer you already use."
                    : title === "Use cases"
                      ? "Plan your day. Build your idea. Make room for more."
                      : title === "Developers"
                        ? "Explore the source. Build the next useful piece."
                        : "A direction we can build together."}
                </p>
                <Link
                  href={href}
                  onClick={close}
                  className="mt-[25px] flex items-center gap-[17px] text-[14px] text-muted hover:text-text"
                >
                  View overview <ArrowRight size={15} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-x-[26px] gap-y-[9px]">
                {links.map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    aria-current={active(item.href) ? "page" : undefined}
                    className="flex min-w-0 items-start gap-[13px] rounded-xl px-[18px] py-5 text-[19px] text-text transition-colors duration-200 hover:bg-line aria-[current=page]:bg-line max-[1250px]:px-[13px] max-[1250px]:py-4 max-[1250px]:text-[17px]"
                  >
                    <span className="pt-1.5 font-display text-[9px] text-muted">
                      0{i + 1}
                    </span>
                    <span className="flex-1">
                      {item.title}
                      <small className="mt-2 block max-w-[300px] text-[14px] leading-normal whitespace-normal text-muted max-[1250px]:text-[13px]">
                        {item.description}
                      </small>
                    </span>
                    <ArrowUpRight size={16} className="mt-[5px] text-muted" />
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
      <header className="sticky top-0 isolate z-80 border-0 bg-panel font-body text-text">
        <div className="mx-auto flex h-20 w-[calc(100%-112px)] max-w-[1928px] items-center gap-[clamp(40px,4vw,82px)] min-[1800px]:pr-[4vw] max-[1450px]:w-[calc(100%-80px)] max-[1450px]:gap-10 max-[1250px]:w-[calc(100%-64px)] max-[1250px]:gap-[30px] max-[1100px]:h-[78px] max-[1100px]:w-[calc(100%-48px)] max-[600px]:h-[72px] max-[600px]:w-[calc(100%-36px)] max-[600px]:gap-3">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-display text-[24px] font-bold tracking-[-1px] text-text max-[1450px]:text-[22px] max-[1100px]:text-[24px] max-[600px]:gap-[7px] max-[600px]:text-[21px]"
            aria-label="DRER home"
            onClick={close}
          >
            <DrerMark className="h-[33px] w-[33px] max-[1450px]:w-[29px] max-[1100px]:w-[30px] max-[600px]:h-[27px] max-[600px]:w-[27px]" />
            <span>DRER</span>
          </Link>
          <nav
            className="flex h-full items-center gap-[clamp(22px,2.2vw,46px)] text-[18px] leading-[1.3] whitespace-nowrap text-text min-[1800px]:text-[21px] max-[1450px]:gap-6 max-[1450px]:text-[17px] max-[1250px]:gap-[18px] max-[1250px]:text-[15px] max-[1100px]:hidden"
            aria-label="Main navigation"
          >
            {group("Products", "/products", productLinks, productTrigger)}
            {group("Use cases", "/automations", useCaseLinks, resourceTrigger)}
            {group("Developers", "/docs", developerLinks, resourceTrigger)}
            {group("Project", "/community", projectLinks, resourceTrigger)}
            <Link
              href="/platforms"
              onClick={close}
              className={navLink}
              aria-current={active("/platforms") ? "page" : undefined}
            >
              Platforms
            </Link>
            <Link
              href="/roadmap"
              onClick={close}
              className={navLink}
              aria-current={active("/roadmap") ? "page" : undefined}
            >
              Roadmap
            </Link>
          </nav>
          <div className="ml-auto flex shrink-0 items-center gap-3 max-[1250px]:gap-[9px] max-[600px]:gap-[5px]">
            <Link
              href="/community"
              className={`flex min-h-[54px] items-center justify-center rounded-full bg-line px-[26px] whitespace-nowrap text-text transition-colors duration-200 min-[1800px]:min-h-[58px] min-[1800px]:px-7 max-[1450px]:min-h-[50px] max-[1450px]:px-[22px] max-[1250px]:min-h-[46px] max-[1250px]:px-[18px] max-[600px]:hidden ${pillSize}`}
              onClick={close}
            >
              Contribute
            </Link>
            <div
              className="relative"
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
              <div className="flex min-h-[54px] items-center overflow-hidden rounded-full border border-accent bg-accent text-black min-[1800px]:min-h-[58px] max-[1450px]:min-h-[50px] max-[1250px]:min-h-[46px] max-[600px]:min-h-[42px]">
                <Link
                  href="/get-started"
                  onClick={close}
                  className={`flex min-h-[52px] items-center justify-center px-[25px] whitespace-nowrap transition-colors duration-200 hover:bg-panel hover:text-text min-[1800px]:min-h-14 max-[1450px]:min-h-12 max-[1450px]:px-[22px] max-[1250px]:min-h-11 max-[1250px]:px-[18px] max-[600px]:min-h-10 max-[600px]:px-[17px] max-[600px]:text-[14px] ${pillSize}`}
                >
                  Get started
                </Link>
                <button
                  ref={quickTrigger}
                  className="grid min-w-[49px] self-stretch place-items-center border-0 border-l border-line bg-transparent text-black transition-colors duration-200 hover:bg-panel hover:text-text min-[1800px]:min-w-[54px] max-[1450px]:min-w-11 max-[1250px]:min-w-[39px] max-[600px]:min-w-[35px]"
                  aria-label="Open get started menu"
                  aria-expanded={open === "Start"}
                  aria-controls="nav-start"
                  onClick={() => setOpen(open === "Start" ? null : "Start")}
                >
                  <ChevronDown
                    size={20}
                    className={`transition-transform duration-200 motion-reduce:transition-none max-[600px]:w-4 ${open === "Start" ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
              {open === "Start" && (
                <div
                  className="absolute top-[calc(100%+9px)] right-0 min-w-[315px] animate-[nav-in_0.15s_ease-out] rounded-[17px] border border-line bg-panel px-2.5 pt-[18px] pb-2.5 text-text shadow-[0_18px_40px_#0009] motion-reduce:animate-none max-[1100px]:top-[calc(100%+10px)] max-[600px]:fixed max-[600px]:top-[79px] max-[600px]:right-[15px] max-[600px]:left-[15px] max-[600px]:ml-auto max-[600px]:min-w-0 max-[600px]:max-w-[380px]"
                  id="nav-start"
                >
                  <span className="block px-[13px] pb-3 font-display text-[9px] tracking-[1px] text-muted">
                    START EXPLORING DRER
                  </span>
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className="flex items-center justify-between gap-[18px] rounded-lg p-[13px] text-[15px] hover:bg-line"
                    >
                      {item.title}
                      <ArrowUpRight size={15} />
                    </Link>
                  ))}
                  <button
                    ref={searchTrigger}
                    className="mt-2 flex w-full items-center gap-2 border-0 border-t border-line bg-transparent px-[13px] pt-[14px] pb-2 text-left font-body text-[13px] text-muted hover:text-text"
                    onClick={() => {
                      close();
                      setQuery("");
                      setSearch(true);
                    }}
                  >
                    <Search size={15} />
                    Search all pages
                    <kbd className="ml-auto text-[10px] text-muted">⌘ K</kbd>
                  </button>
                </div>
              )}
            </div>
            <button
              ref={menuTrigger}
              className={`${iconButton} ml-[7px] hidden max-[1100px]:grid max-[600px]:ml-0.5 max-[600px]:w-7`}
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
          className="fixed inset-x-0 top-20 bottom-0 z-[79] border-0 bg-[#0006] backdrop-blur-[5px] max-[1100px]:top-[78px] max-[600px]:top-[72px]"
          aria-label="Close navigation dropdown"
          onClick={() => setOpen(null)}
        />
      )}
      {mobile && (
        <nav
          className="fixed inset-x-0 top-[78px] bottom-0 z-[79] hidden overflow-y-auto bg-panel px-7 pt-[15px] pb-10 font-body text-text max-[1100px]:block max-[600px]:top-[72px] max-[600px]:px-[23px] max-[600px]:pt-3 max-[600px]:pb-[35px]"
          aria-label="Mobile navigation"
        >
          <div className="grid grid-cols-2 gap-x-[35px] max-[600px]:grid-cols-1">
            {siteLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={active(item.href) ? "page" : undefined}
                className="flex items-center justify-between gap-[15px] border-b border-line py-[22px] text-[23px] aria-[current=page]:text-accent max-[600px]:py-[18px] max-[600px]:text-[22px]"
              >
                <span>{item.title}</span>
                <ArrowUpRight size={17} className="text-muted" />
              </Link>
            ))}
          </div>
          <button
            className="mt-7 flex items-center gap-2.5 rounded-full border-0 bg-line px-5 py-[13px] font-body text-[15px] text-text"
            onClick={() => {
              close();
              setQuery("");
              setSearch(true);
            }}
          >
            <Search size={17} />
            Search all pages
          </button>
          <p className="mt-[30px] text-[11px] leading-[1.8] text-muted">
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
                className={`${iconButton} grid`}
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
