import Link from "next/link";

type Props = {
  href?: string;
  asLink?: boolean;
  logoClassName?: string;
  textClassName?: string;
};

export default function DivLabWordmark({
  href = "/",
  asLink = true,
  logoClassName = "text-3xl",
  textClassName = "text-lg md:text-xl",
}: Props) {
  const content = (
    <>
      <span className={`divlab-brand-logo ${logoClassName}`}>DL</span>
      <span className={`font-semibold text-divlab-text ${textClassName}`}>
        DivLab
      </span>
    </>
  );

  if (!asLink) {
    return <div className="flex items-center gap-2.5">{content}</div>;
  }

  return (
    <Link href={href} className="flex items-center gap-2.5">
      {content}
    </Link>
  );
}
