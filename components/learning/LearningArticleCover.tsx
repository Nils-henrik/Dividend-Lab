import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
};

export default function LearningArticleCover({
  src,
  alt,
  priority = false,
  className = "aspect-video w-full overflow-hidden rounded-xl border divlab-border-neutral",
}: Props) {
  return (
    <div className={className}>
      <Image
        src={src}
        alt={alt}
        width={1280}
        height={720}
        priority={priority}
        className="h-full w-full object-cover"
      />
    </div>
  );
}
