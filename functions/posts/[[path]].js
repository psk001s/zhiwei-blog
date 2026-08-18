import { ARTICLE_PAGES } from "../_lib/generated-post-pages.js";

export async function onRequestGet(context) {
  const value = context.params.path;
  const encodedFilename = Array.isArray(value) ? value.join("/") : value;
  let filename = encodedFilename;
  try { filename = decodeURIComponent(encodedFilename); } catch {}
  const page = ARTICLE_PAGES[filename];
  if (!page) return new Response("Not Found", { status: 404 });

  return new Response(page, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
      "x-content-type-options": "nosniff"
    }
  });
}
