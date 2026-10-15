const PROFILE_PHOTO_BUCKET = "profile-photos";
const PUBLIC_PHOTO_PATH = `/storage/v1/object/public/${PROFILE_PHOTO_BUCKET}/`;

export function getProfilePhotoObjectPath(
  value: string | null,
): string | null {
  if (!value) return null;

  const publicPathIndex = value.indexOf(PUBLIC_PHOTO_PATH);
  const rawPath =
    publicPathIndex >= 0
      ? value.slice(publicPathIndex + PUBLIC_PHOTO_PATH.length)
      : value;

  let path: string;
  try {
    path = decodeURIComponent(rawPath.split(/[?#]/, 1)[0]);
  } catch {
    return null;
  }

  return /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(path)
    ? path
    : null;
}
