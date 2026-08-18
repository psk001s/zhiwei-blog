const headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, ...extraHeaders } });
}

export async function body(request) {
  try { return await request.json(); } catch { return null; }
}

export function validSlug(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,119}$/i.test(value);
}

export function validDevice(value) {
  return typeof value === "string" && /^[a-z0-9-]{16,80}$/i.test(value);
}
