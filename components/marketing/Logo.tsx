import DivLabWordmark from "@/components/brand/DivLabWordmark";

export default function Logo() {
  return (
    <div className="flex flex-col items-center">
      <DivLabWordmark asLink={false} logoClassName="text-7xl" textClassName="text-5xl" />
      <p className="mt-6 text-xl text-divlab-text-secondary">
        Marknad, verktyg och community.
      </p>
    </div>
  );
}
