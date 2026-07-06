"use client";

import { useState } from "react";

type Props = {
  label?: string;
};

export default function ForumShareButton({ label = "Share" }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="rounded-md border border-white/10 px-2 py-1 text-[11px] font-medium text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
      >
        {label}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-32 rounded-lg border border-white/10 bg-[#111111] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          {["X", "Facebook", "Copy Link"].map((target) => (
            <button
              key={target}
              type="button"
              className="block w-full rounded-md px-2.5 py-1.5 text-left text-xs text-gray-400 transition hover:bg-white/[0.03] hover:text-white"
            >
              {target}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
