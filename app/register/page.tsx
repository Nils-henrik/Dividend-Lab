import { redirect } from "next/navigation";
import RegisterForm from "@/components/auth/RegisterForm";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session";

type Props = {
  searchParams: Promise<{
    redirect?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo = getSafeRedirectPath(redirectParam);
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(redirectTo);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-divlab-bg px-6 py-12 text-divlab-text">
      <RegisterForm redirectTo={redirectTo} />
    </main>
  );
}
