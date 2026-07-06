import { forumDiscussions } from "@/data/dashboard";

export default function ForumPreview() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">
          Latest Discussions
        </h2>
        <p className="mt-2 text-sm text-gray-400">
          Thoughtful conversations from the community.
        </p>
      </div>

      <div className="space-y-3">
        {forumDiscussions.map((discussion) => (
          <div
            key={discussion.title}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-sm font-medium leading-6 text-white">
              {discussion.title}
            </p>
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>{discussion.replies} replies</span>
              <span>{discussion.activity}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
