"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Options {
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  select?: string;
  /** Applied to the query builder, e.g. q => q.neq("role", "customer") */
  filter?: (q: any) => any;
}

/**
 * Loads a table and keeps it live via Supabase Realtime, mirroring the Firestore
 * onSnapshot listeners the original admin panel used.
 */
export function useTable<T>(table: string, map: (row: any) => T, opts: Options = {}) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const optsRef = useRef(opts);
  const mapRef = useRef(map);
  optsRef.current = opts;
  mapRef.current = map;

  const refresh = useCallback(async () => {
    const o = optsRef.current;
    let q = getSupabase().from(table).select(o.select ?? "*");
    if (o.filter) q = o.filter(q);
    if (o.orderBy) q = q.order(o.orderBy, { ascending: o.ascending ?? false });
    if (o.limit) q = q.limit(o.limit);
    const { data, error: err } = await q;
    if (err) setError(err.message);
    else {
      setError(null);
      setRows((data ?? []).map((r: any) => mapRef.current(r)));
    }
    setLoading(false);
  }, [table]);

  useEffect(() => {
    refresh();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = getSupabase()
      .channel(`live-${table}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        clearTimeout(timer);
        timer = setTimeout(refresh, 150);
      })
      .subscribe();
    return () => {
      clearTimeout(timer);
      getSupabase().removeChannel(channel);
    };
  }, [table, refresh]);

  return { rows, loading, error, refresh };
}
