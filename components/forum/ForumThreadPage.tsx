import {
  getForumPosts,
  getForumThread,
  getForumThreadCategory,
} from "@/data/forum";
import ForumBreadcrumbs from "./ForumBreadcrumbs";
import ForumPost from "./ForumPost";
import ForumRightSidebar from "./ForumRightSidebar";
import ForumShareButton from "./ForumShareButton";
import ForumSidebar from "./ForumSidebar";

type Props = {
  threadId: string;
};

export default function ForumThreadPage({ threadId }: Props) {
  const thread = getForumThread(threadId);
  const posts = getForumPosts(thread.slug);
  const category = getForumThreadCategory(thread);

  return (
    <div className="space-y-2.5">
      <ForumBreadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          { label: category.groupName, href: `/forum?category=${category.slug}` },
          { label: category.name, href: `/forum?category=${category.slug}` },
          { label: thread.title },
        ]}
      />

      <div className="grid gap-3 2xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <ForumSidebar activeCategorySlug={category.slug} />

        <main className="space-y-2">
          <section className="rounded-md border border-white/10 bg-[#111111]/85 px-3 py-2.5">
            <div className="mb-1.5 flex flex-wrap items-center gap-1">
              {thread.sticky && (
                <span className="rounded border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#D4AF37]">
                  Sticky
                </span>
              )}
              <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-gray-500">
                {thread.category}
              </span>
              {thread.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex flex-col justify-between gap-2 xl:flex-row xl:items-start">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">
                  {thread.title}
                </h2>
                <p className="mt-1 max-w-4xl text-xs leading-5 text-gray-500">
                  {thread.excerpt}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                <span className="tabular-nums">{thread.replies} replies</span>
                <span>·</span>
                <span className="tabular-nums">{thread.views} views</span>
                <span>·</span>
                <span className="text-[#D4AF37] tabular-nums">
                  {thread.qualityScore} quality
                </span>
                <span>·</span>
                <span>{thread.lastActivity}</span>
                <ForumShareButton />
              </div>
            </div>
          </section>

          <section className="rounded-md border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-3 py-2">
            <p className="text-[11px] leading-5 text-gray-300">
              Future action: Ask Dividend Brain about this discussion. This
              structure is prepared for AI recommendations and analysis, but no
              AI functionality is implemented yet.
            </p>
          </section>

          {posts.map((post) => (
            <ForumPost key={post.id} post={post} />
          ))}
        </main>

        <ForumRightSidebar />
      </div>
    </div>
  );
}
