type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function PrimaryButton({ children, className = "", ...props }: Props) {
  return (
    <button
      className={`rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-8 py-4 text-lg font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.18)] transition-all duration-300 hover:bg-[#F5D77A] hover:shadow-[0_0_40px_rgba(212,175,55,0.28)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
