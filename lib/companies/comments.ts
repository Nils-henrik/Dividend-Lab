export const COMPANY_COMMENT_MAX_LENGTH = 2000;
export const COMPANY_COMMENT_PAGE_SIZE = 50;

export type CompanyCommentActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type CompanyComment = {
  id: string;
  companyId: string;
  userId: string;
  body: string;
  createdAt: string;
  username: string | null;
  displayName: string;
  initials: string;
  avatarUrl: string | null;
};

export function validateCompanyCommentBody(body: string) {
  const normalizedBody = body.trim();

  if (!normalizedBody) {
    return {
      body: "",
      error: "Skriv en kommentar innan du publicerar.",
    };
  }

  if (normalizedBody.length > COMPANY_COMMENT_MAX_LENGTH) {
    return {
      body: "",
      error: `Kommentaren får vara högst ${COMPANY_COMMENT_MAX_LENGTH} tecken.`,
    };
  }

  return {
    body: normalizedBody,
    error: null,
  };
}
