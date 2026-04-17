import Papa from "papaparse";
import { useEffect, useState } from "react";

export type FetchedData<T = unknown> = T[] | Record<string, unknown> | null;

/**
 * Fetch data from a URL. Auto-detects JSON vs CSV by content-type or URL.
 * Supports Google Sheets published as CSV (`/pub?output=csv`).
 */
export async function fetchFromUrl<T = unknown>(url: string): Promise<FetchedData<T>> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  const isCsv = ct.includes("csv") || /\.csv|output=csv/i.test(url);

  if (isCsv) {
    const text = await res.text();
    const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true, dynamicTyping: true });
    return parsed.data as T[];
  }
  return (await res.json()) as FetchedData<T>;
}

interface UseRemoteDataOptions {
  /** poll interval in ms; 0 disables */
  refreshMs?: number;
  /** when false, hook is idle */
  enabled?: boolean;
}

export function useRemoteData<T = unknown>(
  url: string | null | undefined,
  options: UseRemoteDataOptions = {}
) {
  const { refreshMs = 0, enabled = true } = options;
  const [data, setData] = useState<FetchedData<T>>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled || !url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFromUrl<T>(url)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [url, enabled, reloadKey]);

  useEffect(() => {
    if (!enabled || !url || !refreshMs) return;
    const id = setInterval(() => setReloadKey((k) => k + 1), refreshMs);
    return () => clearInterval(id);
  }, [url, enabled, refreshMs]);

  return { data, loading, error, reload: () => setReloadKey((k) => k + 1) };
}
