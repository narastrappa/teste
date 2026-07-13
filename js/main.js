// Injeta header/footer compartilhados e liga a navegação mobile.

async function carregarPartials() {
  const headerHost = document.getElementById("site-header");
  const footerHost = document.getElementById("site-footer");

  const [headerHTML, footerHTML] = await Promise.all([
    fetch("partials/header.html").then((r) => r.text()),
    fetch("partials/footer.html").then((r) => r.text()),
  ]);

  if (headerHost) headerHost.innerHTML = headerHTML;
  if (footerHost) footerHost.innerHTML = footerHTML;

  marcarLinkAtivo();
  ligarMenuMobile();
  preencherAno();
}

function marcarLinkAtivo() {
  const pagina = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a[data-page]").forEach((link) => {
    if (link.dataset.page === pagina) link.classList.add("is-active");
  });
}

function ligarMenuMobile() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const aberto = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(aberto));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function preencherAno() {
  const el = document.getElementById("footer-year");
  if (el) el.textContent = String(new Date().getFullYear());
}

document.addEventListener("DOMContentLoaded", carregarPartials);
