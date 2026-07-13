// Funções utilitárias compartilhadas entre as páginas.

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Falha ao carregar ${path}: ${res.status}`);
  return res.json();
}

async function carregarDados() {
  const [modalidades, times, jogos, noticias] = await Promise.all([
    fetchJSON("data/modalidades.json"),
    fetchJSON("data/times.json"),
    fetchJSON("data/jogos.json"),
    fetchJSON("data/noticias.json"),
  ]);
  return { modalidades, times, jogos, noticias };
}

function porId(lista) {
  const mapa = {};
  for (const item of lista) mapa[item.id] = item;
  return mapa;
}

const DIAS_SEMANA = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado",
];
const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function parseDataLocal(dataStr) {
  const [ano, mes, dia] = dataStr.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function formatarDataCurta(dataStr) {
  const d = parseDataLocal(dataStr);
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]}`;
}

function formatarDataCompleta(dataStr) {
  const d = parseDataLocal(dataStr);
  return `${DIAS_SEMANA[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} de ${MESES[d.getMonth()]}`;
}

function formatarDataHora(dataStr, horaStr) {
  return `${formatarDataCurta(dataStr)} · ${horaStr}`;
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function elemento(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

function nomeComBolinha(time) {
  return `<span class="time-dot" style="background:${escapeHTML(time.cor)}"></span>${escapeHTML(time.nome)}`;
}

function criarItemJogo(jogo, modalidadesPorId, timesPorId) {
  const modalidade = modalidadesPorId[jogo.modalidadeId];
  const timeA = jogo.timeA ? timesPorId[jogo.timeA] : null;
  const timeB = jogo.timeB ? timesPorId[jogo.timeB] : null;

  const nomesTimes = timeA && timeB
    ? `${nomeComBolinha(timeA)} <span aria-hidden="true">×</span> ${nomeComBolinha(timeB)}`
    : escapeHTML(jogo.observacao || "A definir");

  const placar = jogo.status === "realizado" && jogo.placarA !== null
    ? `${jogo.placarA} - ${jogo.placarB}`
    : "";

  return elemento(`
    <div class="jogo-item">
      <div class="jogo-modalidade" title="${escapeHTML(modalidade?.nome || "")}">${modalidade?.icone || "🏆"}</div>
      <div class="jogo-info">
        <div class="jogo-times">${nomesTimes}</div>
        <div class="jogo-meta">
          ${escapeHTML(modalidade?.nome || "")} · ${escapeHTML(jogo.fase || "")} · ${formatarDataHora(jogo.data, jogo.hora)} · ${escapeHTML(jogo.local)}
          <span class="badge ${jogo.status === "realizado" ? "badge-realizado" : "badge-agendado"}">
            ${jogo.status === "realizado" ? "Realizado" : "Agendado"}
          </span>
        </div>
      </div>
      <div class="jogo-placar">${placar}</div>
    </div>
  `);
}
