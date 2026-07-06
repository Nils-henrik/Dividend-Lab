import Link from "next/link";

type Breadcrumb = {
  label: string;
  href?: string;
};

type Props = {
  items: Breadcrumb[];
};

export default function ForumBreadcrumbs({ items }: Props) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {item.href ? (
            <Link href={item.href} className="transition hover:text-[#D4AF37]">
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-300">{item.label}</span>
          )}
          {index < items.length - 1 && <span>→</span>}
        </span>
      ))}
    </nav>
  );
}
