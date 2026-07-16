import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
};

export default function LearningArticleEditorialCover({
  src,
  alt,
  priority = false,
}: Props) {
  return (
    <div className="overflow-hidden rounded-xl border divlab-border-neutral bg-divlab-surface">
      <Image
        src={src}
        alt={alt}
        width={0}
        height={0}
        priority={priority}
        sizes="(max-width: 768px) 100vw, 896px"
        className="h-auto w-full"
      />
    </div>
  );
}
