export type ForumThreadRevisionRecord = {
  id: string;
  threadId: string;
  version: number;
  title: string;
  body: string;
  archivedAt: string;
};

export type ForumReplyRevisionRecord = {
  id: string;
  replyId: string;
  version: number;
  body: string;
  archivedAt: string;
};

export type ForumThreadHistoryEntry = {
  version: number;
  title: string;
  body: string;
  timestamp: string;
  isCurrent: boolean;
  isOriginal: boolean;
};

export type ForumReplyHistoryEntry = {
  version: number;
  body: string;
  timestamp: string;
  isCurrent: boolean;
  isOriginal: boolean;
};

type BuildThreadHistoryInput = {
  currentVersion: number;
  currentTitle: string;
  currentBody: string;
  currentTimestamp: string;
  revisions: ForumThreadRevisionRecord[];
};

type BuildReplyHistoryInput = {
  currentVersion: number;
  currentBody: string;
  currentTimestamp: string;
  revisions: ForumReplyRevisionRecord[];
};

function compareVersionDescending(first: number, second: number) {
  return second - first;
}

/**
 * Build a newest-first revision history that includes the live current version
 * plus archived prior versions. The lowest version is marked as original.
 */
export function buildForumThreadHistory({
  currentVersion,
  currentTitle,
  currentBody,
  currentTimestamp,
  revisions,
}: BuildThreadHistoryInput): ForumThreadHistoryEntry[] {
  const archived = [...revisions]
    .filter((revision) => revision.version < currentVersion)
    .sort((first, second) =>
      compareVersionDescending(first.version, second.version),
    )
    .map((revision) => ({
      version: revision.version,
      title: revision.title,
      body: revision.body,
      timestamp: revision.archivedAt,
      isCurrent: false,
      isOriginal: false,
    }));

  const entries: ForumThreadHistoryEntry[] = [
    {
      version: currentVersion,
      title: currentTitle,
      body: currentBody,
      timestamp: currentTimestamp,
      isCurrent: true,
      isOriginal: false,
    },
    ...archived,
  ];

  const oldestVersion = Math.min(...entries.map((entry) => entry.version));

  return entries.map((entry) => ({
    ...entry,
    isOriginal: entry.version === oldestVersion,
  }));
}

export function buildForumReplyHistory({
  currentVersion,
  currentBody,
  currentTimestamp,
  revisions,
}: BuildReplyHistoryInput): ForumReplyHistoryEntry[] {
  const archived = [...revisions]
    .filter((revision) => revision.version < currentVersion)
    .sort((first, second) =>
      compareVersionDescending(first.version, second.version),
    )
    .map((revision) => ({
      version: revision.version,
      body: revision.body,
      timestamp: revision.archivedAt,
      isCurrent: false,
      isOriginal: false,
    }));

  const entries: ForumReplyHistoryEntry[] = [
    {
      version: currentVersion,
      body: currentBody,
      timestamp: currentTimestamp,
      isCurrent: true,
      isOriginal: false,
    },
    ...archived,
  ];

  const oldestVersion = Math.min(...entries.map((entry) => entry.version));

  return entries.map((entry) => ({
    ...entry,
    isOriginal: entry.version === oldestVersion,
  }));
}

export function mapThreadRevisionRow(row: {
  id: string;
  thread_id: string;
  version: number;
  title: string;
  body: string;
  archived_at: string;
}): ForumThreadRevisionRecord {
  return {
    id: row.id,
    threadId: row.thread_id,
    version: row.version,
    title: row.title,
    body: row.body,
    archivedAt: row.archived_at,
  };
}

export function mapReplyRevisionRow(row: {
  id: string;
  reply_id: string;
  version: number;
  body: string;
  archived_at: string;
}): ForumReplyRevisionRecord {
  return {
    id: row.id,
    replyId: row.reply_id,
    version: row.version,
    body: row.body,
    archivedAt: row.archived_at,
  };
}
