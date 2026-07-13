async function iniciarHome() {
  const { modalidades, times, jogos, noticias } = await carregarDados();
  const modalidadesPorId = porId(modalidades);
  const timesPorId = porId(times);

  renderizarProximosJogos(jogos, modalidadesPorId, timesPorId);
  renderizarUltimasNoticias(noticias);
}

function renderizarProximosJogos(jogos, modalidadesPorId, timesPorId) {
  const host = document.getElementById("proximos-jogos");
  if (!host) return;

  const proximos = jogos
    .filter((j) => j.status === "agendado")
    .sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`))
    .slice(0, 5);

  if (proximos.length === 0) {
    host.innerHTML = '<p class="empty-state">Nenhum jogo agendado no momento.</p>';
    return;
  }

  host.innerHTML = "";
  proximos.forEach((jogo) => {
    host.appendChild(criarItemJogo(jogo, modalidadesPorId, timesPorId));
  });
}

function renderizarUltimasNoticias(noticias) {
  const host = document.getElementById("ultimas-noticias");
  if (!host) return;

  const recentes = [...noticias]
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 3);

  if (recentes.length === 0) {
    host.innerHTML = '<p class="empty-state">Nenhuma notícia publicada ainda.</p>';
    return;
  }

  host.innerHTML = "";
  recentes.forEach((noticia) => {
    host.appendChild(elemento(`
      <a class="card noticia-card" href="noticia.html?id=${encodeURIComponent(noticia.id)}">
        <div class="noticia-data">${formatarDataCompleta(noticia.data)}</div>
        <h3>${escapeHTML(noticia.titulo)}</h3>
        <p>${escapeHTML(noticia.resumo)}</p>
      </a>
    `));
  });
}

document.addEventListener("DOMContentLoaded", iniciarHome);
