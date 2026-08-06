import PublicContentShell from "@/components/layout/PublicContentShell";

type Props = {
  children: React.ReactNode;
};

export default function LearningPageShell({ children }: Props) {
  return (
    <PublicContentShell publicContentClassName="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </PublicContentShell>
  );
}
