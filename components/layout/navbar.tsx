"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  ["About", "#about"],
  ["Contact Us", "#contact"],
  ["Jobs", "#jobs"],
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<(typeof links)[number][1]>("#jobs");

  useEffect(() => {
    const sectionIds = links.map(([, href]) => href.slice(1));

    const updateActiveFromViewport = () => {
      const y = window.scrollY + 160;
      let current: (typeof links)[number][1] = "#jobs";

      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (!section) continue;
        if (section.offsetTop <= y) {
          current = `#${id}` as (typeof links)[number][1];
        }
      }

      setActiveHref(current);
    };

    const updateFromHash = () => {
      const hash = window.location.hash as (typeof links)[number][1];
      if (links.some(([, href]) => href === hash)) {
        setActiveHref(hash);
        return;
      }
      updateActiveFromViewport();
    };

    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);
    window.addEventListener("scroll", updateActiveFromViewport, { passive: true });

    return () => {
      window.removeEventListener("hashchange", updateFromHash);
      window.removeEventListener("scroll", updateActiveFromViewport);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 py-3">
      <nav className="container shell h-16 px-6 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg tracking-tight flex items-center gap-2">
          <Image src="/localsm-logo.svg" alt="LocalSM logo" width={28} height={28} />
          <span>LocalSM</span>
        </Link>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          <Menu size={20} />
        </button>

        <div className="hidden md:flex gap-8 items-center">
          {links.map(([name, href]) => {
            const isActive = activeHref === href;
            return (
              <Link
                key={name}
                href={href}
                onClick={() => setActiveHref(href)}
                className={`text-sm transition-colors ${isActive ? "font-semibold text-zinc-900" : "hover:text-zinc-600"}`}
              >
                <span className="relative inline-flex items-center">
                  {name}
                  {isActive && <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" />}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {open && (
        <div className="container md:hidden mt-2 shell p-4 flex flex-col gap-2">
          {links.map(([name, href]) => (
            <Link key={name} href={href} onClick={() => setOpen(false)}>
              {name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
