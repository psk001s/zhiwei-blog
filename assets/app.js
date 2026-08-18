const posts = window.BLOG_POSTS || [];
const dateFormat = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" });
const formatDate = value => dateFormat.format(new Date(`${value}T00:00:00`));

function card(post) {
  const date = new Date(`${post.date}T00:00:00`);
  return `<article class="post-card"><div class="card-date"><strong>${String(date.getDate()).padStart(2,"0")}</strong><span>${date.toLocaleDateString("zh-CN",{year:"numeric",month:"short"})}</span></div><div class="card-body"><p class="post-meta"><span>${post.category}</span> · ${post.readTime}阅读</p><h3><a href="article.html?slug=${post.slug}">${post.title}</a></h3><p>${post.summary}</p></div><a class="list-arrow" href="article.html?slug=${post.slug}" aria-label="阅读${post.title}">→</a></article>`;
}

function renderHome() {
  const grid = document.querySelector("#article-grid");
  if (!grid) return;
  document.querySelector("#featured")?.remove();
  const categories = ["全部", ...new Set(posts.map(p => p.category))];
  const filters = document.querySelector("#filters");
  filters.innerHTML = categories.map((c, i) => `<button class="${i === 0 ? "active" : ""}" data-category="${c}">${c}</button>`).join("");
  const show = category => {
    const visible = category === "全部" ? posts : posts.filter(p => p.category === category);
    grid.innerHTML = visible.map(card).join("");
    document.querySelector("#empty-state").hidden = visible.length > 0;
  };
  show("全部");
  filters.addEventListener("click", event => {
    const button = event.target.closest("button"); if (!button) return;
    filters.querySelectorAll("button").forEach(b => b.classList.toggle("active", b === button));
    show(button.dataset.category);
  });
}

function renderArticle() {
  const root = document.querySelector("#article-root");
  if (!root) return;
  const slug = new URLSearchParams(location.search).get("slug");
  const post = posts.find(item => item.slug === slug) || posts[0];
  if (!post) return;
  document.title = `${post.title} · 知微`;
  const meta = (property, content) => {
    const selector = property.startsWith("og:") || property.startsWith("article:") ? `meta[property="${property}"]` : `meta[name="${property}"]`;
    let element = document.head.querySelector(selector);
    if (!element) { element = document.createElement("meta"); element.setAttribute(property.startsWith("og:") || property.startsWith("article:") ? "property" : "name", property); document.head.append(element); }
    element.content = content;
  };
  meta("description", post.summary); meta("og:title", post.title); meta("og:description", post.summary); meta("og:image", new URL(post.cover, location.href).href); meta("article:published_time", `${post.date}T00:00:00+08:00`);
  const canonical = document.createElement("link"); canonical.rel = "canonical"; canonical.href = location.href.split("#")[0]; document.head.append(canonical);
  const structured = document.createElement("script"); structured.type = "application/ld+json";
  structured.textContent = JSON.stringify({"@context":"https://schema.org","@type":"BlogPosting",headline:post.title,description:post.summary,datePublished:post.date,image:new URL(post.cover, location.href).href,author:{"@type":"Person",name:"知微"},inLanguage:"zh-CN"}); document.head.append(structured);
  root.innerHTML = `<article><header class="article-hero"><p class="post-meta"><span>${post.category}</span></p><h1>${post.title}</h1><p>${post.summary}</p><div class="article-stats"><span>发布于 ${formatDate(post.date)}</span><span><i data-lucide="eye" aria-hidden="true"></i><b id="view-count">--</b> 次浏览</span><span>${post.readTime}阅读</span></div></header><div class="article-cover"><img src="${post.cover}" alt="${post.title}"></div><div class="article-layout"><aside><span>分享文章</span><button id="copy-link" title="复制文章链接" aria-label="复制文章链接">⌁</button></aside><div class="prose">${post.content}</div></div><section class="article-reactions" data-comment-system data-slug="${post.slug}"><button class="article-like" data-article-like type="button"><i data-lucide="heart" aria-hidden="true"></i><span>喜欢这篇文章</span><b data-article-like-count>0</b></button><div class="comments"><header><p class="eyebrow">读者评论</p><h2>留下你的想法</h2></header><form data-comment-form><label>昵称<input name="name" maxlength="30" autocomplete="nickname" required></label><label>评论<textarea name="content" minlength="2" maxlength="1000" rows="4" required></textarea></label><div><p data-comment-message role="status"></p><button class="comment-submit" type="submit">发布评论</button></div></form><div class="comment-list" data-comment-list><p class="comment-empty">正在加载评论...</p></div></div></section><nav class="article-end"><p>感谢读到这里</p><a href="index.html">继续读下一篇 →</a></nav></article>`;
  document.querySelector("#copy-link")?.addEventListener("click", async event => {
    await navigator.clipboard.writeText(location.href); event.currentTarget.textContent = "✓";
  });
  if (window.lucide) window.lucide.createIcons();
  updateViews(post.slug);
  addEventListener("scroll", () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    document.querySelector("#reading-progress").style.width = `${max > 0 ? scrollY / max * 100 : 0}%`;
  }, { passive: true });
}

async function updateViews(slug) {
  const output = document.querySelector("#view-count"); if (!output) return;
  if (["localhost", "127.0.0.1"].includes(location.hostname)) { output.textContent = "128"; return; }
  const namespace = location.hostname.replace(/[^a-z0-9]/gi, "-");
  try {
    const response = await fetch(`https://api.counterapi.dev/v1/${namespace}/${encodeURIComponent(slug)}/up`);
    if (!response.ok) throw new Error("counter unavailable");
    const data = await response.json(); output.textContent = Number(data.count ?? data.value ?? 0).toLocaleString("zh-CN");
  } catch {
    const key = `zhiwei-views-${slug}`;
    const count = Number(localStorage.getItem(key) || 0) + 1;
    localStorage.setItem(key, String(count));
    output.textContent = count.toLocaleString("zh-CN");
  }
}

document.querySelector("#year")?.replaceChildren(String(new Date().getFullYear()));
renderHome(); renderArticle();
