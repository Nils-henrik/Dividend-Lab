export type GlobalSearchResultType = "user" | "forum" | "learning";

export type GlobalSearchResult = {
  id: string;
  type: GlobalSearchResultType;
  title: string;
  subtitle?: string;
  href: string;
  preview?: string;
};

export type GlobalSearchResults = {
  users: GlobalSearchResult[];
  forum: GlobalSearchResult[];
  learning: GlobalSearchResult[];
};

export const EMPTY_GLOBAL_SEARCH_RESULTS: GlobalSearchResults = {
  users: [],
  forum: [],
  learning: [],
};

export const GLOBAL_SEARCH_MIN_LENGTH = 2;
export const GLOBAL_SEARCH_DEBOUNCE_MS = 320;
export const GLOBAL_SEARCH_LIMIT_PER_GROUP = 5;
