"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { globalSearchAction } from "@/app/search/actions";
import AppIcon from "@/components/layout/AppIcon";
import {
  EMPTY_GLOBAL_SEARCH_RESULTS,
  GLOBAL_SEARCH_DEBOUNCE_MS,
  GLOBAL_SEARCH_MIN_LENGTH,
  type GlobalSearchResults,
} from "@/lib/search/types";
import SearchResultsPanel from "./SearchResultsPanel";

type Props = {
  variant?: "desktop" | "mobile";
  onExpandedChange?: (expanded: boolean) => void;
};

export default function GlobalSearch({
  variant = "desktop",
  onExpandedChange,
}: Props) {
  const inputId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] =
    useState<GlobalSearchResults>(EMPTY_GLOBAL_SEARCH_RESULTS);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(variant === "desktop");
  const [isLoading, setIsLoading] = useState(false);

  const collapseMobileSearch = useCallback(() => {
    setIsExpanded(false);
    onExpandedChange?.(false);
  }, [onExpandedChange]);

  function handleClose() {
    setIsOpen(false);

    if (variant === "mobile") {
      collapseMobileSearch();
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setIsOpen(true);

    if (value.trim().length < GLOBAL_SEARCH_MIN_LENGTH) {
      setResults(EMPTY_GLOBAL_SEARCH_RESULTS);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);

        if (variant === "mobile") {
          collapseMobileSearch();
        }
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);

        if (variant === "mobile") {
          collapseMobileSearch();
        }
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [collapseMobileSearch, isOpen, variant]);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < GLOBAL_SEARCH_MIN_LENGTH) {
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const nextResults = await globalSearchAction(trimmedQuery);
      setResults(nextResults);
      setIsLoading(false);
    }, GLOBAL_SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  function openMobileSearch() {
    setIsExpanded(true);
    setIsOpen(true);
    onExpandedChange?.(true);

    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  if (variant === "mobile" && !isExpanded) {
    return (
      <button
        type="button"
        onClick={openMobileSearch}
        aria-label="Öppna sökning"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border divlab-border-neutral text-divlab-text-secondary transition hover:border-divlab-blue/40 hover:text-divlab-blue"
      >
        <AppIcon name="search" className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      role="combobox"
      aria-expanded={isOpen}
      aria-controls={`${inputId}-results`}
      aria-haspopup="listbox"
      className={
        variant === "desktop"
          ? "relative hidden w-72 xl:block"
          : "relative min-w-0 flex-1"
      }
    >
      <label
        htmlFor={inputId}
        className={`flex items-center gap-3 divlab-input text-divlab-text-muted focus-within:border-divlab-blue/40 ${
          variant === "desktop" ? "px-4 py-3" : "px-3 py-2"
        }`}
      >
        <AppIcon name="search" className="h-4 w-4 shrink-0" />
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Sök i DivLab"
          autoComplete="off"
          aria-label="Sök i DivLab"
          className="w-full bg-transparent text-divlab-text-secondary outline-none placeholder:text-divlab-text-muted"
        />
        {variant === "mobile" && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Stäng sökning"
            className="shrink-0 text-[11px] font-medium text-divlab-text-muted transition hover:text-divlab-text"
          >
            Stäng
          </button>
        )}
      </label>

      {isOpen && (
        <div id={`${inputId}-results`} role="listbox">
          <SearchResultsPanel
            results={results}
            isLoading={isLoading}
            query={query}
            onSelect={handleClose}
          />
        </div>
      )}
    </div>
  );
}
