import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/marketing/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#090909] text-white overflow-x-hidden">
      <Navbar />
      <Hero />
    </main>
  );
}