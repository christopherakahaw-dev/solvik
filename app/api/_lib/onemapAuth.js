// Shared OneMap token fetch + in-memory cache. OneMap's routing and other
// authenticated endpoints need a bearer token obtained from a registered
// account (https://www.onemap.gov.sg/apidocs/register). Search/reverse-geocode
// do not need auth, so only routing goes through this.
let cached = null; // { token, expiresAt }

function envValue(name) {
  const value = process.env[name];
  if (!value) return "";
  const trimmed = String(value).trim();
  return trimmed.replace(/^(['"])(.*)\1$/, "$2").trim();
}

export async function getOneMapToken() {
  const configuredToken = envValue("ONEMAP_TOKEN");
  if (configuredToken) return configuredToken;

  const email = envValue("ONEMAP_EMAIL");
  const password = envValue("ONEMAP_PASSWORD");
  if (!email || !password) {
    throw new Error(
      "OneMap credentials are not configured. Set ONEMAP_TOKEN, or ONEMAP_EMAIL + ONEMAP_PASSWORD, as environment variables."
    );
  }

  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const res = await fetch("https://www.onemap.gov.sg/api/auth/post/getToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`OneMap token request failed (${res.status})`);
  }
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("OneMap token response did not include access_token");
  }
  // expiry_timestamp is a unix seconds string
  const expiresAt = data.expiry_timestamp ? Number(data.expiry_timestamp) * 1000 : Date.now() + 3 * 60 * 60 * 1000;
  cached = { token: data.access_token, expiresAt };
  return cached.token;
}
