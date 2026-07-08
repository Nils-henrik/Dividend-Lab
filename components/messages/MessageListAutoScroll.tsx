"use client";

import { useEffect, useRef } from "react";

type Props = {
  scrollKey: string;
};

export default function MessageListAutoScroll({ scrollKey }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      block: "end",
      behavior: "auto",
    });
  }, [scrollKey]);

  return <div ref={bottomRef} aria-hidden="true" />;
}
