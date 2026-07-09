export const FORUM_VISITED_STORAGE_KEY = "divlab_onboarding_forum_visited";

const FORUM_VISITED_EVENT = "divlab-forum-visited";

export function markForumVisited() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(FORUM_VISITED_STORAGE_KEY, "true");
  window.dispatchEvent(new Event(FORUM_VISITED_EVENT));
}

export function hasVisitedForum() {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(FORUM_VISITED_STORAGE_KEY) === "true";
}

export function subscribeForumVisited(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("focus", onStoreChange);
  window.addEventListener(FORUM_VISITED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("focus", onStoreChange);
    window.removeEventListener(FORUM_VISITED_EVENT, onStoreChange);
  };
}
