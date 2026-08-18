document.addEventListener("DOMContentLoaded", () => {
  const config = window.SITE_CONFIG || {};
  const about = window.ABOUT_CONFIG || {};
  document.querySelectorAll(".brand").forEach(brand => {
    brand.setAttribute("aria-label", `${config.name || "知微"}首页`);
    brand.innerHTML = config.logoImage ? `<img class="brand-image" src="${config.logoImage}" alt="${config.name || "网站 Logo"}">` : `${config.logoText || config.name || "知微"}<span>${config.logoSubtitle || ""}</span>`;
  });
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => { if (config.email) { link.href = `mailto:${config.email}`; link.textContent = `${config.email} →`; } });
  const setText = (selector, value) => { if (value) document.querySelectorAll(selector).forEach(element => { element.textContent = value; }); };
  const setBreaks = (selector, value) => { if (value) document.querySelectorAll(selector).forEach(element => { element.replaceChildren(...value.split("|").flatMap((part, index) => index ? [document.createElement("br"), part] : [part])); }); };
  setText('header nav a[href*="index"]', config.navArticles);
  setText('header nav a[href*="about"]', config.navAbout);
  setText(".intro .eyebrow", config.introEyebrow);
  setBreaks(".intro h1", config.introTitle);
  setText(".intro-copy", config.introDescription);
  setText(".archive .section-heading .eyebrow", config.articlesEyebrow);
  setText(".archive .section-heading h2", config.articlesTitle);
  setBreaks(".about-mark", config.aboutMark);
  setText(".about .eyebrow", config.aboutEyebrow);
  setText(".about h2", config.aboutTitle);
  setText(".about p:last-child", config.aboutDescription);
  const aboutParagraph = document.querySelector(".about p:last-child");
  if (aboutParagraph) { const aboutLink = document.createElement("a"); aboutLink.className = "about-more"; aboutLink.href = "about.html"; aboutLink.textContent = config.aboutLinkText || "继续了解我 →"; aboutParagraph.append(" ", aboutLink); }
  setText("footer p:last-child", config.footerText);
  document.querySelectorAll("footer p:first-child").forEach(element => { element.textContent = `© ${new Date().getFullYear()} ${config.name || "知微"}`; });
  if (config.seoTitle && document.body.querySelector(".intro")) { document.title = config.seoTitle; document.querySelectorAll('meta[property="og:title"]').forEach(element => { element.content = config.seoTitle; }); }
  if (config.seoDescription && document.body.querySelector(".intro")) {
    document.querySelectorAll('meta[name="description"],meta[property="og:description"]').forEach(element => { element.content = config.seoDescription; });
  }
  if (document.body.querySelector(".about-page")) {
    document.querySelectorAll("[data-about]").forEach(element => {
      const value = about[element.dataset.about];
      if (!value) return;
      if (element.dataset.about === "title") {
        element.replaceChildren(...value.split("|").flatMap((part, index) => index ? [document.createElement("br"), part] : [part]));
      } else element.textContent = value;
    });
    const image = document.querySelector("[data-about-image]");
    if (image && about.image) image.src = about.image;
    if (image && about.imageAlt) image.alt = about.imageAlt;
    const interests = document.querySelector("[data-about-interests]");
    if (interests && about.interests) interests.replaceChildren(...about.interests.split("|").map(value => Object.assign(document.createElement("span"), { textContent: value })));
    const email = document.querySelector("[data-about-email]");
    if (email && about.email) { email.href = `mailto:${about.email}`; email.textContent = `${about.email} →`; }
    if (about.seoTitle) document.title = about.seoTitle;
    if (about.seoDescription) document.querySelectorAll('meta[name="description"],meta[property="og:description"]').forEach(element => { element.content = about.seoDescription; });
    if (about.seoTitle) document.querySelectorAll('meta[property="og:title"]').forEach(element => { element.content = about.seoTitle; });
  }
});
