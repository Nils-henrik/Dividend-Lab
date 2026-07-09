type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export default function PrimaryButton({ children, className = "", ...props }: Props) {
  return (
    <button className={`divlab-btn-primary px-8 py-4 text-lg ${className}`} {...props}>
      {children}
    </button>
  );
}
