import { json } from "../../_lib/response.js";

export async function onRequestGet({ env }) {
  const comments = await env.COMMENTS_DB.prepare(`
    SELECT c.id, c.slug, c.name, c.content, c.created_at, COUNT(cl.device_id) AS likes
    FROM comments c LEFT JOIN comment_likes cl ON cl.comment_id = c.id
    GROUP BY c.id ORDER BY c.created_at DESC LIMIT 500
  `).all();
  return json({ comments: comments.results });
}

export async function onRequestDelete({ request, env }) {
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return json({ error: "无效的评论" }, 400);
  await env.COMMENTS_DB.batch([
    env.COMMENTS_DB.prepare("DELETE FROM comment_likes WHERE comment_id = ?").bind(id),
    env.COMMENTS_DB.prepare("DELETE FROM comments WHERE id = ?").bind(id)
  ]);
  return json({ ok: true });
}
