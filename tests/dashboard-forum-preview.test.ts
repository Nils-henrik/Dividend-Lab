import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("dashboard forum preview", () => {
  it("uses the live limited forum activity query instead of hard-coded dashboard conversations", () => {
    const preview = readFileSync(
      join(root, "components/dashboard/ForumPreview.tsx"),
      "utf8",
    );
    const dashboardData = readFileSync(
      join(root, "data/dashboard.ts"),
      "utf8",
    );
    const dashboardPage = readFileSync(
      join(root, "app/dashboard/page.tsx"),
      "utf8",
    );
    const dashboardQueries = readFileSync(
      join(root, "lib/forum/dashboard-queries.ts"),
      "utf8",
    );

    assert.doesNotMatch(preview, /forumDiscussions/);
    assert.doesNotMatch(dashboardData, /export const forumDiscussions/);
    assert.match(dashboardPage, /getDashboardForumThreadsByLatestActivity\(5\)/);
    assert.match(
      dashboardQueries,
      /get_forum_threads_by_latest_activity/,
    );
    assert.match(preview, /Inga diskussioner ännu\./);
  });
});
