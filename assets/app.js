const posts = window.BLOG_POSTS || [];
const dateFormat = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
const formatDate = (value) => dateFormat.format(new Date(`${value}T00:00:00`));

function card(post) {
  const date = new Date(`${post.date}T00:00:00`);
  const tags = Array.isArray(post.tags) ? post.tags : [post.category];
  const url = post.url || `posts/${encodeURIComponent(post.slug)}.html`;
  return `<article class="post-card"><div class="card-date"><strong>${String(date.getDate()).padStart(2, "0")}</strong><span>${date.toLocaleDateString("zh-CN", { year: "numeric", month: "short" })}</span></div><div class="card-body"><p class="post-meta"><span>${post.category}</span> · ${post.readTime}阅读</p><h3><a href="${url}">${post.title}</a></h3><p>${post.summary}</p><div class="post-tags">${tags.map((tag) => `<span>#${tag}</span>`).join("")}</div></div><a class="list-arrow" href="${url}" aria-label="阅读${post.title}">→</a></article>`;
}

function renderHome() {
  const grid = document.querySelector("#article-grid");
  if (!grid) return;
  document.querySelector("#featured")?.remove();
  const categories = [
    "全部",
    ...new Set(
      posts.flatMap((p) => (Array.isArray(p.tags) ? p.tags : [p.category])),
    ),
  ];
  const filters = document.querySelector("#filters");
  const search = document.querySelector("#article-search");
  const archive = document.querySelector("#archive-filter");
  const months = [...new Set(posts.map((post) => post.date.slice(0, 7)))];
  archive.innerHTML = `<option value="">所有月份</option>${months.map((month) => `<option value="${month}">${new Date(`${month}-01T00:00:00`).toLocaleDateString("zh-CN", { year: "numeric", month: "long" })}</option>`).join("")}`;
  filters.innerHTML = categories
    .map(
      (c, i) =>
        `<button class="${i === 0 ? "active" : ""}" data-category="${c}">${c}</button>`,
    )
    .join("");
  let selectedCategory = "全部";
  const show = () => {
    const query = search.value.trim().toLocaleLowerCase("zh-CN");
    const month = archive.value;
    const visible = posts.filter((post) => {
      const tags = Array.isArray(post.tags) ? post.tags : [post.category];
      const matchesCategory =
        selectedCategory === "全部" || tags.includes(selectedCategory);
      const matchesMonth = !month || post.date.startsWith(month);
      const searchable = [post.title, post.summary, post.category, ...tags]
        .join(" ")
        .toLocaleLowerCase("zh-CN");
      return (
        matchesCategory &&
        matchesMonth &&
        (!query || searchable.includes(query))
      );
    });
    grid.innerHTML = visible.map(card).join("");
    document.querySelector("#empty-state").hidden = visible.length > 0;
  };
  show();
  filters.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    filters
      .querySelectorAll("button")
      .forEach((b) => b.classList.toggle("active", b === button));
    selectedCategory = button.dataset.category;
    show();
  });
  search.addEventListener("input", show);
  archive.addEventListener("change", show);
}

function renderArticle() {
  const root = document.querySelector("#article-root");
  if (!root) return;
  const slug =
    document.body.dataset.postSlug ||
    new URLSearchParams(location.search).get("slug");
  const post =
    posts.find((item) => item.slug === slug || item.legacySlug === slug) ||
    posts[0];
  if (!post) return;
  const site = window.SITE_CONFIG || {};
  const siteName = site.name || "庞胜凯的个人博客";
  const authorName = site.authorName || "庞胜凯";
  document.title = `${post.title} · ${siteName}`;
  const meta = (property, content) => {
    const selector =
      property.startsWith("og:") || property.startsWith("article:")
        ? `meta[property="${property}"]`
        : `meta[name="${property}"]`;
    let element = document.head.querySelector(selector);
    if (!element) {
      element = document.createElement("meta");
      element.setAttribute(
        property.startsWith("og:") || property.startsWith("article:")
          ? "property"
          : "name",
        property,
      );
      document.head.append(element);
    }
    element.content = content;
  };
  meta("description", post.summary);
  meta("og:title", post.title);
  meta("og:description", post.summary);
  if (post.cover) meta("og:image", new URL(post.cover, location.href).href);
  meta("article:published_time", `${post.date}T00:00:00+08:00`);
  const canonical = document.createElement("link");
  canonical.rel = "canonical";
  canonical.href = location.href.split("#")[0];
  document.head.append(canonical);
  const structured = document.createElement("script");
  structured.type = "application/ld+json";
  structured.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    ...(post.cover ? { image: new URL(post.cover, location.href).href } : {}),
    author: { "@type": "Person", name: authorName },
    publisher: { "@type": "Organization", name: siteName },
    inLanguage: "zh-CN",
  });
  document.head.append(structured);
  root.innerHTML = `<article><header class="article-hero"><p class="post-meta"><span>${post.category}</span></p><h1>${post.title}</h1>${post.summary ? `<p>${post.summary}</p>` : ""}<div class="article-stats"><span>发布于 ${formatDate(post.date)}</span><span><i data-lucide="eye" aria-hidden="true"></i><b id="view-count">--</b> 次浏览</span><span>${post.readTime}阅读</span></div></header><div class="article-layout"><aside><span>分享文章</span><button id="copy-link" title="复制文章链接" aria-label="复制文章链接"><i data-lucide="link" aria-hidden="true"></i></button></aside><div class="prose">${post.content}</div></div><section class="article-reactions" data-comment-system data-slug="${post.slug}"><div class="article-action-row"><button class="article-like" data-article-like type="button"><i data-lucide="heart" aria-hidden="true"></i><span>喜欢这篇文章</span><b data-article-like-count>0</b></button><button class="article-share" id="share-article" type="button"><i data-lucide="share-2" aria-hidden="true"></i><span>转发文章</span></button></div><p class="share-message" id="share-message" role="status"></p><div class="comments"><header><p class="eyebrow">读者评论</p><h2>留下你的想法</h2></header><form data-comment-form><label>昵称<input name="name" maxlength="30" autocomplete="nickname" required></label><label>评论<textarea name="content" minlength="2" maxlength="1000" rows="4" required></textarea></label><label class="comment-trap" aria-hidden="true">网站<input name="website" tabindex="-1" autocomplete="off"></label><div><p data-comment-message role="status"></p><button class="comment-submit" type="submit">发布评论</button></div></form><div class="comment-list" data-comment-list><p class="comment-empty">正在加载评论...</p></div></div></section><nav class="article-end"><p>感谢读到这里</p><a href="index.html">继续读下一篇 →</a></nav></article>`;
  root.querySelector(".article-hero .post-meta")?.remove();
  root.querySelectorAll(".article-stats span").forEach(element => {
    if (element.textContent.includes("阅读")) element.remove();
  });
  const related = document.createElement("nav");
  related.className = "related-posts";
  related.setAttribute("aria-label", "文章列表");
  const relatedTitle = document.createElement("strong");
  relatedTitle.textContent = "文章列表";
  related.append(relatedTitle, ...posts.map(item => {
    const link = document.createElement("a");
    link.href = item.url || `posts/${encodeURIComponent(item.slug)}.html`;
    link.textContent = item.title;
    if (item.slug === post.slug) link.setAttribute("aria-current", "page");
    return link;
  }));
  root.querySelector(".article-layout")?.append(related);
  document
    .querySelector("#copy-link")
    ?.addEventListener("click", async (event) => {
      await navigator.clipboard.writeText(location.href);
      event.currentTarget.innerHTML =
        '<i data-lucide="check" aria-hidden="true"></i>';
      window.lucide?.createIcons();
    });
  document
    .querySelector("#share-article")
    ?.addEventListener("click", async () => {
      const message = document.querySelector("#share-message");
      try {
        if (navigator.share) {
          await navigator.share({
            title: post.title,
            text: post.summary,
            url: location.href,
          });
          message.textContent = "已打开转发菜单。";
        } else {
          await navigator.clipboard.writeText(location.href);
          message.textContent = "文章链接已复制。";
        }
      } catch (error) {
        if (error.name !== "AbortError")
          message.textContent = "转发失败，请稍后重试。";
      }
    });
  if (window.lucide) window.lucide.createIcons();
  updateViews(post.slug);
  addEventListener(
    "scroll",
    () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      document.querySelector("#reading-progress").style.width =
        `${max > 0 ? (scrollY / max) * 100 : 0}%`;
    },
    { passive: true },
  );
}

async function updateViews(slug) {
  const output = document.querySelector("#view-count");
  if (!output) return;
  if (["localhost", "127.0.0.1"].includes(location.hostname)) {
    output.textContent = "128";
    return;
  }
  const deviceKey = "zhiwei-comment-device";
  let deviceId = localStorage.getItem(deviceKey);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(deviceKey, deviceId);
  }
  try {
    const response = await fetch("/api/views", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, deviceId }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("view counter unavailable");
    const data = await response.json();
    output.textContent = Number(data.views || 0).toLocaleString("zh-CN");
  } catch {
    output.textContent = "--";
  }
}

document
  .querySelector("#year")
  ?.replaceChildren(String(new Date().getFullYear()));
renderHome();
renderArticle();
