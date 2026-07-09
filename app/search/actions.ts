"use server";

import { globalSearch } from "@/lib/search/global-search";
import {
  EMPTY_GLOBAL_SEARCH_RESULTS,
  GLOBAL_SEARCH_MIN_LENGTH,
} from "@/lib/search/types";

export async function globalSearchAction(query: string) {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < GLOBAL_SEARCH_MIN_LENGTH) {
    return EMPTY_GLOBAL_SEARCH_RESULTS;
  }

  try {
    return await globalSearch(trimmedQuery);
  } catch {
    return EMPTY_GLOBAL_SEARCH_RESULTS;
  }
}
