"use client";

import { useCallback, useSyncExternalStore } from "react";

// A local (per-browser) list of wallets to follow. No contract/account needed —
// "you minted for 0xAB, now keep an eye on it".
const KEY = "soulprint:watch";
const EVENT = "soulprint:watch-changed";

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
    window.dispatchEvent(new Event(EVENT)); // notify this tab's subscribers
  } catch {
    /* private mode / quota — ignore */
  }
}

// useSyncExternalStore is the SSR-safe way to read client-only state (localStorage) without
// a synchronous setState-in-effect. getServerSnapshot returns []; React re-syncs to the real
// list after hydration with no mismatch warning. The snapshot is cached on the raw JSON so the
// reference stays stable across renders (a fresh [] each call would loop the store).
const EMPTY: `0x${string}`[] = [];
let cacheRaw = "";
let cache: `0x${string}`[] = EMPTY;

function getSnapshot(): `0x${string}`[] {
  const raw = localStorage.getItem(KEY) ?? "[]";
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = read();
  }
  return cache;
}

function getServerSnapshot(): `0x${string}`[] {
  return EMPTY;
}

function subscribe(onChange: () => void) {
  const handler = (e: Event) => {
    if (e instanceof StorageEvent && e.key !== KEY) return; // ignore unrelated keys
    onChange();
  };
  window.addEventListener("storage", handler); // other tabs
  window.addEventListener(EVENT, handler); // this tab (storage doesn't fire for the writer)
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(EVENT, handler);
  };
}

export function useWatchlist() {
  const list = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const add = useCallback((addr: `0x${string}`) => {
    write(Array.from(new Set([addr, ...read()])));
  }, []);

  const remove = useCallback((addr: `0x${string}`) => {
    write(read().filter((a) => a.toLowerCase() !== addr.toLowerCase()));
  }, []);

  const has = useCallback(
    (addr?: string) => !!addr && list.some((a) => a.toLowerCase() === addr.toLowerCase()),
    [list]
  );

  return { list, add, remove, has };
}
