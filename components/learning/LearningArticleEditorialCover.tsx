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
    <div className="relative aspect-[13/8] w-full max-h-[360px] overflow-hidden rounded-xl border divlab-border-neutral sm:max-h-[420px] lg:max-h-[500px]">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 896px"
        className="object-cover"
      />
    </div>
  );
}
