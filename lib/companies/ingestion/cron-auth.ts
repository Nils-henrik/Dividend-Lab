export function isAuthorizedCompanyIngestionCron(
  authorizationHeader: string | null,
  configuredSecret: string | undefined,
): boolean {
  const secret = configuredSecret?.trim();

  return Boolean(secret && authorizationHeader === `Bearer ${secret}`);
}
