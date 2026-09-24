import Link from "next/link";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import CompanyCommentForm from "@/components/companies/CompanyCommentForm";
import DeleteCompanyCommentButton from "@/components/companies/DeleteCompanyCommentButton";
import type { AuthenticatedUser } from "@/lib/auth/user";
import {
  formatCompanyCommentTimestamp,
  getCompanyComments,
} from "@/lib/companies/comments.server";
import { isDivLabOwnerUser } from "@/lib/moderation/access.server";

type Props = {
  companyId: string | null;
  companySlug: string;
  companyName: string;
  user: AuthenticatedUser | null;
  hasUsername: boolean;
};

export default async function CompanyComments({
  companyId,
  companySlug,
  companyName,
  user,
  hasUsername,
}: Props) {
  const [comments, isModerator] = await Promise.all([
    companyId ? getCompanyComments(companyId) : Promise.resolve([]),
    user ? isDivLabOwnerUser(user.id) : Promise.resolve(false),
  ]);
  const loginHref = `/login?redirect=${encodeURIComponent(`/bolag/${companySlug}`)}`;
  const headingId = "company-comments-heading";

  return (
    <section aria-labelledby={headingId} className="divlab-card mt-4 scroll-mt-28 p-5 sm:p-6">
      <h2 id={headingId} className="text-[15px] font-bold tracking-[-0.02em] text-divlab-text">
        Kommentarer om {companyName}
      </h2>
      <p className="mt-2 text-xs leading-5 text-divlab-text-secondary">
        Synliga kommentarer kan läsas av alla besökare.
      </p>

      <div className="mt-4 space-y-3">
        {comments.length === 0 ? (
          <p className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-3 text-sm text-divlab-text-secondary">
            Inga kommentarer ännu.
          </p>
        ) : (
          comments.map((comment) => {
            const profileHref = comment.username
              ? `/profile/${encodeURIComponent(comment.username)}`
              : null;
            const reportHref = `/report?targetType=company_comment&targetId=${encodeURIComponent(comment.id)}&url=${encodeURIComponent(`/bolag/${companySlug}#comment-${comment.id}`)}`;
            const moderateHref =
              isModerator && user && comment.userId !== user.id
                ? `/moderation/direct?targetType=company_comment&targetId=${encodeURIComponent(comment.id)}`
                : null;

            return (
              <article
                key={comment.id}
                id={`comment-${comment.id}`}
                className="scroll-mt-24 rounded-xl border divlab-border-neutral divlab-inset px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <ProfileAvatar
                    avatarUrl={comment.avatarUrl}
                    initials={comment.initials}
                    sizeClassName="h-8 w-8"
                    textClassName="text-[10px]"
                    imageAlt=""
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-divlab-text-muted">
                      {profileHref ? (
                        <Link
                          href={profileHref}
                          className="font-medium text-divlab-text transition hover:text-divlab-blue-muted"
                        >
                          {comment.displayName}
                        </Link>
                      ) : (
                        <span className="font-medium text-divlab-text">{comment.displayName}</span>
                      )}
                      <time dateTime={comment.createdAt}>
                        {formatCompanyCommentTimestamp(comment.createdAt)}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-divlab-text-secondary">
                      {comment.body}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link href={reportHref} className="text-xs text-divlab-text-muted transition hover:text-divlab-text">
                        Rapportera
                      </Link>
                      {user?.id === comment.userId ? (
                        <DeleteCompanyCommentButton companySlug={companySlug} commentId={comment.id} />
                      ) : null}
                      {moderateHref ? (
                        <Link href={moderateHref} className="text-xs font-medium text-amber-300 transition hover:text-amber-200">
                          Moderera
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="mt-5 border-t divlab-border-neutral pt-5">
        {!user ? (
          <Link href={loginHref} className="divlab-link text-sm font-medium">
            Logga in för att kommentera
          </Link>
        ) : !hasUsername ? (
          <p className="text-sm leading-6 text-divlab-text-secondary">
            <Link href="/account/edit" className="divlab-link font-medium">
              Välj ett @namn i din profil
            </Link>{" "}
            för att kunna kommentera.
          </p>
        ) : (
          <CompanyCommentForm companySlug={companySlug} />
        )}
      </div>
    </section>
  );
}
