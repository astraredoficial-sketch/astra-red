export function isMissingAuthSessionError(
  error: { name?: string } | null | undefined,
): boolean {
  return error?.name === "AuthSessionMissingError";
}
