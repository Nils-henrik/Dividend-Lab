export function isCompanySchemaUnavailable(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("company_follows") ||
    error.message?.includes("company_documents") ||
    error.message?.includes("companies")
  );
}

export function companyDocumentQueryFailure(
  error: { code?: string; message?: string } | null,
): "ok" | "schema_unavailable" {
  if (!error) {
    return "ok";
  }

  if (isCompanySchemaUnavailable(error)) {
    return "schema_unavailable";
  }

  throw new Error(error.message);
}
