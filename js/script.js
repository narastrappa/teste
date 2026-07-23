(function () {
  "use strict";

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
  renderPontuacao();
  renderRegulamento();
})();
