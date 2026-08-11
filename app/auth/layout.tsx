import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";

export const metadata: Metadata = noIndexMetadata();

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
