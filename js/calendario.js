let CAL_DADOS = null;

async function iniciarCalendario() {
  CAL_DADOS = await carregarDados();
  preencherFiltroModalidades(CAL_DADOS.modalidades);

  document.getElementById("filtro-modalidade").addEventListener("change", renderizarCalendario);
  document.getElementById("filtro-status").addEventListener("change", renderizarCalendario);

  renderizarCalendario();
}

function preencherFiltroModalidades(modalidades) {
  const select = document.getElementById("filtro-modalidade");
  modalidades.forEach((m) => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = `${m.icone} ${m.nome}`;
    select.appendChild(opt);
  });
}

function renderizarCalendario() {
  const { modalidades, times, jogos } = CAL_DADOS;
  const modalidadesPorId = porId(modalidades);
  const timesPorId = porId(times);

  const modalidadeFiltro = document.getElementById("filtro-modalidade").value;
  const statusFiltro = document.getElementById("filtro-status").value;

  let lista = [...jogos];
  if (modalidadeFiltro) lista = lista.filter((j) => j.modalidadeId === modalidadeFiltro);
  if (statusFiltro) lista = lista.filter((j) => j.status === statusFiltro);
  lista.sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`));

  const host = document.getElementById("lista-jogos");
  host.innerHTML = "";

  if (lista.length === 0) {
    host.innerHTML = '<p class="empty-state">Nenhum jogo encontrado para esse filtro.</p>';
    return;
  }

  let dataAtual = null;
  lista.forEach((jogo) => {
    if (jogo.data !== dataAtual) {
      dataAtual = jogo.data;
      const titulo = document.createElement("div");
      titulo.className = "dia-titulo";
      titulo.textContent = formatarDataCompleta(dataAtual);
      host.appendChild(titulo);
    }
    host.appendChild(criarItemJogo(jogo, modalidadesPorId, timesPorId));
  });
}

document.addEventListener("DOMContentLoaded", iniciarCalendario);
