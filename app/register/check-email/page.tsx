import Link from "next/link";
import { redirect } from "next/navigation";
import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/redirects";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

export default async function CheckEmailPage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect(DEFAULT_AUTHENTICATED_PATH);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-divlab-bg px-6 py-12 text-divlab-text">
      <section className="divlab-card w-full max-w-md rounded-3xl p-8 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
        <p className="mb-3 divlab-section-label">{DIVLAB_BRAND_NAME}</p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-divlab-text">
          Kolla din e-post
        </h1>
        <p className="mt-4 text-sm leading-6 text-divlab-text-secondary">
          Kontot är skapat. Vi har skickat ett verifieringsmejl till adressen du
          registrerade.
        </p>

        <div
          role="status"
          className="mt-6 rounded-2xl border border-divlab-blue/20 bg-divlab-blue/5 px-5 py-4"
        >
          <p className="text-sm font-medium text-divlab-text">
            Nästa steg
          </p>
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Öppna mejlet från DivLab och tryck på verifieringslänken. När
            verifieringen är klar skickas du vidare till DivLab automatiskt.
          </p>
        </div>

        <p className="mt-5 text-sm leading-6 text-divlab-text-muted">
          Ser du inget mejl? Kontrollera skräppost och vänta någon minut innan
          du försöker igen.
        </p>

        <div className="mt-8 space-y-3 text-center text-sm">
          <Link href="/login" className="divlab-link font-medium">
            Till inloggningen
          </Link>
          <div>
            <Link href="/" className="divlab-link text-divlab-text-muted">
              Till startsidan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
