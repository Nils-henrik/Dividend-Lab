import Navbar from "@/components/layout/Navbar";
import MarketingFooter from "./MarketingFooter";

type Props = {
  children: React.ReactNode;
};

export default function MarketingPageShell({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#090909] text-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
