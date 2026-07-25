/* ===================================================================
   Login com Google + resultados dos jogos + classificação geral.

   Este arquivo é um ES module (carregado com <script type="module">).
   Ele depende de window.EQUIPES, window.MODALIDADES_ESPORTIVAS,
   window.PROVAS_ARTISTICAS e window.PONTUACAO, definidos em js/data.js
   (script clássico, carregado antes deste).

   Qualquer visitante pode VER os resultados e a classificação.
   Só quem logar com o e-mail definido em ADMIN_EMAIL (js/firebase-config.js)
   enxerga os formulários para lançar novos resultados — e mesmo assim,
   quem impede de fato outras pessoas de gravar é a regra do Firestore
   (firestore.rules), não esta tela.
=================================================================== */

import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const authArea = document.getElementById("authArea");
const adminBlocks = document.querySelectorAll(".admin-only");

const CONFIGURADO = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("SUBSTITUA");

function mostrarAviso(mensagem) {
  authArea.innerHTML = `<p class="auth-aviso">⚠️ ${mensagem}</p>`;
}

function popularSelectsEstaticos() {
  const modalidades = window.MODALIDADES_ESPORTIVAS || [];
  const equipes = window.EQUIPES || [];

  const selectModalidade = document.getElementById("selectModalidadeColocacao");
  if (selectModalidade) {
    selectModalidade.innerHTML = modalidades
      .map((m) => `<option value="${m.nome}">${m.nome}</option>`)
      .join("");
  }

  const colocacaoEquipes = document.getElementById("colocacaoEquipes");
  if (colocacaoEquipes) {
    const opcoesEquipe = `<option value="">— sem colocação —</option>` +
      equipes.map((e) => `<option value="${e.id}">Equipe ${e.numero} — ${e.torcida}</option>`).join("");
    colocacaoEquipes.innerHTML = ["1º", "2º", "3º", "4º"]
      .map(
        (rotulo, i) => `
      <label>${rotulo} lugar
        <select name="c${i + 1}">${opcoesEquipe}</select>
      </label>`
      )
      .join("");
  }

  const notasEquipes = document.getElementById("notasEquipes");
  if (notasEquipes) {
    notasEquipes.innerHTML = equipes
      .map(
        (e, i) => `
      <label>Equipe ${e.numero} — ${e.torcida}
        <input type="number" name="n${i + 1}" min="0" max="10" step="0.1" value="0" required>
      </label>`
      )
      .join("");
  }
}

popularSelectsEstaticos();

if (!CONFIGURADO) {
  mostrarAviso(
    'Login administrativo ainda não configurado. Preencha <code>js/firebase-config.js</code> com as chaves do seu projeto Firebase (veja os comentários no arquivo).'
  );
} else {
  iniciarFirebase().catch((erro) => {
    console.error("Falha ao carregar o Firebase:", erro);
    mostrarAviso(
      "Não foi possível carregar o sistema de login agora. Os demais conteúdos do site continuam funcionando normalmente."
    );
  });
}

async function iniciarFirebase() {
  const { initializeApp } = await import(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js"
  );
  const {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
  } = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js");
  const {
    getFirestore,
    collection,
    doc,
    setDoc,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
  } = await import("https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js");

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const provider = new GoogleAuthProvider();

  let admin = false;

  function renderAuthUI(user) {
    admin = !!user && user.email === ADMIN_EMAIL;

    if (user) {
      authArea.innerHTML = `
        <div class="auth-logado">
          ${user.photoURL ? `<img src="${user.photoURL}" alt="" class="auth-avatar">` : ""}
          <span>Logado(a) como <strong>${user.displayName || user.email}</strong>${admin ? " · Administrador(a)" : ""}</span>
          <button type="button" id="btnSair" class="btn btn-ghost-sm">Sair</button>
        </div>
        ${!admin ? '<p class="auth-aviso">Você está logado(a), mas este e-mail não tem permissão para lançar resultados.</p>' : ""}
      `;
      document.getElementById("btnSair").addEventListener("click", () => signOut(auth));
    } else {
      authArea.innerHTML = `
        <button type="button" id="btnEntrar" class="btn btn-primary-sm">
          Entrar com Google para lançar resultados
        </button>`;
      document.getElementById("btnEntrar").addEventListener("click", () => {
        signInWithPopup(auth, provider).catch((erro) => {
          alert("Não foi possível entrar: " + erro.message);
        });
      });
    }

    adminBlocks.forEach((el) => {
      el.style.display = admin ? "" : "none";
    });
  }

  onAuthStateChanged(auth, renderAuthUI);

  /* ---------------- Resultados dos jogos (feed público) ---------------- */
  const jogosCol = collection(db, "jogos");

  onSnapshot(query(jogosCol, orderBy("criadoEm", "desc")), (snap) => {
    const tbody = document.querySelector("#tabelaResultadosJogos tbody");
    if (!tbody) return;
    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="5">Nenhum resultado divulgado ainda. Volte durante o JIIFAL!</td></tr>`;
      return;
    }
    tbody.innerHTML = snap.docs
      .map((d) => {
        const j = d.data();
        return `
        <tr>
          <td>${j.data || ""}</td>
          <td>${j.modalidade || ""}</td>
          <td>${j.genero || ""}</td>
          <td>${j.confronto || ""}</td>
          <td><strong>${j.placar || ""}</strong></td>
        </tr>`;
      })
      .join("");
  }, (erro) => {
    console.error("Erro ao ler jogos:", erro);
  });

  document.getElementById("formJogo")?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!admin) return;
    const f = ev.target;
    await addDoc(jogosCol, {
      data: f.data.value,
      modalidade: f.modalidade.value,
      genero: f.genero.value,
      confronto: f.confronto.value,
      placar: f.placar.value,
      criadoEm: serverTimestamp(),
    });
    f.reset();
  });

  /* ---------------- Colocações → Classificação Geral (Art. 20) ---------------- */
  const colocacoesCol = collection(db, "colocacoes");
  const equipes = window.EQUIPES || [];
  const pontosEsportiva = (window.PONTUACAO && window.PONTUACAO.esportiva) || [5, 3, 2, 1];

  onSnapshot(colocacoesCol, (snap) => {
    const totais = Object.fromEntries(equipes.map((e) => [e.id, 0]));

    snap.forEach((d) => {
      const c = d.data();
      if (c.tipo === "esportiva" && Array.isArray(c.colocacao)) {
        c.colocacao.forEach((equipeId, idx) => {
          if (equipeId && totais[equipeId] !== undefined) {
            totais[equipeId] += pontosEsportiva[idx] || 0;
          }
        });
      } else if (c.tipo === "artistica" && c.notas) {
        Object.entries(c.notas).forEach(([equipeId, pontos]) => {
          if (totais[equipeId] !== undefined) totais[equipeId] += Number(pontos) || 0;
        });
      }
    });

    const tbody = document.querySelector("#tabelaClassificacaoGeral tbody");
    if (!tbody) return;
    const ranking = equipes
      .map((e) => ({ e, pontos: totais[e.id] || 0 }))
      .sort((a, b) => b.pontos - a.pontos);
    tbody.innerHTML = ranking
      .map(
        (r, i) => `
      <tr>
        <td>${i + 1}º</td>
        <td><span class="equipe-color-dot" style="background:${r.e.hex}"></span>Equipe ${r.e.numero} — ${r.e.torcida} (${r.e.cor})</td>
        <td><strong>${r.pontos}</strong></td>
      </tr>`
      )
      .join("");
  }, (erro) => {
    console.error("Erro ao ler colocações:", erro);
  });

  document.getElementById("formColocacaoEsportiva")?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!admin) return;
    const f = ev.target;
    const id = `esportiva__${slug(f.modalidade.value)}__${slug(f.genero.value)}`;
    await setDoc(doc(db, "colocacoes", id), {
      tipo: "esportiva",
      modalidade: f.modalidade.value,
      genero: f.genero.value,
      colocacao: [f.c1.value, f.c2.value, f.c3.value, f.c4.value],
      atualizadoEm: serverTimestamp(),
    });
    alert("Colocação salva! A Classificação Geral já foi atualizada.");
  });

  document.getElementById("formColocacaoArtistica")?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!admin) return;
    const f = ev.target;
    const id = `artistica__${slug(f.prova.value)}`;
    await setDoc(doc(db, "colocacoes", id), {
      tipo: "artistica",
      modalidade: f.prova.value,
      notas: {
        "equipe-1": Number(f.n1.value) || 0,
        "equipe-2": Number(f.n2.value) || 0,
        "equipe-3": Number(f.n3.value) || 0,
        "equipe-4": Number(f.n4.value) || 0,
      },
      atualizadoEm: serverTimestamp(),
    });
    alert("Notas salvas! A Classificação Geral já foi atualizada.");
  });
}

function slug(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
