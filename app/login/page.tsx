import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import {
  DEFAULT_AUTHENTICATED_PATH,
  getSafeRedirectPath,
} from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session";

type Props = {
  searchParams: Promise<{
    redirect?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo = getSafeRedirectPath(redirectParam);
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(redirectTo || DEFAULT_AUTHENTICATED_PATH);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-6 py-12 text-white">
      <LoginForm redirectTo={redirectTo} />
    </main>
  );
}
