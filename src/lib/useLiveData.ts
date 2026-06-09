"use client";

import { useEffect, useRef, useState } from "react";

export type LiveStatus = "loading" | "live" | "error";

export type LiveQuery<T> = {
  data: T | undefined;
  status: LiveStatus;
  updatedAt: number;
  /** force an immediate re-fetch (e.g. right after a scan) */
  refresh: () => void;
};

/**
 * Poll a JSON endpoint on an interval. Seeds from server-rendered `initial`
 * so the first paint has data, then keeps it live on the client.
 *
 * No external dependency — just fetch + setInterval, with abort on unmount.
 */
export function useLiveData<T>(
  path: string,
  intervalMs: number,
  opts?: { initial?: T; enabled?: boolean },
): LiveQuery<T> {
  const hasInitial = opts?.initial !== undefined;
  const [data, setData] = useState<T | undefined>(opts?.initial);
  const [status, setStatus] = useState<LiveStatus>(hasInitial ? "live" : "loading");
  const [updatedAt, setUpdatedAt] = useState<number>(hasInitial ? Date.now() : 0);

  const enabled = opts?.enabled ?? true;
  const loadRef = useRef<() => void>(() => {});

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function load() {
      try {
        const res = await fetch(path, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as T;
        if (!alive) return;
        setData(json);
        setStatus("live");
        setUpdatedAt(Date.now());
      } catch {
        if (!alive || controller.signal.aborted) return;
        setStatus("error");
      }
    }

    loadRef.current = load;

    if (enabled) {
      load();
      const id = setInterval(load, intervalMs);
      return () => {
        alive = false;
        controller.abort();
        clearInterval(id);
      };
    }

    return () => {
      alive = false;
      controller.abort();
    };
  }, [path, intervalMs, enabled]);

  return { data, status, updatedAt, refresh: () => loadRef.current() };
}

/** Tiny relative-time formatter shared across live panels. */
export function timeAgo(ms: number): string {
  if (!ms) return "—";
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}
