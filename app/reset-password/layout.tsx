import type { Metadata } from "next";
import type { ReactNode } from "react";
import { noIndexMetadata } from "@/lib/seo/robots-metadata";

export const metadata: Metadata = noIndexMetadata("Återställ lösenord");

export default function ResetPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
