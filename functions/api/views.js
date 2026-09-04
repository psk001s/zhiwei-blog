import { body, json, validDevice, validSlug } from "../_lib/response.js";

async function ensureTable(database) {
  await database.prepare(`
    CREATE TABLE IF NOT EXISTS article_views (
      slug TEXT NOT NULL,
      device_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      PRIMARY KEY (slug, device_id)
    )
  `).run();
}

export async function onRequestPost({ request, env }) {
  const data = await body(request);
  if (!data || !validSlug(data.slug) || !validDevice(data.deviceId)) {
    return json({ error: "请求信息不完整" }, 400);
  }

  await ensureTable(env.COMMENTS_DB);
  await env.COMMENTS_DB.prepare(
    "INSERT OR IGNORE INTO article_views (slug, device_id) VALUES (?, ?)"
  ).bind(data.slug, data.deviceId).run();
  const result = await env.COMMENTS_DB.prepare(
    "SELECT COUNT(*) AS views FROM article_views WHERE slug = ? AND device_id NOT LIKE 'codex-view-test-%'"
  ).bind(data.slug).first();

  return json({ views: Number(result?.views || 0) });
}
