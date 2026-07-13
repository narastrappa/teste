const PONTOS = { vitoria: 3, empate: 1, derrota: 0 };

async function iniciarResultados() {
  const { modalidades, times, jogos } = await carregarDados();
  const timesPorId = porId(times);
  const host = document.getElementById("resultados-por-modalidade");
  host.innerHTML = "";

  modalidades.forEach((modalidade) => {
    const jogosDaModalidade = jogos.filter((j) => j.modalidadeId === modalidade.id);
    const realizados = jogosDaModalidade.filter((j) => j.status === "realizado");

    const bloco = document.createElement("div");
    bloco.className = "card";
    bloco.style.marginBottom = "1.25rem";

    const titulo = document.createElement("h3");
    titulo.textContent = `${modalidade.icone} ${modalidade.nome}`;
    bloco.appendChild(titulo);

    if (realizados.length === 0) {
      bloco.appendChild(elemento('<p class="empty-state">Ainda sem resultados registrados.</p>'));
    } else if (modalidade.tipo === "coletivo") {
      bloco.appendChild(criarTabelaClassificacao(realizados, timesPorId));
      bloco.appendChild(criarListaResultados(realizados, timesPorId));
    } else {
      bloco.appendChild(criarListaResultados(realizados, timesPorId));
    }

    host.appendChild(bloco);
  });
}

function criarTabelaClassificacao(jogosRealizados, timesPorId) {
  const stats = {};
  const registrar = (id) => {
    if (!stats[id]) {
      stats[id] = { id, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, pontos: 0, saldo: 0, proFeitos: 0 };
    }
    return stats[id];
  };

  jogosRealizados.forEach((jogo) => {
    if (!jogo.timeA || !jogo.timeB || jogo.placarA === null || jogo.placarB === null) return;
    const a = registrar(jogo.timeA);
    const b = registrar(jogo.timeB);
    a.jogos++; b.jogos++;
    a.proFeitos += jogo.placarA; b.proFeitos += jogo.placarB;
    a.saldo += jogo.placarA - jogo.placarB;
    b.saldo += jogo.placarB - jogo.placarA;

    if (jogo.placarA > jogo.placarB) {
      a.vitorias++; a.pontos += PONTOS.vitoria;
      b.derrotas++; b.pontos += PONTOS.derrota;
    } else if (jogo.placarA < jogo.placarB) {
      b.vitorias++; b.pontos += PONTOS.vitoria;
      a.derrotas++; a.pontos += PONTOS.derrota;
    } else {
      a.empates++; a.pontos += PONTOS.empate;
      b.empates++; b.pontos += PONTOS.empate;
    }
  });

  const linhas = Object.values(stats).sort((x, y) => y.pontos - x.pontos || y.saldo - x.saldo || y.proFeitos - x.proFeitos);

  const wrap = document.createElement("div");
  wrap.className = "tabela-wrap";
  wrap.innerHTML = `
    <table class="classificacao">
      <caption>Classificação</caption>
      <thead>
        <tr>
          <th>Time</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th><th>Pts</th>
        </tr>
      </thead>
      <tbody>
        ${linhas.map((l) => {
          const time = timesPorId[l.id];
          return `
            <tr>
              <td class="time-nome"><span class="time-dot" style="background:${escapeHTML(time?.cor || "#ccc")}"></span>${escapeHTML(time?.nome || l.id)}</td>
              <td>${l.jogos}</td>
              <td>${l.vitorias}</td>
              <td>${l.empates}</td>
              <td>${l.derrotas}</td>
              <td>${l.saldo > 0 ? "+" : ""}${l.saldo}</td>
              <td><strong>${l.pontos}</strong></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
  return wrap;
}

function criarListaResultados(jogosRealizados, timesPorId) {
  const container = document.createElement("div");
  container.style.marginTop = "1rem";

  [...jogosRealizados]
    .sort((a, b) => `${b.data}${b.hora}`.localeCompare(`${a.data}${a.hora}`))
    .forEach((jogo) => {
      const timeA = jogo.timeA ? timesPorId[jogo.timeA] : null;
      const timeB = jogo.timeB ? timesPorId[jogo.timeB] : null;

      const descricao = timeA && timeB
        ? `${escapeHTML(timeA.nome)} <strong>${jogo.placarA} × ${jogo.placarB}</strong> ${escapeHTML(timeB.nome)}`
        : escapeHTML(jogo.observacao || "Resultado registrado");

      container.appendChild(elemento(`
        <div class="jogo-item">
          <div class="jogo-info">
            <div class="jogo-times">${descricao}</div>
            <div class="jogo-meta">${escapeHTML(jogo.fase)} · ${formatarDataHora(jogo.data, jogo.hora)} · ${escapeHTML(jogo.local)}</div>
          </div>
        </div>
      `));
    });

  return container;
}

document.addEventListener("DOMContentLoaded", iniciarResultados);
