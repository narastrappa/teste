async function iniciarNoticia() {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const host = document.getElementById("noticia-conteudo");

  const { noticias } = await carregarDados();
  const noticia = noticias.find((n) => n.id === id);

  if (!noticia) {
    host.innerHTML = '<p class="empty-state">Notícia não encontrada. <a href="noticias.html">Voltar para notícias</a>.</p>';
    document.title = "Notícia não encontrada · Jogos Internos IFBaiano";
    return;
  }

  document.title = `${noticia.titulo} · Jogos Internos IFBaiano`;

  const paragrafos = noticia.corpo
    .split(/\n+/)
    .filter((p) => p.trim().length > 0)
    .map((p) => `<p>${escapeHTML(p)}</p>`)
    .join("");

  host.innerHTML = `
    <p><a href="noticias.html">&larr; Voltar para notícias</a></p>
    <div class="noticia-data">${formatarDataCompleta(noticia.data)}</div>
    <h1>${escapeHTML(noticia.titulo)}</h1>
    <div class="noticia-corpo">${paragrafos}</div>
  `;
}

document.addEventListener("DOMContentLoaded", iniciarNoticia);
