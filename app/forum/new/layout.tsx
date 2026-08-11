import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";

export const metadata: Metadata = noIndexMetadata("Ny diskussion");

export default function ForumNewLayout({ children }: { children: ReactNode }) {
  return children;
}
