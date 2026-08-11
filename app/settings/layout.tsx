import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";

export const metadata: Metadata = noIndexMetadata("Inställningar");

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
