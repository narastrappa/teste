/* ===================================================================
   Dados de exemplo do JIFAL — Campus Alagoinhas.
   A Comissão Organizadora pode editar estes arrays para atualizar
   modalidades, equipes, jogos e classificações sem tocar no HTML/CSS.
=================================================================== */

const MODALIDADES = [
  { id: "futsal-m", nome: "Futsal Masculino", icone: "⚽", info: "Quadra poliesportiva", tag: "Coletivo" },
  { id: "futsal-f", nome: "Futsal Feminino", icone: "⚽", info: "Quadra poliesportiva", tag: "Coletivo" },
  { id: "volei", nome: "Vôlei Misto", icone: "🏐", info: "Quadra poliesportiva", tag: "Coletivo" },
  { id: "basquete", nome: "Basquete 3x3", icone: "🏀", info: "Quadra externa", tag: "Coletivo" },
  { id: "handebol", nome: "Handebol", icone: "🤾", info: "Quadra poliesportiva", tag: "Coletivo" },
  { id: "queimada", nome: "Queimada", icone: "🎯", info: "Quadra externa", tag: "Coletivo" },
  { id: "xadrez", nome: "Xadrez", icone: "♟️", info: "Biblioteca", tag: "Individual" },
  { id: "tenis-mesa", nome: "Tênis de Mesa", icone: "🏓", info: "Ginásio", tag: "Individual" },
  { id: "atletismo", nome: "Atletismo (100m)", icone: "🏃", info: "Pista externa", tag: "Individual" },
];

const EQUIPES = [
  { id: "agro", nome: "Agropecuária", cor: "#0f5c3d", capitao: "Ana Souza", lema: "Raiz forte, time forte" },
  { id: "info", nome: "Informática", cor: "#1c7a4f", capitao: "Lucas Farias", lema: "Compilando vitórias" },
  { id: "quimica", nome: "Química", cor: "#4caf6d", capitao: "Beatriz Nunes", lema: "Reação em cadeia" },
  { id: "admin", nome: "Administração", cor: "#c99a02", capitao: "Pedro Lima", lema: "Gestão de resultados" },
  { id: "meioamb", nome: "Meio Ambiente", cor: "#2e8b57", capitao: "Rafaela Dias", lema: "Sustentando o jogo" },
  { id: "alimentos", nome: "Alimentos", cor: "#f2b705", capitao: "Diego Rocha", lema: "Tempero de campeão" },
];

/* status: "agendado" | "ao-vivo" | "encerrado" */
const JOGOS = [
  { data: "22/10", dia: "22/10", hora: "08:00", modalidade: "futsal-m", timeA: "agro", timeB: "info", local: "Quadra 1", placar: "3 x 1", status: "encerrado" },
  { data: "22/10", dia: "22/10", hora: "09:30", modalidade: "futsal-f", timeA: "quimica", timeB: "admin", local: "Quadra 1", placar: "2 x 2", status: "encerrado" },
  { data: "22/10", dia: "22/10", hora: "14:00", modalidade: "xadrez", timeA: "meioamb", timeB: "alimentos", local: "Biblioteca", placar: "—", status: "encerrado" },
  { data: "23/10", dia: "23/10", hora: "08:00", modalidade: "volei", timeA: "info", timeB: "meioamb", local: "Quadra 2", placar: "2 x 0", status: "encerrado" },
  { data: "23/10", dia: "23/10", hora: "10:00", modalidade: "basquete", timeA: "agro", timeB: "alimentos", local: "Quadra externa", placar: "18 x 15", status: "encerrado" },
  { data: "23/10", dia: "23/10", hora: "15:00", modalidade: "handebol", timeA: "admin", timeB: "quimica", local: "Ginásio", placar: "—", status: "agendado" },
  { data: "24/10", dia: "24/10", hora: "08:30", modalidade: "queimada", timeA: "alimentos", timeB: "info", local: "Quadra externa", placar: "—", status: "agendado" },
  { data: "24/10", dia: "24/10", hora: "11:00", modalidade: "tenis-mesa", timeA: "agro", timeB: "meioamb", local: "Ginásio", placar: "—", status: "agendado" },
  { data: "24/10", dia: "24/10", hora: "16:00", modalidade: "futsal-m", timeA: "quimica", timeB: "admin", local: "Quadra 1", placar: "—", status: "ao-vivo" },
  { data: "27/10", dia: "27/10", hora: "08:00", modalidade: "atletismo", timeA: "agro", timeB: "info", local: "Pista externa", placar: "—", status: "agendado" },
  { data: "27/10", dia: "27/10", hora: "09:00", modalidade: "volei", timeA: "quimica", timeB: "alimentos", local: "Quadra 2", placar: "—", status: "agendado" },
  { data: "30/10", dia: "30/10", hora: "18:00", modalidade: "futsal-m", timeA: "agro", timeB: "quimica", local: "Quadra 1", placar: "—", status: "agendado" },
];

/* Classificação por modalidade: pos, equipe, j, v, e, d, pts */
const CLASSIFICACAO = {
  "futsal-m": [
    { equipe: "agro", j: 3, v: 3, e: 0, d: 0, pts: 9 },
    { equipe: "quimica", j: 3, v: 2, e: 0, d: 1, pts: 6 },
    { equipe: "info", j: 3, v: 1, e: 0, d: 2, pts: 3 },
    { equipe: "admin", j: 3, v: 0, e: 0, d: 3, pts: 0 },
  ],
  "futsal-f": [
    { equipe: "quimica", j: 2, v: 1, e: 1, d: 0, pts: 4 },
    { equipe: "admin", j: 2, v: 1, e: 1, d: 0, pts: 4 },
    { equipe: "meioamb", j: 2, v: 0, e: 1, d: 1, pts: 1 },
    { equipe: "alimentos", j: 2, v: 0, e: 1, d: 1, pts: 1 },
  ],
  "volei": [
    { equipe: "info", j: 2, v: 2, e: 0, d: 0, pts: 6 },
    { equipe: "quimica", j: 1, v: 1, e: 0, d: 0, pts: 3 },
    { equipe: "meioamb", j: 2, v: 0, e: 0, d: 2, pts: 0 },
    { equipe: "alimentos", j: 1, v: 0, e: 0, d: 1, pts: 0 },
  ],
  "basquete": [
    { equipe: "agro", j: 1, v: 1, e: 0, d: 0, pts: 3 },
    { equipe: "alimentos", j: 1, v: 0, e: 0, d: 1, pts: 0 },
  ],
  "handebol": [
    { equipe: "admin", j: 0, v: 0, e: 0, d: 0, pts: 0 },
    { equipe: "quimica", j: 0, v: 0, e: 0, d: 0, pts: 0 },
  ],
  "queimada": [
    { equipe: "alimentos", j: 0, v: 0, e: 0, d: 0, pts: 0 },
    { equipe: "info", j: 0, v: 0, e: 0, d: 0, pts: 0 },
  ],
  "xadrez": [
    { equipe: "meioamb", j: 1, v: 1, e: 0, d: 0, pts: 3 },
    { equipe: "alimentos", j: 1, v: 0, e: 0, d: 1, pts: 0 },
  ],
  "tenis-mesa": [
    { equipe: "agro", j: 0, v: 0, e: 0, d: 0, pts: 0 },
    { equipe: "meioamb", j: 0, v: 0, e: 0, d: 0, pts: 0 },
  ],
  "atletismo": [
    { equipe: "agro", j: 0, v: 0, e: 0, d: 0, pts: 0 },
    { equipe: "info", j: 0, v: 0, e: 0, d: 0, pts: 0 },
  ],
};

/* Quadro geral de medalhas (consolidado de todas as modalidades) */
const MEDALHAS = [
  { equipe: "agro", ouro: 3, prata: 1, bronze: 1 },
  { equipe: "quimica", ouro: 2, prata: 2, bronze: 0 },
  { equipe: "info", ouro: 1, prata: 2, bronze: 1 },
  { equipe: "meioamb", ouro: 1, prata: 0, bronze: 1 },
  { equipe: "admin", ouro: 0, prata: 1, bronze: 2 },
  { equipe: "alimentos", ouro: 0, prata: 1, bronze: 1 },
];

/* Data/hora oficial de abertura do JIFAL, usada na contagem regressiva */
const DATA_INICIO_JIFAL = new Date("2026-10-22T08:00:00-03:00");
