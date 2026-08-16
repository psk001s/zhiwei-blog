const fields = ["title", "category", "summary", "cover", "content"];
const $ = selector => document.querySelector(selector);
const escapeHtml = text => text.replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
function markdown(source) {
  let html = escapeHtml(source)
    .replace(/^### (.*)$/gm, "<h3>$1</h3>").replace(/^## (.*)$/gm, "<h2>$1</h2>")
    .replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<figure><img src="$2" alt="$1"><figcaption>$1</figcaption></figure>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>")
    .split(/\n{2,}/).map(block => /^<(h[23]|blockquote|figure)/.test(block) ? block : `<p>${block.replace(/\n/g, "<br>")}</p>`).join("");
  return html;
}
function values() { return Object.fromEntries(fields.map(id => [id, $(`#${id}`).value])); }
function update() {
  const data = values();
  $("#preview").innerHTML = `<h1>${escapeHtml(data.title)}</h1>${data.summary ? `<p class="lead">${escapeHtml(data.summary)}</p>` : ""}${data.cover ? `<figure><img src="${data.cover}" alt=""></figure>` : ""}${markdown(data.content)}`;
  localStorage.setItem("zhiwei-draft", JSON.stringify(data));
  $("#save-status").textContent = "已自动保存草稿";
}
const draft = JSON.parse(localStorage.getItem("zhiwei-draft") || "null");
if (draft) fields.forEach(id => { if (draft[id] != null) $(`#${id}`).value = draft[id]; });
fields.forEach(id => $(`#${id}`).addEventListener("input", () => { $("#save-status").textContent = "保存中…"; update(); }));
$(".format-bar").addEventListener("click", event => {
  const button = event.target.closest("button"); if (!button) return;
  const area = $("#content"), start = area.selectionStart, end = area.selectionEnd;
  if (button.dataset.wrap) area.setRangeText(`${button.dataset.wrap}${area.value.slice(start, end) || "文字"}${button.dataset.wrap}`, start, end, "end");
  else area.setRangeText(button.dataset.insert, start, end, "end");
  area.focus(); update();
});
const dialog = $("#export-dialog");
$("#export-button").addEventListener("click", () => dialog.showModal());
$(".dialog-close").addEventListener("click", () => dialog.close());
function postData() {
  const data = values();
  return { slug: data.title.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-").replace(/(^-|-$)/g, "") || `post-${Date.now()}`, title: data.title, category: data.category || "随笔", date: new Date().toISOString().slice(0, 10), readTime: `${Math.max(1, Math.ceil(data.content.length / 500))} 分钟`, summary: data.summary, cover: data.cover, content: markdown(data.content) };
}
$("#download-button").addEventListener("click", () => {
  const post = postData(), blob = new Blob([JSON.stringify(post, null, 2)], { type: "application/json" });
  const link = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${post.slug}.json` }); link.click(); URL.revokeObjectURL(link.href);
});
$("#copy-button").addEventListener("click", async event => { await navigator.clipboard.writeText(JSON.stringify(postData(), null, 2)); event.target.textContent = "已复制"; });
update();
