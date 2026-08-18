import { readFile, writeFile } from "node:fs/promises";
const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");
const repository = process.env.GITHUB_REPOSITORY || "";
if (!siteUrl || !repository) throw new Error("SITE_URL and GITHUB_REPOSITORY are required");
let config = await readFile("admin/config.yml", "utf8");
await writeFile("admin/config.yml", config.replaceAll("__GITHUB_REPOSITORY__", repository).replaceAll("__SITE_URL__", siteUrl));
for (const [file, pathname] of [["index.html", ""], ["about.html", "about.html"]]) {
  let html = await readFile(file, "utf8");
  await writeFile(file, html.replace("</head>", `<link rel="canonical" href="${siteUrl}/${pathname}"></head>`));
}
const legacySlugs = ["walk-without-purpose", "reading-in-the-gaps", "make-a-small-thing"];
const legacyPosts = [
  { slug: "walk-without-purpose", title: "散步的时候，不必急着抵达", date: "2026-08-12", summary: "一条熟悉的小路，也会因为放慢脚步而显出新的纹理。" },
  { slug: "reading-in-the-gaps", title: "在缝隙里读书", date: "2026-08-04", summary: "每天二十分钟，足以让一本书在生活里慢慢展开。" },
  { slug: "make-a-small-thing", title: "先做一个很小的东西", date: "2026-07-26", summary: "开始一件事最好的方式，是允许它最初并不完整。" }
];
const generatedText = await readFile("assets/generated-posts.js", "utf8");
const generated = JSON.parse(generatedText.replace(/^window\.GENERATED_POSTS\s*=\s*/, "").replace(/;\s*$/, ""));
const urls = ["", "about.html", ...[...generated.map(post => post.slug), ...legacySlugs].map(slug => `article.html?slug=${encodeURIComponent(slug)}`)];
await writeFile("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${siteUrl}/${url.replaceAll("&", "&amp;")}</loc></url>`).join("\n")}\n</urlset>\n`);
await writeFile("robots.txt", `${await readFile("robots.txt", "utf8")}\nSitemap: ${siteUrl}/sitemap.xml\n`);
const xml = value => String(value).replace(/[<>&'"]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"})[c]);
const feedPosts = [...generated, ...legacyPosts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);
const feed = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel><title>知微</title><link>${siteUrl}</link><description>关于生活、阅读与创造的个人博客</description><language>zh-CN</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${feedPosts.map(post => `<item><title>${xml(post.title)}</title><link>${siteUrl}/article.html?slug=${xml(post.slug)}</link><guid isPermaLink="true">${siteUrl}/article.html?slug=${xml(post.slug)}</guid><pubDate>${new Date(`${post.date}T00:00:00+08:00`).toUTCString()}</pubDate><description>${xml(post.summary)}</description></item>`).join("")}</channel></rss>`;
await writeFile("feed.xml", feed);
