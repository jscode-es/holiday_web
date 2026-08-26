"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export type LocationValue = { label: string; lat: number; lng: number };

type NominatimResult = { display_name: string; lat: string; lon: string };

export function LocationSearch({
  value,
  onChange,
  placeholder,
}: {
  value: LocationValue | null;
  onChange: (value: LocationValue | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [results, setResults] = useState<LocationValue[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchEligible = query.trim().length >= 3 && query !== value?.label;

  useEffect(() => {
    if (!searchEligible) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        const data: NominatimResult[] = await res.json();
        setResults(data.map((r) => ({ label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) })));
        setOpen(true);
      } catch {
        // aborted (typed again) or network error — leave results as-is
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, searchEligible]);

  function select(result: LocationValue) {
    onChange(result);
    setQuery(result.label);
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.trim() === "") onChange(null);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
      />
      {loading && (
        <span className="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-neutral-400">Buscando…</span>
      )}
      {open && searchEligible && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-neutral-100 bg-white py-1 shadow-lg">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                className="block w-full truncate px-3 py-1.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(r)}
              >
                {r.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
