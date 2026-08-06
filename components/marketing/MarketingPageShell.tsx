import Navbar from "@/components/layout/Navbar";
import MarketingFooter from "./MarketingFooter";
import PublicPageShell from "@/components/layout/PublicPageShell";

type Props = {
  children: React.ReactNode;
};

/** @deprecated Prefer PublicPageShell — kept as a thin alias for marketing routes. */
export default function MarketingPageShell({ children }: Props) {
  return <PublicPageShell>{children}</PublicPageShell>;
}

export { Navbar, MarketingFooter };
