import Link from "next/link";
import type { ForumPost as ForumPostType } from "@/types/forum";
import ForumRecognitionBar from "./ForumRecognitionBar";

type Props = {
  post: ForumPostType;
  isAuthenticated: boolean;
  loginHref: string;
};

export default function ForumPost({ post, isAuthenticated, loginHref }: Props) {
  return (
    <article className="rounded-md border border-white/10 bg-[#161616] px-2.5 py-2">
      <div className="grid gap-2 lg:grid-cols-[112px_1fr]">
        <aside className="border-b border-white/10 pb-2 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-2">
          <div className="flex items-center gap-2 lg:block">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[11px] font-semibold text-[#D4AF37]">
              {post.avatar}
            </div>
            <div className="min-w-0 lg:mt-1.5">
              <p className="truncate text-xs font-medium text-white">
                {post.username}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {post.memberSince}
              </p>
              <p className="text-[11px] text-gray-600">
                {post.joinDate.replace("Joined ", "")}
              </p>
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-1.5">
            <p className="text-[11px] text-gray-500">{post.timestamp}</p>
            {isAuthenticated ? (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-medium text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Quote
                </button>
                <button
                  type="button"
                  className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-medium text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Reply
                </button>
              </div>
            ) : (
              <Link
                href={loginHref}
                className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-medium text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
              >
                Log in to join the discussion.
              </Link>
            )}
          </div>

          <p className="max-w-4xl text-[0.9rem] leading-6 text-gray-300">
            {post.content}
          </p>

          <div className="mt-2 border-t border-white/10 pt-1.5">
            <ForumRecognitionBar
              recognitions={post.reactions}
              isAuthenticated={isAuthenticated}
              loginHref={loginHref}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
