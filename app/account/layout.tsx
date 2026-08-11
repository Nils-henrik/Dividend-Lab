import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";

export const metadata: Metadata = noIndexMetadata("Konto");

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
