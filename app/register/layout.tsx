import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";

export const metadata: Metadata = noIndexMetadata("Skapa konto");

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return children;
}
