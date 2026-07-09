export const LEARNING_COMMENT_MAX_LENGTH = 2000;

export type LearningCommentActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type LearningArticleComment = {
  id: string;
  articleSlug: string;
  userId: string;
  body: string;
  createdAt: string;
  username: string;
};

export type LearningCommentRecord = {
  id: string;
  article_slug: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles:
    | {
        username: string | null;
      }
    | {
        username: string | null;
      }[]
    | null;
};
