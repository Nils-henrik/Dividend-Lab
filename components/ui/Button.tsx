type Props = {
  children: React.ReactNode;
};

export default function PrimaryButton({ children }: Props) {
  return (
    <button className="mt-12 rounded-full border border-yellow-500 px-8 py-3 font-medium text-white transition-all duration-300 hover:bg-yellow-500 hover:text-black">
      {children}
    </button>
  );
}