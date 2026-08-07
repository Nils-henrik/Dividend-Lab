type CanEditForumContentInput = {
  isDemoContent?: boolean;
  isAuthenticated?: boolean;
  currentUserId?: string | null;
  authorUserId?: string | null;
};

/**
 * Authors may edit only their own persisted forum content.
 * Demo/internal preview content is never editable as real data.
 */
export function canEditForumContent({
  isDemoContent = false,
  isAuthenticated = false,
  currentUserId = null,
  authorUserId = null,
}: CanEditForumContentInput) {
  if (isDemoContent || !isAuthenticated) {
    return false;
  }

  if (!currentUserId || !authorUserId) {
    return false;
  }

  return currentUserId === authorUserId;
}
