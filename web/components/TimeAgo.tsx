"use client";

import { useSyncExternalStore } from "react";
import { relativeTime } from "@/lib/dashboard";

// Never changes — TimeAgo only needs the server-vs-client distinction, not live updates.
const subscribe = () => () => {};

/** Renders a relative time ("4m ago") only after hydration, so SSR and the first client
 *  render match (both "·") — avoids Date.now() hydration mismatches. Uses useSyncExternalStore
 *  (getServerSnapshot → true) instead of a setState-in-effect mount flag, which the
 *  react-hooks lint rule forbids. */
export function TimeAgo({ unix }: { unix: number }) {
  const isServer = useSyncExternalStore(
    subscribe,
    () => false, // client snapshot
    () => true // server snapshot
  );
  return <>{isServer ? "·" : relativeTime(unix)}</>;
}
