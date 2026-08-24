document.addEventListener("DOMContentLoaded", () => {
  const moments = Array.isArray(window.BLOG_MOMENTS) ? window.BLOG_MOMENTS : [];
  const list = document.querySelector("#moments-list");
  const empty = document.querySelector("#moments-empty");
  const year = document.querySelector("#year");
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
  list.replaceChildren(...moments.map(moment => {
    const article = document.createElement("article");
    article.className = "moment";
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
        image.alt = `随笔图片 ${index + 1}`;
        image.loading = "lazy";
        link.append(image);
        return link;
      }));
      article.append(gallery);
    }
    return article;
  }));
});
