"use client";

import { useEffect, useState } from "react";
import {
  formatUniqueReaderLabel,
  type ContentReaderType,
} from "@/lib/content-readers/types";

type Props = {
  contentType: ContentReaderType;
  slug: string;
  initialCount: number;
};

export default function UniqueReaderCount({
  contentType,
  slug,
  initialCount,
}: Props) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/content-readers", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ contentType, slug }),
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as { uniqueReaders?: unknown };
      })
      .then((payload) => {
        if (!payload) {
          return;
        }

        const nextCount = Number(payload.uniqueReaders);
        if (Number.isFinite(nextCount) && nextCount >= 0) {
          setCount(Math.floor(nextCount));
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [contentType, slug]);

  return <span>{formatUniqueReaderLabel(count)}</span>;
}
