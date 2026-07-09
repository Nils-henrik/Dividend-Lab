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
    <section className="space-y-4 rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
          Kommentarer
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">
          Diskussion om artikeln
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          Dela frågor och perspektiv. Kommentarer är synliga för alla besökare.
        </p>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-400">
            Inga kommentarer ännu. Var den första som delar ett lugn perspektiv.
          </p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <Link
                  href={`/profile/${encodeURIComponent(comment.username)}`}
                  className="font-medium text-white transition hover:text-[#D4AF37]"
                >
                  @{comment.username}
                </Link>
                <span className="h-1 w-1 rounded-full bg-gray-600" />
                <span>{formatLearningCommentTimestamp(comment.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
                {comment.body}
              </p>
            </article>
          ))
        )}
      </div>

      <div className="border-t border-white/10 pt-5">
        {!user ? (
          <p className="text-sm leading-6 text-gray-400">
            <Link
              href={loginHref}
              className="font-medium text-[#D4AF37] transition hover:text-[#F9D976]"
            >
              Logga in
            </Link>{" "}
            för att kommentera.
          </p>
        ) : !username ? (
          <p className="text-sm leading-6 text-gray-400">
            <Link
              href="/account/edit"
              className="font-medium text-[#D4AF37] transition hover:text-[#F9D976]"
            >
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
