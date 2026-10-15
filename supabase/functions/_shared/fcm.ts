type ServiceAccount = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
};

let cachedToken: string | null = null;
let cachedTokenExpiresAt = 0;

function encodeBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function encodeJsonBase64Url(value: unknown) {
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(value)));
}

function decodePrivateKey(pem: string) {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function createAccessToken(account: ServiceAccount) {
  if (
    cachedToken &&
    Date.now() < cachedTokenExpiresAt - 60_000
  ) {
    return cachedToken;
  }
  if (!account.client_email || !account.private_key) {
    throw new Error("La cuenta de servicio FCM no contiene sus campos requeridos.");
  }

  const now = Math.floor(Date.now() / 1000);
  const unsignedToken = [
    encodeJsonBase64Url({ alg: "RS256", typ: "JWT" }),
    encodeJsonBase64Url({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ].join(".");
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    decodePrivateKey(account.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(unsignedToken),
  );
  const assertion = `${unsignedToken}.${encodeBase64Url(new Uint8Array(signature))}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google OAuth rechazó la cuenta de servicio: ${details}`);
  }

  const result: unknown = await response.json();
  if (
    !result ||
    typeof result !== "object" ||
    !("access_token" in result) ||
    typeof result.access_token !== "string" ||
    !("expires_in" in result) ||
    typeof result.expires_in !== "number"
  ) {
    throw new Error("Google OAuth devolvió una respuesta inválida.");
  }
  cachedToken = result.access_token;
  cachedTokenExpiresAt = Date.now() + result.expires_in * 1000;
  return cachedToken;
}

export async function sendFcmNotification(
  serviceAccountJson: string,
  token: string,
  title: string,
  body: string,
  href: string,
  eventType: string,
) {
  let account: ServiceAccount;
  try {
    account = JSON.parse(serviceAccountJson) as ServiceAccount;
  } catch (cause) {
    console.error("FCM_SERVICE_ACCOUNT_JSON no contiene JSON válido:", cause);
    throw new Error("La cuenta de servicio FCM no es válida.");
  }
  if (!account.project_id) {
    throw new Error("La cuenta de servicio FCM no contiene project_id.");
  }

  const accessToken = await createAccessToken(account);
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { href, event_type: eventType },
          android: { priority: "HIGH" },
        },
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`FCM respondió ${response.status}: ${details}`);
  }
}
