import Navbar from "@/components/layout/Navbar";
import MarketingFooter from "@/components/marketing/MarketingFooter";

type Props = {
  children: React.ReactNode;
  /** Optional tighter content width for long-form reading. */
  contentClassName?: string;
};

/**
 * Shared public chrome for logged-out visitors.
 * One header, mobile menu, logo treatment, auth actions and footer.
 */
export default function PublicPageShell({
  children,
  contentClassName = "",
}: Props) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#090909] text-white">
      <Navbar />
      <main className={`flex-1 ${contentClassName}`.trim()}>{children}</main>
      <MarketingFooter />
    </div>
  );
}
