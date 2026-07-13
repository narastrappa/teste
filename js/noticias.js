async function iniciarNoticias() {
  const { noticias } = await carregarDados();
  const host = document.getElementById("lista-noticias");
  host.innerHTML = "";

  const ordenadas = [...noticias].sort((a, b) => b.data.localeCompare(a.data));

  if (ordenadas.length === 0) {
    host.innerHTML = '<p class="empty-state">Nenhuma notícia publicada ainda.</p>';
    return;
  }

  ordenadas.forEach((noticia) => {
    host.appendChild(elemento(`
      <a class="card noticia-card" href="noticia.html?id=${encodeURIComponent(noticia.id)}">
        <div class="noticia-data">${formatarDataCompleta(noticia.data)}</div>
        <h3>${escapeHTML(noticia.titulo)}</h3>
        <p>${escapeHTML(noticia.resumo)}</p>
      </a>
    `));
  });
}

document.addEventListener("DOMContentLoaded", iniciarNoticias);
