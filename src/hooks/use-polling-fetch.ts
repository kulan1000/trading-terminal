"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/toast";

interface Options {
  url: string;
  intervalMs?: number;
  toastOnRefresh?: boolean;
}

export function usePollingFetch<T>({ url, intervalMs = 30_000, toastOnRefresh = true }: Options) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const { toast } = useToast();
  const hasFetched = useRef(false);

  const fetchData = useCallback(() => {
    fetch(url)
      .then((r) => r.json())
      .then((d: T) => {
        setData(d);
        setError(false);
        if (hasFetched.current && toastOnRefresh) {
          toast("Data uppdaterad", "success");
        }
        hasFetched.current = true;
      })
      .catch(() => {
        setError(true);
        if (hasFetched.current) {
          toast("Kunde inte uppdatera", "error");
        }
        hasFetched.current = true;
      });
  }, [url, toast, toastOnRefresh]);

  useEffect(() => {
    hasFetched.current = false;
    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [fetchData, intervalMs]);

  return { data, error, retry: fetchData };
}
