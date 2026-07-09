import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LoginForm from "@/components/auth/LoginForm";
import {
  DEFAULT_AUTHENTICATED_PATH,
  getSafeRedirectPath,
} from "@/lib/auth/redirects";
import { RECOVERY_PENDING_COOKIE } from "@/lib/auth/recovery";
import { getAuthenticatedUser } from "@/lib/auth/session";

type Props = {
  searchParams: Promise<{
    redirect?: string;
    reset?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { redirect: redirectParam, reset } = await searchParams;
  const redirectTo = getSafeRedirectPath(redirectParam);
  const user = await getAuthenticatedUser();
  const cookieStore = await cookies();
  const recoveryPending =
    cookieStore.get(RECOVERY_PENDING_COOKIE)?.value === "1";

  if (user) {
    if (recoveryPending) {
      redirect("/reset-password");
    }

    redirect(redirectTo || DEFAULT_AUTHENTICATED_PATH);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-divlab-bg px-6 py-12 text-divlab-text">
      <LoginForm redirectTo={redirectTo} resetSuccess={reset === "success"} />
    </main>
  );
}
