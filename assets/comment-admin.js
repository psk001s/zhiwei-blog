(() => {
  const login = document.querySelector("[data-admin-login]");
  const dashboard = document.querySelector("[data-admin-dashboard]");
  const list = document.querySelector("[data-admin-comment-list]");
  const messages = document.querySelectorAll("[data-admin-message]");
  const key = "zhiwei-comment-admin";
  const time = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const showMessage = value => messages.forEach(element => { element.textContent = value; });
  const authorization = () => `Basic ${sessionStorage.getItem(key) || ""}`;
  async function api(path = "", options = {}) {
    const response = await fetch(`/api/admin/comments${path}`, { ...options, headers: { authorization: authorization(), ...options.headers } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "操作失败");
    return data;
  }

  function commentNode(comment) {
    const article = document.createElement("article");
    const header = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = comment.name;
    const meta = document.createElement("span");
    meta.textContent = `${time.format(new Date(comment.created_at))} · ${comment.likes || 0} 赞`;
    header.append(title, meta);
    const content = document.createElement("p");
    content.textContent = comment.content;
    const footer = document.createElement("div");
    const link = document.createElement("a");
    link.href = `../article.html?slug=${encodeURIComponent(comment.slug)}`;
    link.textContent = comment.slug;
    link.target = "_blank";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "删除";
    remove.addEventListener("click", async () => {
      if (!confirm("确定删除这条评论？此操作无法撤销。")) return;
      try { await api(`?id=${comment.id}`, { method: "DELETE" }); await load(); } catch (error) { showMessage(error.message); }
    });
    footer.append(link, remove);
    article.append(header, content, footer);
    return article;
  }

  async function load() {
    const data = await api();
    login.hidden = true;
    dashboard.hidden = false;
    list.replaceChildren(...(data.comments.length ? data.comments.map(commentNode) : [Object.assign(document.createElement("p"), { className: "admin-empty", textContent: "目前没有评论。" })]));
    showMessage("");
  }

  login.querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    sessionStorage.setItem(key, btoa(`admin:${password}`));
    try { await load(); } catch (error) { sessionStorage.removeItem(key); showMessage(error.message); }
  });

  document.querySelector("[data-admin-logout]").addEventListener("click", () => {
    sessionStorage.removeItem(key);
    dashboard.hidden = true;
    login.hidden = false;
  });

  if (sessionStorage.getItem(key)) load().catch(() => sessionStorage.removeItem(key));
})();
