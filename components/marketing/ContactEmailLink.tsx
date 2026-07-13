import Link from "next/link";
import { DIVLAB_CONTACT } from "@/lib/site/contact";

type Props = {
  kind: "general" | "privacy";
  className?: string;
};

export default function ContactEmailLink({ kind, className = "divlab-link font-medium" }: Props) {
  const email =
    kind === "general" ? DIVLAB_CONTACT.generalEmail : DIVLAB_CONTACT.privacyEmail;
  const mailto =
    kind === "general" ? DIVLAB_CONTACT.generalMailto : DIVLAB_CONTACT.privacyMailto;

  return (
    <Link
      href={mailto}
      className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 ${className}`}
    >
      {email}
    </Link>
  );
}
