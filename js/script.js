(function () {
  "use strict";

  const equipeById = Object.fromEntries(EQUIPES.map((e) => [e.id, e]));
  const modalidadeById = Object.fromEntries(MODALIDADES.map((m) => [m.id, m]));

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

  /* ---------------- Contagem regressiva ---------------- */
  function atualizarContagem() {
    const agora = new Date();
    let diff = DATA_INICIO_JIFAL - agora;
    if (diff < 0) diff = 0;

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const min = Math.floor((diff / (1000 * 60)) % 60);
    const seg = Math.floor((diff / 1000) % 60);

    const pad = (n) => String(n).padStart(2, "0");
    document.getElementById("cd-dias").textContent = pad(dias);
    document.getElementById("cd-horas").textContent = pad(horas);
    document.getElementById("cd-min").textContent = pad(min);
    document.getElementById("cd-seg").textContent = pad(seg);
  }
  atualizarContagem();
  setInterval(atualizarContagem, 1000);

  /* ---------------- Modalidades ---------------- */
  function renderModalidades() {
    const grid = document.getElementById("modalidadesGrid");
    grid.innerHTML = MODALIDADES.map(
      (m) => `
      <div class="card">
        <div class="card-icon">${m.icone}</div>
        <h3>${m.nome}</h3>
        <p>${m.info}</p>
        <span class="tag">${m.tag}</span>
      </div>`
    ).join("");
  }

  /* ---------------- Equipes ---------------- */
  function renderEquipes() {
    const grid = document.getElementById("equipesGrid");
    grid.innerHTML = EQUIPES.map(
      (e) => `
      <div class="card equipe-card" style="--cor-equipe:${e.cor}">
        <h3><span class="equipe-color-dot"></span>${e.nome}</h3>
        <p>“${e.lema}”</p>
        <p class="capitao">Capitão(ã): ${e.capitao}</p>
      </div>`
    ).join("");
  }

  /* ---------------- Tabela de jogos ---------------- */
  const filtroModalidade = document.getElementById("filtroModalidade");
  const filtroDia = document.getElementById("filtroDia");
  const filtroStatus = document.getElementById("filtroStatus");
  const tabelaJogosBody = document.querySelector("#tabelaJogos tbody");

  function popularFiltros() {
    MODALIDADES.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.nome;
      filtroModalidade.appendChild(opt);
    });

    const dias = [...new Set(JOGOS.map((j) => j.dia))];
    dias.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.textContent = d;
      filtroDia.appendChild(opt);
    });
  }

  const statusLabel = {
    agendado: "Agendado",
    "ao-vivo": "Ao vivo",
    encerrado: "Encerrado",
  };

  function renderJogos() {
    const fm = filtroModalidade.value;
    const fd = filtroDia.value;
    const fs = filtroStatus.value;

    const lista = JOGOS.filter(
      (j) =>
        (fm === "todas" || j.modalidade === fm) &&
        (fd === "todos" || j.dia === fd) &&
        (fs === "todos" || j.status === fs)
    );

    if (lista.length === 0) {
      tabelaJogosBody.innerHTML = `<tr class="empty-row"><td colspan="7">Nenhum jogo encontrado para este filtro.</td></tr>`;
      return;
    }

    tabelaJogosBody.innerHTML = lista
      .map((j) => {
        const mod = modalidadeById[j.modalidade];
        const eqA = equipeById[j.timeA];
        const eqB = equipeById[j.timeB];
        return `
        <tr>
          <td>${j.data}</td>
          <td>${j.hora}</td>
          <td>${mod.icone} ${mod.nome}</td>
          <td>${eqA.nome} <strong>x</strong> ${eqB.nome}</td>
          <td>${j.local}</td>
          <td>${j.placar}</td>
          <td><span class="status-pill status-${j.status}">${statusLabel[j.status]}</span></td>
        </tr>`;
      })
      .join("");
  }

  [filtroModalidade, filtroDia, filtroStatus].forEach((el) =>
    el.addEventListener("change", renderJogos)
  );

  /* ---------------- Classificação por modalidade (tabs) ---------------- */
  const tabsWrap = document.getElementById("resultadosTabs");
  const tabelaClassBody = document.querySelector("#tabelaClassificacao tbody");
  let modalidadeAtiva = MODALIDADES[0].id;

  function renderTabs() {
    tabsWrap.innerHTML = MODALIDADES.filter((m) => CLASSIFICACAO[m.id])
      .map(
        (m) =>
          `<button class="tab-btn${m.id === modalidadeAtiva ? " active" : ""}" data-mod="${m.id}" role="tab">${m.icone} ${m.nome}</button>`
      )
      .join("");

    tabsWrap.querySelectorAll(".tab-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        modalidadeAtiva = btn.dataset.mod;
        renderTabs();
        renderClassificacao();
      })
    );
  }

  function renderClassificacao() {
    const lista = (CLASSIFICACAO[modalidadeAtiva] || [])
      .slice()
      .sort((a, b) => b.pts - a.pts);

    if (lista.length === 0) {
      tabelaClassBody.innerHTML = `<tr class="empty-row"><td colspan="7">Classificação ainda não disponível.</td></tr>`;
      return;
    }

    tabelaClassBody.innerHTML = lista
      .map((l, i) => {
        const eq = equipeById[l.equipe];
        return `
        <tr>
          <td class="${i === 0 ? "rank-1" : ""}">${i + 1}º</td>
          <td><span class="equipe-color-dot" style="background:${eq.cor}"></span>${eq.nome}</td>
          <td>${l.j}</td>
          <td>${l.v}</td>
          <td>${l.e}</td>
          <td>${l.d}</td>
          <td><strong>${l.pts}</strong></td>
        </tr>`;
      })
      .join("");
  }

  /* ---------------- Quadro de medalhas ---------------- */
  function renderMedalhas() {
    const body = document.querySelector("#tabelaMedalhas tbody");
    const lista = MEDALHAS.map((m) => ({ ...m, total: m.ouro + m.prata + m.bronze }))
      .sort((a, b) => b.ouro - a.ouro || b.prata - a.prata || b.bronze - a.bronze);

    body.innerHTML = lista
      .map((m, i) => {
        const eq = equipeById[m.equipe];
        return `
        <tr>
          <td class="${i === 0 ? "rank-1" : ""}">${i + 1}º</td>
          <td><span class="equipe-color-dot" style="background:${eq.cor}"></span>${eq.nome}</td>
          <td>${m.ouro}</td>
          <td>${m.prata}</td>
          <td>${m.bronze}</td>
          <td><strong>${m.total}</strong></td>
        </tr>`;
      })
      .join("");
  }

  /* ---------------- Init ---------------- */
  popularFiltros();
  renderModalidades();
  renderEquipes();
  renderJogos();
  renderTabs();
  renderClassificacao();
  renderMedalhas();
})();
