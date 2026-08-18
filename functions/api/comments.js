import { body, json, validDevice, validSlug } from "../_lib/response.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const deviceId = url.searchParams.get("deviceId") || "";
  if (!validSlug(slug)) return json({ error: "无效的文章标识" }, 400);

  const comments = await env.COMMENTS_DB.prepare(`
    SELECT c.id, c.name, c.content, c.created_at,
      COUNT(cl.device_id) AS likes,
      MAX(CASE WHEN cl.device_id = ? THEN 1 ELSE 0 END) AS liked
    FROM comments c LEFT JOIN comment_likes cl ON cl.comment_id = c.id
    WHERE c.slug = ? GROUP BY c.id ORDER BY c.created_at DESC LIMIT 200
  `).bind(validDevice(deviceId) ? deviceId : "", slug).all();
  const articleLikes = await env.COMMENTS_DB.prepare(`
    SELECT COUNT(*) AS likes, MAX(CASE WHEN device_id = ? THEN 1 ELSE 0 END) AS liked
    FROM article_likes WHERE slug = ?
  `).bind(validDevice(deviceId) ? deviceId : "", slug).first();

  return json({ comments: comments.results, articleLikes: Number(articleLikes?.likes || 0), articleLiked: Boolean(articleLikes?.liked) });
}

export async function onRequestPost({ request, env }) {
  const data = await body(request);
  if (!data || !validSlug(data.slug) || !validDevice(data.deviceId)) return json({ error: "请求信息不完整" }, 400);

  if (data.action === "comment") {
    const name = String(data.name || "").trim();
    const content = String(data.content || "").trim();
    const startedAt = Number(data.startedAt || 0);
    if (String(data.website || "").trim()) return json({ ok: true }, 201);
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < 3000) return json({ error: "提交过快，请稍后再试" }, 400);
    if (name.length < 1 || name.length > 30) return json({ error: "昵称需为 1 至 30 个字符" }, 400);
    if (content.length < 2 || content.length > 1000) return json({ error: "评论需为 2 至 1000 个字符" }, 400);
    if ((content.match(/https?:\/\//gi) || []).length > 2) return json({ error: "评论中的链接过多" }, 400);
    const recent = await env.COMMENTS_DB.prepare("SELECT COUNT(*) AS count FROM comments WHERE device_id = ? AND julianday(created_at) > julianday('now', '-1 hour')").bind(data.deviceId).first();
    if (Number(recent?.count || 0) >= 5) return json({ error: "发布较频繁，请稍后再试" }, 429);
    const duplicate = await env.COMMENTS_DB.prepare("SELECT id FROM comments WHERE device_id = ? AND content = ? AND julianday(created_at) > julianday('now', '-1 day') LIMIT 1").bind(data.deviceId, content).first();
    if (duplicate) return json({ error: "请不要重复发布相同评论" }, 409);
    await env.COMMENTS_DB.prepare("INSERT INTO comments (slug, name, content, device_id) VALUES (?, ?, ?, ?)").bind(data.slug, name, content, data.deviceId).run();
    return json({ ok: true }, 201);
  }

  if (data.action === "like-article") {
    const result = await env.COMMENTS_DB.prepare("INSERT OR IGNORE INTO article_likes (slug, device_id) VALUES (?, ?)").bind(data.slug, data.deviceId).run();
    return json({ ok: true, added: Boolean(result.meta.changes) });
  }

  if (data.action === "like-comment") {
    const commentId = Number(data.commentId);
    if (!Number.isInteger(commentId) || commentId < 1) return json({ error: "无效的评论" }, 400);
    const result = await env.COMMENTS_DB.prepare("INSERT OR IGNORE INTO comment_likes (comment_id, device_id) SELECT id, ? FROM comments WHERE id = ? AND slug = ?").bind(data.deviceId, commentId, data.slug).run();
    return json({ ok: true, added: Boolean(result.meta.changes) });
  }

  return json({ error: "不支持的操作" }, 400);
}
