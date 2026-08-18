import { json } from "../../_lib/response.js";

function authorized(request, env) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  try {
    const decoded = atob(header.slice(6));
    return decoded.startsWith("admin:") && decoded.slice(6) === env.COMMENT_ADMIN_PASSWORD;
  } catch { return false; }
}

function denied() {
  return json({ error: "管理密码不正确" }, 401, { "www-authenticate": "Basic realm=comment-admin" });
}

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) return denied();
  const comments = await env.COMMENTS_DB.prepare(`
    SELECT c.id, c.slug, c.name, c.content, c.created_at, COUNT(cl.device_id) AS likes
    FROM comments c LEFT JOIN comment_likes cl ON cl.comment_id = c.id
    GROUP BY c.id ORDER BY c.created_at DESC LIMIT 500
  `).all();
  return json({ comments: comments.results });
}

export async function onRequestDelete({ request, env }) {
  if (!authorized(request, env)) return denied();
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return json({ error: "无效的评论" }, 400);
  await env.COMMENTS_DB.batch([
    env.COMMENTS_DB.prepare("DELETE FROM comment_likes WHERE comment_id = ?").bind(id),
    env.COMMENTS_DB.prepare("DELETE FROM comments WHERE id = ?").bind(id)
  ]);
  return json({ ok: true });
}
