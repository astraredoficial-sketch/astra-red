import { getProfilePhotoObjectPath } from "@/lib/profilePhotos";
import { authenticateProfilePhotoRequest } from "@/lib/profilePhotosServer";

const MAX_SIGNED_PHOTOS = 1000;
const SIGNED_URL_LIFETIME_SECONDS = 60 * 60;

export async function POST(request: Request) {
  try {
    const authenticated = await authenticateProfilePhotoRequest(
      request.headers.get("authorization"),
    );
    if (!authenticated) {
      return Response.json({ error: "Inicia sesión para ver las fotos." }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "La solicitud no es válida." }, { status: 400 });
    }

    if (
      !body ||
      typeof body !== "object" ||
      !("paths" in body) ||
      !Array.isArray(body.paths) ||
      body.paths.length > MAX_SIGNED_PHOTOS ||
      !body.paths.every((path) => typeof path === "string")
    ) {
      return Response.json({ error: "La lista de fotos no es válida." }, { status: 400 });
    }

    const requestedPaths = [...new Set(body.paths as string[])];
    if (requestedPaths.length === 0) {
      return Response.json({ signedUrls: [] });
    }
    if (
      requestedPaths.some(
        (path) => getProfilePhotoObjectPath(path) !== path,
      )
    ) {
      return Response.json({ error: "La ruta de una foto no es válida." }, { status: 400 });
    }

    const { data: profiles, error: profilesError } = await authenticated.admin
      .from("profiles")
      .select("avatar_url")
      .not("avatar_url", "is", null);
    if (profilesError) {
      console.error("No se pudieron validar las rutas de fotos:", profilesError);
      return Response.json(
        { error: "No se pudieron validar las fotos del perfil." },
        { status: 500 },
      );
    }

    const storedPaths = new Set(
      profiles
        .map((profile) => getProfilePhotoObjectPath(profile.avatar_url))
        .filter((path): path is string => path !== null),
    );
    if (requestedPaths.some((path) => !storedPaths.has(path))) {
      return Response.json(
        { error: "No tienes permiso para solicitar una de estas fotos." },
        { status: 403 },
      );
    }

    const { data: signedPhotos, error: signingError } = await authenticated.admin.storage
      .from("profile-photos")
      .createSignedUrls(requestedPaths, SIGNED_URL_LIFETIME_SECONDS);
    if (signingError) {
      console.error("No se pudieron crear enlaces de fotos:", signingError);
      return Response.json(
        { error: "No se pudieron preparar las fotos para mostrarlas." },
        { status: 500 },
      );
    }

    const signedUrls = signedPhotos.flatMap((photo) =>
      photo.path && photo.signedUrl && !photo.error
        ? [{ path: photo.path, url: photo.signedUrl }]
        : [],
    );
    if (signedUrls.length !== requestedPaths.length) {
      console.error("Supabase no pudo firmar todas las fotos solicitadas.");
      return Response.json(
        { error: "No se pudieron preparar todas las fotos para mostrarlas." },
        { status: 500 },
      );
    }

    return Response.json({ signedUrls });
  } catch (error) {
    console.error("Falló la creación de enlaces para fotos de perfil:", error);
    return Response.json(
      { error: "El servidor no pudo preparar las fotos de perfil." },
      { status: 500 },
    );
  }
}
