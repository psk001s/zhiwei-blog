import { readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const sourceDir = path.resolve("content/posts");
const outputFile = path.resolve("assets/generated-posts.js");
const articleTemplateFile = path.resolve("article.html");
const articlePagesModule = path.resolve("functions/_lib/generated-post-pages.js");
const aboutPageFile = path.resolve("about.html");

function frontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("文章缺少 YAML frontmatter");
  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([\w-]+):\s*(.*)$/); if (!field) continue;
    let value = field[2].trim().replace(/^['"]|['"]$/g, "");
    data[field[1]] = value === "true" ? true : value === "false" ? false : value;
  }
  return { data, body: match[2] };
}

const escape = text => text.replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]);
const escapeAttribute = text => escape(String(text)).replace(/"/g, "&quot;");
function markdown(source) {
  return escape(source).replace(/^### (.*)$/gm, "<h3>$1</h3>").replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure><img src="$2" alt="$1" loading="lazy"><figcaption>$1</figcaption></figure>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>').replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>")
    .split(/\n{2,}/).map(block => /^<(h[23]|blockquote|figure)/.test(block) ? block : `<p>${block.replace(/\n/g, "<br>")}</p>`).join("");
}

const posts = [];
if (existsSync(sourceDir)) {
  const files = (await readdir(sourceDir)).filter(name => name.endsWith(".md")).sort((a, b) => a.localeCompare(b, "zh-CN"));
  for (const file of files) {
    const { data, body } = frontmatter(await readFile(path.join(sourceDir, file), "utf8"));
    if (data.draft === true) continue;
    const date = String(data.date || file.slice(0, 10)).slice(0, 10);
    const category = data.category || "随笔";
    const tags = String(data.tags || category).split(/[,，|]/).map(tag => tag.trim()).filter(Boolean);
    const slug = String(posts.length + 1);
    const legacySlug = file.replace(/\.md$/, "");
    posts.push({ slug, legacySlug, url: `posts/${slug}.html`, title: data.title, category, tags, date, readTime: `${Math.max(1, Math.ceil(body.length / 500))} 分钟`, summary: data.summary || "", cover: data.cover || "", content: markdown(body) });
  }
}
posts.sort((a, b) => b.date.localeCompare(a.date));
await writeFile(outputFile, `window.GENERATED_POSTS = ${JSON.stringify(posts, null, 2)};\n`);

const articleTemplate = await readFile(articleTemplateFile, "utf8");
const articlePages = {};
for (const post of posts) {
  const page = articleTemplate
    .replace("<head>", '<head>\n  <base href="../">')
    .replace("<title>文章 · 庞胜凯的个人博客</title>", `<title>${escape(post.title)} · 庞胜凯的个人博客</title>`)
    .replace('<body class="article-page">', `<body class="article-page" data-post-slug="${escapeAttribute(post.slug)}">`)
    .replace('<meta name="robots"', `<meta name="description" content="${escapeAttribute(post.summary)}"><meta name="robots"`)
    .replace('<meta property="og:type"', `<meta property="og:title" content="${escapeAttribute(post.title)}"><meta property="og:description" content="${escapeAttribute(post.summary)}"><meta property="og:type"`);
  articlePages[`${post.slug}.html`] = page;
  articlePages[`${post.legacySlug}.html`] = page;
}
await writeFile(articlePagesModule, `export const ARTICLE_PAGES = ${JSON.stringify(articlePages, null, 2)};\n`);
if (existsSync("content/site.yml")) {
  const site = {};
  for (const line of (await readFile("content/site.yml", "utf8")).split(/\r?\n/)) {
    const field = line.match(/^([\w-]+):\s*(.*)$/); if (!field) continue;
    site[field[1]] = field[2].trim().replace(/^['"]|['"]$/g, "");
  }
  await writeFile("assets/site-config.js", `window.SITE_CONFIG = ${JSON.stringify(site, null, 2)};\n`);
}
if (existsSync("content/about.yml")) {
  const about = {};
  for (const line of (await readFile("content/about.yml", "utf8")).split(/\r?\n/)) {
    const field = line.match(/^([\w-]+):\s*(.*)$/); if (!field) continue;
    about[field[1]] = field[2].trim().replace(/^['"]|['"]$/g, "");
  }
  await writeFile("assets/about-config.js", `window.ABOUT_CONFIG = ${JSON.stringify(about, null, 2)};\n`);
  if (existsSync(aboutPageFile) && about.image) {
    let aboutPage = await readFile(aboutPageFile, "utf8");
    const imageAlt = about.imageAlt || "关于我";
    aboutPage = aboutPage.replace(
      /(<img\s+data-about-image\s+src=")[^"]*("\s+alt=")[^"]*(")/,
      `$1${escapeAttribute(about.image)}$2${escapeAttribute(imageAlt)}$3`
    );
    if (about.wechatQr) {
      const wechatAlt = about.wechatQrAlt || "微信二维码";
      aboutPage = aboutPage.replace(
        /(<img\s+data-about-wechat\s+src=")[^"]*("\s+alt=")[^"]*(")/,
        `$1${escapeAttribute(about.wechatQr)}$2${escapeAttribute(wechatAlt)}$3`
      );
    }
    await writeFile(aboutPageFile, aboutPage);
  }
}
if (existsSync("content/friend-links.json")) {
  const friendLinks = JSON.parse(await readFile("content/friend-links.json", "utf8"));
  await writeFile("assets/friend-links-config.js", `window.FRIEND_LINKS_CONFIG = ${JSON.stringify(friendLinks, null, 2)};\n`);
}
console.log(`Built ${posts.length} managed post(s).`);
