"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/dashboard";

/** Renders a relative time ("4m ago") only after mount, so SSR and the first
 *  client render match (both empty) — avoids Date.now() hydration mismatches. */
export function TimeAgo({ unix }: { unix: number }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(relativeTime(unix));
  }, [unix]);
  return <>{label || "·"}</>;
}
