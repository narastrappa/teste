(function () {
  "use strict";

  const equipeById = Object.fromEntries(EQUIPES.map((e) => [e.id, e]));
  window.equipeById = equipeById;

  /* ---------------- Menu mobile ---------------- */
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  navMenu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------------- Contagem regressiva (em dias) ---------------- */
  function atualizarContagem() {
    const hoje = new Date();
    const inicio = new Date(EVENTO.dataInicio + "T00:00:00-03:00");
    const umDia = 1000 * 60 * 60 * 24;
    const diff = inicio.setHours(0, 0, 0, 0) - new Date(hoje).setHours(0, 0, 0, 0);
    const dias = Math.max(0, Math.ceil(diff / umDia));
    document.getElementById("cd-dias").textContent = String(dias);
  }
  atualizarContagem();

  /* ---------------- Equipes ---------------- */
  function renderEquipes() {
    const grid = document.getElementById("equipesGrid");
    grid.innerHTML = EQUIPES.map(
      (e) => `
      <article class="equipe-card" style="--cor-equipe:${e.hex}; --cor-equipe-escura:${e.hexEscuro}">
        <header class="equipe-card-header">
          <span class="equipe-card-tag">Equipe</span>
          <span class="equipe-card-numero">${e.numero}</span>
          <span class="equipe-card-cor">${e.cor.toUpperCase()}</span>
        </header>
        <div class="equipe-card-body">
          <div class="equipe-card-turmas">
            <h4>Turmas</h4>
            <ul>
              ${e.turmas.map((t) => `<li>${t}</li>`).join("")}
            </ul>
          </div>
          <div class="equipe-card-info">
            <div>
              <span class="equipe-card-icon">🏅</span>
              <div>
                <small>Atleta Homenageada</small>
                <strong>${e.homenageada}</strong>
              </div>
            </div>
            <div>
              <span class="equipe-card-icon">🐾</span>
              <div>
                <small>Mascote</small>
                <strong>${e.mascote}</strong>
              </div>
            </div>
            <div>
              <span class="equipe-card-icon">🎨</span>
              <div>
                <small>Cor da Equipe</small>
                <strong>${e.cor}</strong>
              </div>
            </div>
          </div>
          <a class="equipe-card-instagram" href="${e.instagram}" target="_blank" rel="noopener">
            📷 Torcida ${e.torcida} no Instagram
          </a>
        </div>
      </article>`
    ).join("");
  }

  /* ---------------- Modalidades esportivas ---------------- */
  function renderModalidades() {
    const grid = document.getElementById("modalidadesGrid");
    grid.innerHTML = MODALIDADES_ESPORTIVAS.map(
      (m) => `
      <div class="card">
        <div class="card-icon">${m.icone}</div>
        <h3>${m.nome}</h3>
        <p>${m.provas}</p>
        ${m.provasDetalhe ? `<p class="card-detalhe">${m.provasDetalhe}</p>` : ""}
        <p class="card-limite">${m.limite}</p>
        <span class="tag">${m.tipo}</span>
      </div>`
    ).join("");
  }

  /* ---------------- Provas artísticas ---------------- */
  function renderArtisticas() {
    const grid = document.getElementById("artisticasGrid");
    grid.innerHTML = PROVAS_ARTISTICAS.map(
      (p) => `
      <div class="card">
        <div class="card-icon">${p.icone}</div>
        <h3>${p.nome}</h3>
        <p>${p.descricao}</p>
        <span class="tag">Obrigatória</span>
      </div>`
    ).join("");
    document.getElementById("sancaoArtistica").textContent = "⚠️ " + SANCAO_PROVA_ARTISTICA;
  }

  /* ---------------- Programação ---------------- */
  function renderProgramacao() {
    const wrap = document.getElementById("programacaoDias");
    wrap.innerHTML = PROGRAMACAO.map(
      (dia) => `
      <div class="programacao-dia">
        <h3>${dia.dia} <span>${dia.data}</span></h3>
        <div class="table-scroll">
          <table class="table">
            <thead>
              <tr>
                <th>Horário</th>
                <th>Atividade</th>
                <th>Local</th>
                <th>Coordenação</th>
              </tr>
            </thead>
            <tbody>
              ${dia.itens
                .map(
                  (item) => `
                <tr>
                  <td>${item.horario}</td>
                  <td>${item.atividade}</td>
                  <td>${item.local}</td>
                  <td>${item.coordenacao}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>
        ${dia.observacao ? `<p class="programacao-obs">📌 ${dia.observacao}</p>` : ""}
      </div>`
    ).join("");

    const tbody = document.querySelector("#tabelaDatas tbody");
    tbody.innerHTML = DATAS_IMPORTANTES.map(
      (d) => `<tr><td><strong>${d.data}</strong></td><td>${d.evento}</td></tr>`
    ).join("");
  }

  /* A Classificação Geral (com base nos resultados reais) e os resultados
     dos jogos são renderizados por js/firebase-app.js, que lê e escreve no
     Firestore em tempo real. */

  /* ---------------- Chaveado Oficial ---------------- */
  function slugJogo(texto) {
    return String(texto)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function idPartida(modalidadeBase, genero, fase) {
    return `${slugJogo(modalidadeBase)}__${slugJogo(genero)}__${slugJogo(fase)}`;
  }

  function idPartidaIndividual(modalidade, fase) {
    return `individual__${slugJogo(modalidade)}__${slugJogo(fase)}`;
  }

  function nomeTime(valor) {
    if (typeof valor === "string" && valor.startsWith("equipe-")) {
      const e = equipeById[valor];
      return e ? e.torcida : valor;
    }
    return valor;
  }

  function renderTime(valor) {
    if (typeof valor === "string" && valor.startsWith("equipe-")) {
      const e = equipeById[valor];
      if (!e) return valor;
      return `<span class="chaveado-time" title="Equipe ${e.numero} — ${e.torcida}"><span class="equipe-color-dot" style="background:${e.hex}"></span>${e.torcida}</span>`;
    }
    return `<span class="chaveado-time chaveado-time-pendente">${valor}</span>`;
  }

  /* Resolve os textos "Vencedor SF1/2" e "Perdedor SF1/2" (usados nas
     fases de Final e Disputa de 3º Lugar) para o id real da equipe, assim
     que o resultado da semifinal correspondente é lançado. Enquanto a
     semifinal não tiver resultado, devolve o texto original. */
  function resolverLadoEquipe(valor, sf1, sf1Id, sf2, sf2Id) {
    if (typeof valor !== "string") return valor;
    let m = valor.match(/^Vencedor SF([12])$/);
    if (m) {
      const sf = m[1] === "1" ? sf1 : sf2;
      const sfId = m[1] === "1" ? sf1Id : sf2Id;
      if (!sf || !sfId) return valor;
      const jogo = (window.jogosPorId || {})[sfId];
      return jogo && jogo.vencedor ? jogo.vencedor : valor;
    }
    m = valor.match(/^Perdedor SF([12])$/);
    if (m) {
      const sf = m[1] === "1" ? sf1 : sf2;
      const sfId = m[1] === "1" ? sf1Id : sf2Id;
      if (!sf || !sfId) return valor;
      const jogo = (window.jogosPorId || {})[sfId];
      if (jogo && jogo.vencedor) {
        return jogo.vencedor === sf.timeA ? sf.timeB : sf.timeA;
      }
      return valor;
    }
    return valor;
  }

  function calcularPartidaEquipe(info) {
    const { c, f, sf1, sf1Id, sf2, sf2Id } = info;
    const dataMatch = f.horario.match(/(\d{2}\/\d{2})/);
    const dataPartida = dataMatch ? dataMatch[1] : c.data;
    const timeA = resolverLadoEquipe(f.timeA, sf1, sf1Id, sf2, sf2Id);
    const timeB = resolverLadoEquipe(f.timeB, sf1, sf1Id, sf2, sf2Id);
    return { dataPartida, timeA, timeB };
  }

  function htmlPartida(id, fase, horario, timeAHtml, timeBHtml) {
    return `
      <div class="chaveado-partida" data-id="${id}" data-tipo="equipe">
        <div class="chaveado-partida-cabecalho">
          <span class="chaveado-partida-fase">${fase}</span>
          <span class="chaveado-partida-horario">${horario || ""}</span>
        </div>
        <div class="chaveado-partida-confronto">
          ${timeAHtml} <span class="chaveado-x">×</span> ${timeBHtml}
          <span class="chaveado-partida-placar"></span>
        </div>
        <span class="chaveado-partida-hint">🔒 Clique para lançar o resultado</span>
      </div>`;
  }

  /* id da partida -> { c, f, modalidadeBase, genero, sf1, sf1Id, sf2, sf2Id }
     preenchido em renderChaveado() e usado tanto no clique quanto na
     atualização em tempo real (atualizarCardsChaveado). */
  const partidaInfoPorId = {};
  const partidaIndividualInfoPorId = {};

  function renderChaveado() {
    const grid = document.getElementById("chaveadoGrid");
    if (grid) {
      grid.innerHTML = CHAVEADO.map((c) => {
        const m = c.modalidade.match(/^(.*) (Feminino|Masculino)$/);
        const modalidadeBase = m ? m[1] : c.modalidade;
        const genero = m ? m[2] : "";
        const sf1 = c.fases.find((x) => x.fase === "Semifinal 1");
        const sf2 = c.fases.find((x) => x.fase === "Semifinal 2");
        const sf1Id = sf1 ? idPartida(modalidadeBase, genero, "Semifinal 1") : null;
        const sf2Id = sf2 ? idPartida(modalidadeBase, genero, "Semifinal 2") : null;

        return `
        <div class="card chaveado-card">
          <h3>${c.modalidade}</h3>
          <p class="chaveado-meta">📍 ${c.local} · 📅 ${c.data}</p>
          <div class="chaveado-partidas">
            ${c.fases
              .map((f) => {
                const id = idPartida(modalidadeBase, genero, f.fase);
                const info = { c, f, modalidadeBase, genero, sf1, sf1Id, sf2, sf2Id };
                partidaInfoPorId[id] = info;
                const calc = calcularPartidaEquipe(info);
                return htmlPartida(id, f.fase, f.horario, renderTime(calc.timeA), renderTime(calc.timeB));
              })
              .join("")}
          </div>
          ${c.observacao ? `<p class="programacao-obs">📌 ${c.observacao}</p>` : ""}
        </div>`;
      }).join("");

      grid.addEventListener("click", (ev) => {
        if (!document.body.classList.contains("is-admin")) return;
        const el = ev.target.closest(".chaveado-partida");
        if (!el) return;
        const info = partidaInfoPorId[el.dataset.id];
        if (!info) return;
        const calc = calcularPartidaEquipe(info);
        preencherFormJogo({
          id: el.dataset.id,
          modalidade: info.modalidadeBase,
          genero: info.genero,
          fase: info.f.fase,
          data: calc.dataPartida,
          confronto: `${nomeTime(calc.timeA)} x ${nomeTime(calc.timeB)}`,
          timeA: calc.timeA,
          timeB: calc.timeB,
        });
      });
    }

    const gridIndividual = document.getElementById("chaveadoIndividualGrid");
    if (gridIndividual) {
      gridIndividual.innerHTML = CHAVEADO_INDIVIDUAL.map(
        (c) => `
        <div class="card chaveado-card">
          <h3>${c.modalidade}</h3>
          <p class="chaveado-meta">📍 ${c.local} · 📅 ${c.data} · 🕒 Início ${c.inicio}</p>
          <div class="chaveado-partidas">
            ${c.partidas
              .map((p) => {
                const id = idPartidaIndividual(c.modalidade, p.fase);
                partidaIndividualInfoPorId[id] = { c, p };
                return `
              <div class="chaveado-partida" data-id="${id}" data-tipo="individual">
                <div class="chaveado-partida-cabecalho">
                  <span class="chaveado-partida-fase">${p.fase}</span>
                </div>
                <div class="chaveado-partida-confronto">
                  <span class="chaveado-time chaveado-time-pendente">${p.ladoA}</span>
                  <span class="chaveado-x">×</span>
                  <span class="chaveado-time chaveado-time-pendente">${p.ladoB}</span>
                  <span class="chaveado-partida-placar"></span>
                </div>
                <p class="chaveado-partida-nomes"></p>
                <span class="chaveado-partida-hint">🔒 Clique para lançar o resultado</span>
              </div>`;
              })
              .join("")}
          </div>
          <p class="programacao-obs">📌 ${c.formato}</p>
        </div>`
      ).join("");

      gridIndividual.addEventListener("click", (ev) => {
        if (!document.body.classList.contains("is-admin")) return;
        const el = ev.target.closest(".chaveado-partida");
        if (!el) return;
        const info = partidaIndividualInfoPorId[el.dataset.id];
        if (!info) return;
        preencherFormJogoIndividual(el.dataset.id, info);
      });
    }
  }

  /* Preenche o formulário de "Lançar resultado de um jogo" (modalidades por
     equipe) a partir de uma partida do Chaveado Oficial. Se já existir um
     resultado lançado (window.jogosPorId, atualizado por js/firebase-app.js),
     os dados existentes são pré-carregados para edição. */
  function preencherFormJogo(dados) {
    const form = document.getElementById("formJogo");
    if (!form) return;

    const existente = (window.jogosPorId || {})[dados.id];
    const pendente = (v) => typeof v === "string" && /^(Vencedor|Perdedor) SF[12]$/.test(v);

    form.data.value = existente ? existente.data : dados.data;
    form.modalidade.value = dados.modalidade;
    form.genero.value = dados.genero;
    form.confronto.value = dados.confronto;
    form.fase.value = dados.fase;
    form.timeAId.value = dados.timeA;
    form.timeBId.value = dados.timeB;

    const selectVencedor = document.getElementById("formJogoVencedor");
    if (selectVencedor) {
      selectVencedor.innerHTML =
        `<option value="">Selecione o vencedor…</option>` +
        `<option value="${dados.timeA}">${nomeTime(dados.timeA)}</option>` +
        `<option value="${dados.timeB}">${nomeTime(dados.timeB)}</option>`;
      selectVencedor.value = existente && existente.vencedor ? existente.vencedor : "";
    }

    const woCheckbox = document.getElementById("formJogoWO");
    if (woCheckbox) woCheckbox.checked = !!(existente && existente.wo);
    form.placar.value = existente ? existente.placar : "";
    form.placar.readOnly = !!(existente && existente.wo);

    const contexto = document.getElementById("formJogoContexto");
    if (contexto) {
      contexto.hidden = false;
      if (pendente(dados.timeA) || pendente(dados.timeB)) {
        contexto.textContent = `⏳ Esta partida ainda depende de semifinais não concluídas (${dados.confronto}). O ideal é lançar o resultado das semifinais primeiro.`;
      } else {
        contexto.textContent = existente
          ? `✏️ Editando resultado já lançado: ${dados.modalidade} (${dados.genero}) — ${dados.fase}`
          : `🆕 Novo resultado: ${dados.modalidade} (${dados.genero}) — ${dados.fase}`;
      }
    }

    form.scrollIntoView({ behavior: "smooth", block: "center" });
    form.classList.remove("form-realce");
    void form.offsetWidth;
    form.classList.add("form-realce");
    form.placar.focus();
  }

  /* Preenche o formulário de resultado das modalidades individuais
     (Xadrez, Tênis de Mesa, Videogame FIFA), pedindo o nome de quem jogou
     em cada lado da partida. */
  function preencherFormJogoIndividual(id, info) {
    const form = document.getElementById("formJogoIndividual");
    if (!form) return;

    const existente = (window.jogosPorId || {})[id];

    form.data.value = existente ? existente.data : info.c.data;
    form.modalidade.value = info.c.modalidade;
    form.fase.value = info.p.fase;
    form.faseTexto.value = info.p.fase;
    form.atletaA.value = existente ? existente.atletaA || "" : "";
    form.atletaB.value = existente ? existente.atletaB || "" : "";
    form.atletaA.placeholder = info.p.ladoA;
    form.atletaB.placeholder = info.p.ladoB;
    form.placar.value = existente ? existente.placar : "";
    form.placar.readOnly = !!(existente && existente.wo);
    form.vencedorLado.value = existente ? existente.vencedorLado || "" : "";
    const woCheckbox = document.getElementById("formJogoIndividualWO");
    if (woCheckbox) woCheckbox.checked = !!(existente && existente.wo);

    const contexto = document.getElementById("formJogoIndividualContexto");
    if (contexto) {
      contexto.hidden = false;
      contexto.textContent = existente
        ? `✏️ Editando resultado já lançado: ${info.c.modalidade} — ${info.p.fase}`
        : `🆕 Novo resultado: ${info.c.modalidade} — ${info.p.fase} (${info.p.ladoA} × ${info.p.ladoB})`;
    }

    form.scrollIntoView({ behavior: "smooth", block: "center" });
    form.classList.remove("form-realce");
    void form.offsetWidth;
    form.classList.add("form-realce");
    form.atletaA.focus();
  }

  document.getElementById("formJogoWO")?.addEventListener("change", (ev) => {
    const form = document.getElementById("formJogo");
    if (!form) return;
    if (ev.target.checked) {
      form.placar.value = "W.O.";
      form.placar.readOnly = true;
    } else {
      form.placar.readOnly = false;
      if (form.placar.value === "W.O.") form.placar.value = "";
    }
  });

  document.getElementById("formJogoIndividualWO")?.addEventListener("change", (ev) => {
    const form = document.getElementById("formJogoIndividual");
    if (!form) return;
    if (ev.target.checked) {
      form.placar.value = "W.O.";
      form.placar.readOnly = true;
    } else {
      form.placar.readOnly = false;
      if (form.placar.value === "W.O.") form.placar.value = "";
    }
  });

  document.getElementById("btnLimparFormJogo")?.addEventListener("click", () => {
    const form = document.getElementById("formJogo");
    if (!form) return;
    form.reset();
    form.fase.value = "";
    form.timeAId.value = "";
    form.timeBId.value = "";
    form.placar.readOnly = false;
    const selectVencedor = document.getElementById("formJogoVencedor");
    if (selectVencedor) selectVencedor.innerHTML = `<option value="">Selecione o vencedor…</option>`;
    const contexto = document.getElementById("formJogoContexto");
    if (contexto) contexto.hidden = true;
  });

  document.getElementById("btnLimparFormJogoIndividual")?.addEventListener("click", () => {
    const form = document.getElementById("formJogoIndividual");
    if (!form) return;
    form.reset();
    form.fase.value = "";
    form.placar.readOnly = false;
    const contexto = document.getElementById("formJogoIndividualContexto");
    if (contexto) contexto.hidden = true;
  });

  /* Chamado por js/firebase-app.js sempre que os resultados dos jogos
     mudam: (1) resolve "Vencedor SF1/2" e "Perdedor SF1/2" na Final e na
     Disputa de 3º Lugar assim que a semifinal correspondente tem
     resultado, atualizando o confronto exibido nos cards; (2) marca
     visualmente as partidas (de equipe ou individuais) que já têm
     resultado lançado, mostrando o placar direto no card. */
  window.atualizarCardsChaveado = function atualizarCardsChaveado() {
    document.querySelectorAll(".chaveado-partida[data-tipo='equipe']").forEach((el) => {
      const id = el.dataset.id;
      const info = partidaInfoPorId[id];
      if (!info) return;
      const calc = calcularPartidaEquipe(info);

      const confrontoEl = el.querySelector(".chaveado-partida-confronto");
      if (confrontoEl) {
        confrontoEl.innerHTML = `${renderTime(calc.timeA)} <span class="chaveado-x">×</span> ${renderTime(calc.timeB)} <span class="chaveado-partida-placar"></span>`;
      }

      const jogo = (window.jogosPorId || {})[id];
      const placarEl = el.querySelector(".chaveado-partida-placar");
      const hintEl = el.querySelector(".chaveado-partida-hint");
      if (jogo && jogo.placar) {
        el.classList.add("chaveado-partida-preenchida");
        if (placarEl) placarEl.textContent = `— ${jogo.placar}${jogo.wo ? " (W.O.)" : ""}`;
        if (hintEl) hintEl.textContent = "🔒 Clique para editar o resultado";
      } else {
        el.classList.remove("chaveado-partida-preenchida");
        if (hintEl) hintEl.textContent = "🔒 Clique para lançar o resultado";
      }
    });

    document.querySelectorAll(".chaveado-partida[data-tipo='individual']").forEach((el) => {
      const id = el.dataset.id;
      const jogo = (window.jogosPorId || {})[id];
      const placarEl = el.querySelector(".chaveado-partida-placar");
      const hintEl = el.querySelector(".chaveado-partida-hint");
      const nomesEl = el.querySelector(".chaveado-partida-nomes");
      if (jogo && jogo.placar) {
        el.classList.add("chaveado-partida-preenchida");
        if (nomesEl) nomesEl.textContent = `${jogo.atletaA || "?"} × ${jogo.atletaB || "?"}`;
        if (placarEl) placarEl.textContent = `— ${jogo.placar}${jogo.wo ? " (W.O.)" : ""}`;
        if (hintEl) hintEl.textContent = "🔒 Clique para editar o resultado";
      } else {
        el.classList.remove("chaveado-partida-preenchida");
        if (nomesEl) nomesEl.textContent = "";
        if (hintEl) hintEl.textContent = "🔒 Clique para lançar o resultado";
      }
    });
  };

  /* ---------------- Pontuação ---------------- */
  function renderPontuacao() {
    const grid = document.getElementById("pontuacaoEsportivaGrid");
    grid.innerHTML = PONTUACAO.colocacoes
      .map(
        (col, i) => `
      <div class="pontuacao-item">
        <strong>${PONTUACAO.esportiva[i]}</strong>
        <span>${col}</span>
      </div>`
      )
      .join("");
  }

  /* ---------------- Regulamento ---------------- */
  function renderRegulamento() {
    const grid = document.getElementById("regulamentoGrid");
    grid.innerHTML = REGULAMENTO_RESUMO.map(
      (r) => `
      <div class="regra-card">
        <h3>${r.titulo}</h3>
        <p>${r.texto}</p>
      </div>`
    ).join("");
  }

  /* ---------------- Init ---------------- */
  renderEquipes();
  renderModalidades();
  renderArtisticas();
  renderProgramacao();
  renderChaveado();
  renderPontuacao();
  renderRegulamento();
})();
