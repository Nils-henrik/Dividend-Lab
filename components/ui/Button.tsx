import Link from "next/link";

const primaryButtonClasses =
  "rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-8 py-4 text-lg font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.18)] transition-all duration-300 hover:bg-[#F5D77A] hover:shadow-[0_0_40px_rgba(212,175,55,0.28)]";

type SharedProps = {
  children: React.ReactNode;
  className?: string;
};

type ButtonProps = SharedProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkButtonProps = SharedProps &
  Omit<React.ComponentProps<typeof Link>, "className" | "children"> & {
    href: string;
  };

type Props = ButtonProps | LinkButtonProps;

export default function PrimaryButton({
  children,
  className = "",
  ...props
}: Props) {
  if ("href" in props && props.href) {
    const { href, ...linkProps } = props;

    return (
      <Link
        href={href}
        className={`inline-flex items-center justify-center ${primaryButtonClasses} ${className}`}
        {...linkProps}
      >
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonProps;

  return (
    <button
      className={`${primaryButtonClasses} ${className}`}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
