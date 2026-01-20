const hostname = window.location.hostname;
const isLocal = true; // Force true
const defaultApiUrl = "http://localhost:3000";

console.log("API Config (FORCED):", { hostname, isLocal, defaultApiUrl });

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
}

async function request<T>(
  path: string,
  options: RequestInit,
  token: string
): Promise<ApiResult<T>> {
  if (!token || typeof token !== "string" || !token.trim()) {
    return { data: null, error: "Token no definido o vacío" };
  }

  // console.log("Sending request to", path, "with token:", `"${token}"`);

  try {
    const res = await fetch(`${defaultApiUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.trim()}`
      }
    });

    if (!res.ok) {
      const text = await res.text();
      return { data: null, error: text || `Error ${res.status}` };
    }

    const json = (await res.json()) as T;
    return { data: json, error: null };
  } catch {
    return { data: null, error: "Error de red" };
  }
}

export function getWithAuth<T>(path: string, token: string) {
  return request<T>(path, { method: "GET" }, token);
}

export function postWithAuth<T>(path: string, body: unknown, token: string) {
  return request<T>(
    path,
    { method: "POST", body: JSON.stringify(body) },
    token
  );
}

export function deleteWithAuth<T>(path: string, token: string) {
  return request<T>(path, { method: "DELETE" }, token);
}

