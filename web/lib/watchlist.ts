"use client";

import { useCallback, useEffect, useState } from "react";

// A local (per-browser) list of wallets to follow. No contract/account needed —
// "you minted for 0xAB, now keep an eye on it".
const KEY = "soulprint:watch";

function read(): `0x${string}`[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function write(list: `0x${string}`[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private mode / quota — ignore */
  }
}

export function useWatchlist() {
  const [list, setList] = useState<`0x${string}`[]>([]);

  // Load after mount (avoids SSR/client mismatch) and react to other tabs.
  useEffect(() => {
    setList(read());
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setList(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((addr: `0x${string}`) => {
    const next = Array.from(new Set([addr, ...read()]));
    write(next);
    setList(next);
  }, []);

  const remove = useCallback((addr: `0x${string}`) => {
    const next = read().filter((a) => a.toLowerCase() !== addr.toLowerCase());
    write(next);
    setList(next);
  }, []);

  const has = useCallback(
    (addr?: string) => !!addr && list.some((a) => a.toLowerCase() === addr.toLowerCase()),
    [list]
  );

  return { list, add, remove, has };
}
