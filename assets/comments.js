(() => {
  const root = document.querySelector("[data-comment-system]");
  if (!root) return;
  const slug = root.dataset.slug;
  const deviceKey = "zhiwei-comment-device";
  let deviceId = localStorage.getItem(deviceKey);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(deviceKey, deviceId);
  }

  const list = root.querySelector("[data-comment-list]");
  const form = root.querySelector("[data-comment-form]");
  const message = root.querySelector("[data-comment-message]");
  const likeButton = root.querySelector("[data-article-like]");
  const likeCount = root.querySelector("[data-article-like-count]");
  const time = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  async function request(payload) {
    const response = await fetch("/api/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, deviceId, ...payload }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "操作失败，请稍后重试");
    return data;
  }

  function commentNode(comment) {
    const article = document.createElement("article");
    article.className = "comment-item";
    const heading = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = comment.name;
    const created = document.createElement("time");
    created.dateTime = comment.created_at;
    created.textContent = time.format(new Date(comment.created_at));
    heading.append(name, created);
    const content = document.createElement("p");
    content.textContent = comment.content;
    const like = document.createElement("button");
    like.type = "button";
    like.className = "comment-like";
    like.disabled = Boolean(comment.liked);
    like.textContent = `${comment.liked ? "已赞" : "赞"} ${Number(comment.likes || 0)}`;
    like.addEventListener("click", async () => {
      try { await request({ action: "like-comment", commentId: comment.id }); await load(); } catch (error) { message.textContent = error.message; }
    });
    article.append(heading, content, like);
    return article;
  }

  async function load() {
    try {
      const response = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}&deviceId=${encodeURIComponent(deviceId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "评论加载失败");
      list.replaceChildren(...(data.comments.length ? data.comments.map(commentNode) : [Object.assign(document.createElement("p"), { className: "comment-empty", textContent: "还没有评论，欢迎留下第一条。" })]));
      likeCount.textContent = Number(data.articleLikes || 0);
      likeButton.disabled = Boolean(data.articleLiked);
      likeButton.classList.toggle("liked", Boolean(data.articleLiked));
      likeButton.querySelector("span").textContent = data.articleLiked ? "已喜欢" : "喜欢这篇文章";
      if (window.lucide) window.lucide.createIcons();
    } catch (error) {
      list.replaceChildren(Object.assign(document.createElement("p"), { className: "comment-empty", textContent: error.message }));
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    message.textContent = "正在发布...";
    const values = new FormData(form);
    try {
      await request({ action: "comment", name: values.get("name"), content: values.get("content") });
      form.elements.content.value = "";
      message.textContent = "评论已发布。";
      await load();
    } catch (error) { message.textContent = error.message; }
    finally { submit.disabled = false; }
  });

  likeButton.addEventListener("click", async () => {
    try { await request({ action: "like-article" }); await load(); } catch (error) { message.textContent = error.message; }
  });

  load();
})();
