"use client";

import { useActionState, useMemo, useState } from "react";
import { submitContentReportAction } from "@/app/report/actions";
import { REPORT_CATEGORY_LABELS } from "@/lib/moderation/config";
import type {
  ContentReportActionState,
  ContentReportCategory,
  ContentReportKind,
  ContentReportTargetType,
} from "@/lib/moderation/types";

const initialState: ContentReportActionState = {
  status: "idle",
  message: "",
};

const illegalCategories: ContentReportCategory[] = [
  "child_safety",
  "threats_or_violence",
  "hate_or_illegal_discrimination",
  "harassment_or_defamation",
  "privacy_or_personal_data",
  "fraud_or_market_manipulation",
  "copyright_or_ip",
  "other_illegal",
];

const termsCategories: ContentReportCategory[] = [
  "spam_or_marketing",
  "impersonation",
  "other_terms_violation",
];

const targetLabels: Record<ContentReportTargetType, string> = {
  forum_thread: "Forumtråd",
  forum_reply: "Forumsvar",
  learning_comment: "Kommentar",
  profile: "Profil",
  profile_avatar: "Profilbild",
  other: "Annan plats på DivLab",
};

type Props = {
  initialTargetType: ContentReportTargetType;
  initialTargetId?: string;
  initialTargetUrl?: string;
  initialReporterName?: string;
  initialReporterEmail?: string;
};

export default function ContentReportForm({
  initialTargetType,
  initialTargetId = "",
  initialTargetUrl = "",
  initialReporterName = "",
  initialReporterEmail = "",
}: Props) {
  const [state, formAction, pending] = useActionState(
    submitContentReportAction,
    initialState,
  );
  const [reportKind, setReportKind] = useState<ContentReportKind>("illegal_content");
  const [category, setCategory] = useState<ContentReportCategory>("other_illegal");
  const [targetType, setTargetType] = useState<ContentReportTargetType>(initialTargetType);

  const categories = useMemo(
    () => (reportKind === "illegal_content" ? illegalCategories : termsCategories),
    [reportKind],
  );
  const identityMayBeOmitted = category === "child_safety";
  const success = state.status === "success";
  const targetIsLocked = Boolean(initialTargetId);

  function changeReportKind(nextKind: ContentReportKind) {
    setReportKind(nextKind);
    setCategory(nextKind === "illegal_content" ? "other_illegal" : "other_terms_violation");
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="targetId" value={initialTargetId} />
      {targetIsLocked ? <input type="hidden" name="targetType" value={targetType} /> : null}

      {success ? (
        <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5" role="status">
          <p className="text-sm font-semibold text-divlab-text">Anmälan mottagen</p>
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">{state.message}</p>
          {state.referenceCode ? (
            <p className="mt-4 rounded-lg border divlab-border-neutral bg-divlab-bg/40 px-3 py-2 font-mono text-sm text-divlab-text">
              {state.referenceCode}
            </p>
          ) : null}
          <p className="mt-3 text-xs leading-5 text-divlab-text-muted">
            Spara referensen. Den identifierar ärendet i fortsatt kommunikation med DivLab.
          </p>
        </section>
      ) : null}

      <fieldset disabled={pending || success} className="space-y-6 disabled:opacity-70">
        <section>
          <p className="text-sm font-semibold text-divlab-text">1. Vad gäller anmälan?</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="rounded-xl border divlab-border-neutral divlab-inset p-4 text-sm text-divlab-text-secondary">
              <input
                type="radio"
                name="reportKind"
                value="illegal_content"
                checked={reportKind === "illegal_content"}
                onChange={() => changeReportKind("illegal_content")}
                className="mr-2"
              />
              <span className="font-medium text-divlab-text">Misstänkt olagligt innehåll</span>
              <span className="mt-1 block text-xs leading-5 text-divlab-text-muted">
                Använd denna väg om du anser att innehållet strider mot lag.
              </span>
            </label>
            <label className="rounded-xl border divlab-border-neutral divlab-inset p-4 text-sm text-divlab-text-secondary">
              <input
                type="radio"
                name="reportKind"
                value="terms_violation"
                checked={reportKind === "terms_violation"}
                onChange={() => changeReportKind("terms_violation")}
                className="mr-2"
              />
              <span className="font-medium text-divlab-text">Bryter mot DivLabs regler</span>
              <span className="mt-1 block text-xs leading-5 text-divlab-text-muted">
                Spam, identitetsförfalskning eller annat regelbrott som inte behöver vara olagligt.
              </span>
            </label>
          </div>
        </section>

        <section>
          <label htmlFor="report-category" className="text-sm font-semibold text-divlab-text">
            2. Kategori
          </label>
          <select
            id="report-category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value as ContentReportCategory)}
            className="divlab-input mt-3 w-full px-3 py-2.5 text-sm"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {REPORT_CATEGORY_LABELS[item]}
              </option>
            ))}
          </select>
        </section>

        <section className="space-y-3">
          <p className="text-sm font-semibold text-divlab-text">3. Exakt innehåll</p>
          <div className="grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)]">
            <label className="text-xs font-medium text-divlab-text-muted">
              Typ
              <select
                name={targetIsLocked ? undefined : "targetType"}
                value={targetType}
                onChange={(event) => setTargetType(event.target.value as ContentReportTargetType)}
                disabled={targetIsLocked}
                className="divlab-input mt-1.5 w-full px-3 py-2.5 text-sm text-divlab-text"
              >
                {Object.entries(targetLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-divlab-text-muted">
              Exakt länk
              <input
                name="targetUrl"
                type="url"
                defaultValue={initialTargetUrl}
                readOnly={targetIsLocked}
                required={targetType === "other"}
                placeholder="https://divlab.se/..."
                className="divlab-input mt-1.5 w-full px-3 py-2.5 text-sm text-divlab-text read-only:opacity-75"
              />
            </label>
          </div>
          {targetIsLocked ? (
            <p className="text-xs leading-5 text-divlab-text-muted">
              DivLab verifierar innehållets ID och sparar automatiskt en snapshot av den version som anmäls.
            </p>
          ) : (
            <p className="text-xs leading-5 text-divlab-text-muted">
              Länken måste peka på DivLab. Ange den mest exakta adressen du kan, gärna direkt till inlägget eller profilen.
            </p>
          )}
        </section>

        <section className="space-y-3">
          <label htmlFor="report-explanation" className="text-sm font-semibold text-divlab-text">
            4. Varför bör innehållet granskas?
          </label>
          <textarea
            id="report-explanation"
            name="explanation"
            minLength={20}
            maxLength={5000}
            rows={7}
            required
            placeholder="Beskriv konkret vad i innehållet som är problematiskt och varför. Hänvisa gärna till den del av texten, bilden eller profilen som anmälan gäller."
            className="divlab-input w-full resize-y px-3 py-2.5 text-sm leading-6 text-divlab-text"
          />
          {reportKind === "illegal_content" ? (
            <label className="block text-xs font-medium text-divlab-text-muted">
              Rättslig grund, om du känner till den (valfritt)
              <textarea
                name="legalBasis"
                maxLength={1000}
                rows={3}
                placeholder="Exempel: lag, bestämmelse eller annan information som hjälper oss förstå varför innehållet kan vara olagligt."
                className="divlab-input mt-1.5 w-full resize-y px-3 py-2.5 text-sm leading-6 text-divlab-text"
              />
            </label>
          ) : (
            <input type="hidden" name="legalBasis" value="" />
          )}
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-divlab-text">5. Kontaktuppgifter</p>
            <p className="mt-1 text-xs leading-5 text-divlab-text-muted">
              Vi använder uppgifterna för mottagningsbekräftelse och för att meddela beslutet i ärendet.
            </p>
          </div>
          {identityMayBeOmitted ? (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-divlab-text-secondary">
              Vid anmälningar om sexuella övergrepp mot barn eller exploatering kan namn och e-post utelämnas. Om du lämnar e-post kan vi ändå skicka beslutet till dig.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-divlab-text-muted">
              Namn eller organisation
              <input
                name="reporterName"
                defaultValue={initialReporterName}
                required={!identityMayBeOmitted}
                maxLength={200}
                autoComplete="name"
                className="divlab-input mt-1.5 w-full px-3 py-2.5 text-sm text-divlab-text"
              />
            </label>
            <label className="text-xs font-medium text-divlab-text-muted">
              E-post
              <input
                name="reporterEmail"
                type="email"
                defaultValue={initialReporterEmail}
                required={!identityMayBeOmitted}
                maxLength={320}
                autoComplete="email"
                className="divlab-input mt-1.5 w-full px-3 py-2.5 text-sm text-divlab-text"
              />
            </label>
          </div>
        </section>

        <label className="flex items-start gap-3 rounded-xl border divlab-border-neutral divlab-inset p-4 text-sm leading-6 text-divlab-text-secondary">
          <input
            type="checkbox"
            name="goodFaithConfirmed"
            required
            className="mt-1"
          />
          <span>
            Jag bekräftar att jag lämnar denna anmälan i god tro och att informationen i anmälan, efter bästa förmåga och kännedom, är korrekt och fullständig.
          </span>
        </label>

        {state.status === "error" ? (
          <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm leading-6 text-red-300" role="alert">
            {state.message}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="divlab-btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
          {pending ? "Registrerar anmälan…" : "Skicka anmälan"}
        </button>
      </fieldset>
    </form>
  );
}
