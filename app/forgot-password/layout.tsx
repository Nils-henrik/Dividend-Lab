import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";

export const metadata: Metadata = noIndexMetadata("Glömt lösenord");

export default function ForgotPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
