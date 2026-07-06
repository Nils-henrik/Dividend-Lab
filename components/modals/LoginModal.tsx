"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { setMockUser } from "@/lib/auth/mockAuth";
import PrimaryButton from "@/components/ui/Button";

export default function LoginModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (username.trim() !== "admin" || password !== "admin") {
      setError("Använd admin som användarnamn och lösenord.");
      return;
    }

    setMockUser(username);
    setIsOpen(false);
    router.push("/dashboard");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-[#D4AF37]/70 px-6 py-3 text-[#D4AF37] transition duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
      >
        Logga in
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center overflow-y-auto bg-black/70 px-6 py-8 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Stäng inloggning"
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#111111] p-8 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
            <div className="mb-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
                Dividend Lab
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                Logga in
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                Använd mock-inloggningen för att öppna Dashboard 1.0 och
                utforska portföljöversikten.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                  Användarnamn
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                  Lösenord
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
                />
              </label>

              {error && <p className="text-sm text-green-400">{error}</p>}

              <PrimaryButton type="submit" className="w-full">
                Sign In
              </PrimaryButton>
            </form>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-5 w-full rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-400 transition hover:border-white/20 hover:text-white"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </>
  );
}
