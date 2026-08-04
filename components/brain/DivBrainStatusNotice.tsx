type Props = {
  title: string;
  description: string;
};

export default function DivBrainStatusNotice({ title, description }: Props) {
  return (
    <div
      className="divlab-inset rounded-2xl px-4 py-3 sm:px-5"
      role="status"
    >
      <p className="text-sm font-medium text-divlab-text">{title}</p>
      <p className="mt-1 text-sm leading-6 text-divlab-text-secondary">
        {description}
      </p>
    </div>
  );
}
