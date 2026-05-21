"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const tabs = [
  { href: "/", label: "Mint" },
  { href: "/dashboard", label: "Dashboard" },
];

export function TopNav({
  connected,
  onConnect,
}: {
  connected: string | null;
  onConnect: () => void;
}) {
  const path = usePathname();

  return (
    <div className="relative z-10 mb-10 flex items-center justify-between gap-4">
      <div className="flex items-center gap-5">
        <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Soulprint
        </span>
        <nav className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {tabs.map((t) => {
            const active = path === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={
                  "rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition " +
                  (active
                    ? "bg-white/90 text-black"
                    : "text-foreground/60 hover:text-foreground")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={onConnect}
        className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 font-mono text-xs text-foreground/80 transition hover:border-white/30 hover:text-foreground"
      >
        {connected ? short(connected) : "Connect Wallet"}
      </button>
    </div>
  );
}
