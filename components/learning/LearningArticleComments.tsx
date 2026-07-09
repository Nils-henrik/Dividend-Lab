import Link from "next/link";
import LearningCommentForm from "@/components/learning/LearningCommentForm";
import {
  formatLearningCommentTimestamp,
  getLearningArticleComments,
} from "@/lib/learning/queries";
import type { AuthenticatedUser } from "@/lib/auth/user";
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
  const comments = await getLearningArticleComments(articleSlug);
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
            Inga kommentarer ännu. Var den första som delar ett lugn perspektiv.
          </p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-xl border divlab-border-neutral divlab-inset px-4 py-3"
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
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-divlab-text-secondary">
                {comment.body}
              </p>
            </article>
          ))
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
