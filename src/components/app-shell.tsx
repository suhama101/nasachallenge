"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  ClipboardPlus,
  History,
  ChartNoAxesCombined,
  BookOpen,
  Bot,
  UserRound,
  Menu,
  X,
  Orbit,
  FlaskConical,
  ChevronRight,
} from "lucide-react";
import { mission } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { useHealth } from "@/components/health-provider";
import { displayDate } from "@/lib/health/dates";
const navigation = [
  { href: "/", label: "Mission Overview", icon: LayoutDashboard },
  {
    href: "/daily-health-check",
    label: "Daily Health Check",
    icon: ClipboardPlus,
  },
  { href: "/health-history", label: "Health History", icon: History },
  {
    href: "/health-insights",
    label: "Health Insights",
    icon: ChartNoAxesCombined,
  },
  {
    href: "/space-health-knowledge",
    label: "Space Health Knowledge",
    icon: BookOpen,
  },
  { href: "/ai-health-assistant", label: "AI Health Assistant", icon: Bot },
  { href: "/crew-profile", label: "Crew Profile", icon: UserRound },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { today } = useHealth();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebar.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
      if (event.key === "Tab") {
        const items =
          sidebar.current?.querySelectorAll<HTMLElement>("a,button");
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", handle);
    };
  }, [open]);
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={() => {
            setOpen(false);
            menuButton.current?.focus();
          }}
          aria-hidden="true"
        />
      )}
      <aside
        ref={sidebar}
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label="Application navigation"
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
      >
        <Link className="brand" href="/" onClick={() => setOpen(false)}>
          <span className="brand-symbol">
            <Activity size={25} />
          </span>
          <span>
            Mission<span className="text-cyan-300">Pulse</span>
            <small>HUMAN HEALTH. BEYOND EARTH.</small>
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="close-menu"
          aria-label="Close navigation"
          onClick={() => {
            setOpen(false);
            menuButton.current?.focus();
          }}
        >
          <X size={20} />
        </Button>
        <div className="mission-switch">
          <span className="station-icon">
            <Orbit size={21} />
          </span>
          <div>
            <strong>ASTERIA / EXP. 07</strong>
            <span>Low Earth orbit</span>
          </div>
          <span className="status-dot" />
        </div>
        <p className="nav-caption">WORKSPACE</p>
        <nav>
          <ul>
            {navigation.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  className={`nav-link ${pathname === href ? "active" : ""}`}
                  href={href}
                  aria-current={pathname === href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {pathname === href && <span className="active-dot" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-note">
            <FlaskConical size={18} />
            <strong>A space for exploration</strong>
            <p>
              Fictional crew. Synthetic and user-entered demo data stored in
              this browser.
            </p>
            <span>
              PHASE 02 <span>•</span> LOCAL DEMO
            </span>
          </div>
          <Link
            className="crew-link"
            href="/crew-profile"
            onClick={() => setOpen(false)}
          >
            <span className="avatar">{mission.initials}</span>
            <span>
              <strong>{mission.astronaut}</strong>
              <small>{mission.role}</small>
            </span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="breadcrumb">
            <Button
              ref={menuButton}
              variant="ghost"
              size="icon"
              className="mobile-menu"
              aria-label="Open navigation"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </Button>
            <span className="breadcrumb-label">Workspace</span>
            <ChevronRight size={13} />
            <span>
              {navigation.find((n) => n.href === pathname)?.label ??
                "MissionPulse"}
            </span>
          </div>
          <div className="header-right">
            <span className="demo-badge">
              <span />
              Local demo
            </span>
            <span className="header-date">
              {today ? displayDate(today) : "Mission calendar · UTC"}
            </span>
            <Link
              href="/crew-profile"
              className="avatar small"
              aria-label="View crew profile"
            >
              {mission.initials}
            </Link>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer>
          <span>
            <Activity size={14} /> MissionPulse{" "}
            <span className="footer-divider">/</span> Research demonstration
          </span>
          <p>
            Not a certified medical diagnostic system. No clinical assessment is
            provided.
          </p>
        </footer>
      </div>
    </>
  );
}
