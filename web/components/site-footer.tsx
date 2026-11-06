import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";
import { repository } from "@/lib/site";
import { DrerMark } from "./brand";
export default function SiteFooter() {
  return (
    <footer className="xfooter">
      <div className="xfooter-main">
        <div className="xfooter-brand">
          <Link href="/" aria-label="DRER home">
            <DrerMark />
            <span>DRER</span>
          </Link>
          <p>
            A little less by hand.
            <br />A little more possibility.
          </p>
          <span>Open source · In development</span>
        </div>
        {[
          {
            title: "Product",
            links: [
              ["The agent", "/agent"],
              ["Desktop", "/desktop"],
              ["Automations", "/automations"],
              ["Build", "/build"],
              ["Platforms", "/platforms"],
            ],
          },
          {
            title: "Project",
            links: [
              ["AuraOS", "/auraos"],
              ["Roadmap", "/roadmap"],
              ["Community", "/community"],
              ["Source code", repository],
            ],
          },
          {
            title: "Resources",
            links: [
              ["Overview", "/resources"],
              ["Documentation", "/docs"],
              ["Get started", "/get-started"],
              ["Report an issue", `${repository}/issues`],
            ],
          },
        ].map((col) => (
          <div className="xfooter-column" key={col.title}>
            <h2>{col.title}</h2>
            {col.links.map(([title, href]) =>
              href.startsWith("/") ? (
                <Link key={title} href={href}>
                  {title}
                </Link>
              ) : (
                <a key={title} href={href}>
                  {title}
                  <ArrowUpRight size={12} />
                </a>
              ),
            )}
          </div>
        ))}
      </div>
      <div className="xfooter-bottom">
        <span>
          Created by{" "}
          <a href="https://preciousadedokun.com.ng">Precious Adedokun</a>
        </span>
        <span>Windows · macOS · Linux</span>
        <a href={repository} aria-label="DRER on GitHub">
          <Github size={16} />
          <span>Built in the open</span>
        </a>
      </div>
    </footer>
  );
}
