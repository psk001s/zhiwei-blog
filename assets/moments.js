document.addEventListener("DOMContentLoaded", () => {
  const moments = Array.isArray(window.BLOG_MOMENTS) ? window.BLOG_MOMENTS : [];
  const list = document.querySelector("#moments-list");
  const empty = document.querySelector("#moments-empty");
  const year = document.querySelector("#year");
  const deviceKey = "zhiwei-comment-device";
  const nameKey = "zhiwei-comment-name";
  let deviceId = localStorage.getItem(deviceKey);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(deviceKey, deviceId);
  }
  if (year) year.textContent = new Date().getFullYear();
  if (!moments.length) {
    empty.hidden = false;
    return;
  }
  const formatDate = value => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  };
  const request = async (slug, payload) => {
    const response = await fetch("/api/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, deviceId, ...payload }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "操作失败，请稍后重试");
    return data;
  };
  const commentTime = new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });

  list.replaceChildren(...moments.map(moment => {
    const article = document.createElement("article");
    article.className = "moment";
    article.id = moment.id;
    const meta = document.createElement("div");
    meta.className = "moment-meta";
    const time = document.createElement("time");
    time.dateTime = moment.date;
    time.textContent = formatDate(moment.date);
    meta.append(time);
    if (moment.location) {
      const location = document.createElement("span");
      location.textContent = moment.location;
      meta.append(location);
    }
    const content = document.createElement("div");
    content.className = "moment-content";
    content.innerHTML = moment.content;
    article.append(meta, content);
    if (moment.images?.length) {
      const gallery = document.createElement("div");
      gallery.className = `moment-gallery count-${Math.min(moment.images.length, 4)}`;
      gallery.append(...moment.images.map((source, index) => {
        const link = document.createElement("a");
        link.href = source;
        link.target = "_blank";
        link.rel = "noopener";
        const image = document.createElement("img");
        image.src = source;
        image.alt = `朋友圈图片 ${index + 1}`;
        image.loading = "lazy";
        link.append(image);
        return link;
      }));
      article.append(gallery);
    }
    const slug = `moment-${moment.id}`;
    const interaction = document.createElement("section");
    interaction.className = "moment-interaction";
    interaction.innerHTML = `
      <div class="moment-actions">
        <button class="moment-like" type="button"><i data-lucide="heart" aria-hidden="true"></i><span>赞</span><b>0</b></button>
        <button class="moment-comment-toggle" type="button"><i data-lucide="message-circle" aria-hidden="true"></i><span>评论</span></button>
      </div>
      <div class="moment-social" hidden><div class="moment-likes" hidden><i data-lucide="heart" aria-hidden="true"></i><span></span></div><div class="moment-comments"></div></div>
      <form class="moment-comment-form" hidden>
        <label><span>昵称</span><input name="name" maxlength="30" autocomplete="nickname" required></label>
        <label><span>评论</span><textarea name="content" minlength="2" maxlength="1000" rows="2" required></textarea></label>
        <label class="comment-trap" aria-hidden="true">网站<input name="website" tabindex="-1" autocomplete="off"></label>
        <div><p role="status"></p><button type="submit">发表</button></div>
      </form>`;
    article.append(interaction);

    const likeButton = interaction.querySelector(".moment-like");
    const likeCount = likeButton.querySelector("b");
    const toggle = interaction.querySelector(".moment-comment-toggle");
    const form = interaction.querySelector("form");
    const message = form.querySelector("[role=status]");
    const social = interaction.querySelector(".moment-social");
    const likes = interaction.querySelector(".moment-likes");
    const comments = interaction.querySelector(".moment-comments");
    form.elements.name.value = localStorage.getItem(nameKey) || "";
    let startedAt = Date.now();

    const load = async () => {
      const response = await fetch(`/api/comments?slug=${encodeURIComponent(slug)}&deviceId=${encodeURIComponent(deviceId)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "互动加载失败");
      const count = Number(data.articleLikes || 0);
      likeCount.textContent = count;
      likeButton.classList.toggle("liked", Boolean(data.articleLiked));
      likeButton.disabled = Boolean(data.articleLiked);
      likeButton.querySelector("span").textContent = data.articleLiked ? "已赞" : "赞";
      likes.hidden = count === 0;
      likes.querySelector("span").textContent = `${count} 人觉得很赞`;
      comments.replaceChildren(...data.comments.map(comment => {
        const item = document.createElement("div");
        const line = document.createElement("p");
        const name = document.createElement("strong");
        name.textContent = comment.name;
        line.append(name, `：${comment.content}`);
        const time = document.createElement("time");
        time.dateTime = comment.created_at;
        time.textContent = commentTime.format(new Date(comment.created_at));
        item.append(line, time);
        return item;
      }));
      social.hidden = count === 0 && data.comments.length === 0;
      if (window.lucide) window.lucide.createIcons();
    };

    likeButton.addEventListener("click", async () => {
      try { await request(slug, { action: "like-article" }); await load(); } catch (error) { message.textContent = error.message; }
    });
    toggle.addEventListener("click", () => {
      form.hidden = !form.hidden;
      if (!form.hidden) form.elements[form.elements.name.value ? "content" : "name"].focus();
    });
    form.addEventListener("submit", async event => {
      event.preventDefault();
      const submit = form.querySelector("button[type=submit]");
      const values = new FormData(form);
      submit.disabled = true;
      message.textContent = "正在发表...";
      try {
        await request(slug, { action: "comment", name: values.get("name"), content: values.get("content"), website: values.get("website"), startedAt });
        localStorage.setItem(nameKey, String(values.get("name")));
        form.elements.content.value = "";
        form.hidden = true;
        startedAt = Date.now();
        message.textContent = "";
        await load();
      } catch (error) { message.textContent = error.message; }
      finally { submit.disabled = false; }
    });
    load().catch(error => { message.textContent = error.message; });
    return article;
  }));
  if (window.lucide) window.lucide.createIcons();
});
