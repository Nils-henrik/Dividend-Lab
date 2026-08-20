import Link from "next/link";
import LearningCommentForm from "@/components/learning/LearningCommentForm";
import {
  formatLearningCommentTimestamp,
  getLearningArticleComments,
} from "@/lib/learning/queries";
import type { AuthenticatedUser } from "@/lib/auth/user";
import { isModeratorUser } from "@/lib/moderation/access.server";
import type { UserProfile } from "@/lib/profiles/types";

type Props = {
  articleSlug: string;
  user: AuthenticatedUser | null;
  profile: UserProfile | null;
};

export default async function LearningArticleComments({
  articleSlug,
  user,
  profile,
}: Props) {
  const [comments, isModerator] = await Promise.all([
    getLearningArticleComments(articleSlug),
    user ? isModeratorUser(user.id) : Promise.resolve(false),
  ]);
  const username = profile?.username?.trim();
  const loginHref = `/login?redirect=${encodeURIComponent(`/learning/${articleSlug}`)}`;

  return (
    <section className="divlab-card space-y-4 p-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
          Kommentarer
        </p>
        <h2 className="mt-2 text-lg font-semibold text-divlab-text">
          Diskussion om artikeln
        </h2>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
          Dela frågor och perspektiv. Kommentarer är synliga för alla besökare.
        </p>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-3 text-sm text-divlab-text-secondary">
            Inga kommentarer ännu. Var den första som delar ett lugnt perspektiv.
          </p>
        ) : (
          comments.map((comment) => {
            const moderateHref =
              isModerator && user && comment.userId !== user.id
                ? `/moderation/direct?targetType=learning_comment&targetId=${encodeURIComponent(comment.id)}`
                : null;

            return (
              <article
                key={comment.id}
                id={`comment-${comment.id}`}
                className="scroll-mt-24 rounded-xl border divlab-border-neutral divlab-inset px-4 py-3"
              >
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-divlab-text-muted">
                  <Link
                    href={`/profile/${encodeURIComponent(comment.username)}`}
                    className="font-medium text-divlab-text transition hover:text-divlab-blue-muted"
                  >
                    @{comment.username}
                  </Link>
                  <span className="h-1 w-1 rounded-full bg-divlab-text-subtle" />
                  <span>{formatLearningCommentTimestamp(comment.createdAt)}</span>
                  <span className="h-1 w-1 rounded-full bg-divlab-text-subtle" />
                  <Link
                    href={`/report?targetType=learning_comment&targetId=${encodeURIComponent(comment.id)}&url=${encodeURIComponent(`/learning/${articleSlug}#comment-${comment.id}`)}`}
                    className="transition hover:text-divlab-text"
                  >
                    Rapportera
                  </Link>
                  {moderateHref ? (
                    <>
                      <span className="h-1 w-1 rounded-full bg-divlab-text-subtle" />
                      <Link
                        href={moderateHref}
                        className="font-medium text-amber-300 transition hover:text-amber-200"
                      >
                        Moderera
                      </Link>
                    </>
                  ) : null}
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-divlab-text-secondary">
                  {comment.body}
                </p>
              </article>
            );
          })
        )}
      </div>

      <div className="border-t divlab-border-neutral pt-5">
        {!user ? (
          <p className="text-sm leading-6 text-divlab-text-secondary">
            <Link href={loginHref} className="divlab-link font-medium">
              Logga in
            </Link>{" "}
            för att kommentera.
          </p>
        ) : !username ? (
          <p className="text-sm leading-6 text-divlab-text-secondary">
            <Link href="/account/edit" className="divlab-link font-medium">
              Välj ett @namn i din profil
            </Link>{" "}
            för att kunna kommentera.
          </p>
        ) : (
          <LearningCommentForm articleSlug={articleSlug} />
        )}
      </div>
    </section>
  );
}
