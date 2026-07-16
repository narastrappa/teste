/* ===================================================================
   Dados de exemplo do JIFAL — Campus Alagoinhas.
   A Comissão Organizadora pode editar estes arrays para atualizar
   modalidades, equipes, jogos e classificações sem tocar no HTML/CSS.
=================================================================== */

const LOCAIS = {
  ginasio: "Ginásio de Esportes de Alagoinhas",
  estadio: "Estádio Municipal Antônio Carneiro",
};

const MODALIDADES = [
  { id: "futsal-m", nome: "Futsal Masculino", icone: "⚽", info: LOCAIS.ginasio, tag: "Coletivo" },
  { id: "futsal-f", nome: "Futsal Feminino", icone: "⚽", info: LOCAIS.ginasio, tag: "Coletivo" },
  { id: "volei", nome: "Vôlei Misto", icone: "🏐", info: LOCAIS.ginasio, tag: "Coletivo" },
  { id: "basquete", nome: "Basquete 3x3", icone: "🏀", info: LOCAIS.ginasio, tag: "Coletivo" },
  { id: "handebol", nome: "Handebol", icone: "🤾", info: LOCAIS.ginasio, tag: "Coletivo" },
  { id: "queimada", nome: "Queimada", icone: "🎯", info: LOCAIS.ginasio, tag: "Coletivo" },
  { id: "xadrez", nome: "Xadrez", icone: "♟️", info: LOCAIS.ginasio, tag: "Individual" },
  { id: "tenis-mesa", nome: "Tênis de Mesa", icone: "🏓", info: LOCAIS.ginasio, tag: "Individual" },
  { id: "atletismo", nome: "Atletismo (100m)", icone: "🏃", info: LOCAIS.estadio, tag: "Individual" },
];

const EQUIPES = [
  { id: "agroecologia", nome: "Agroecologia", cor: "#2e8b3d", capitao: "Ana Souza", lema: "Raiz forte, time forte" },
  { id: "agroindustria", nome: "Agroindústria", cor: "#e07b1a", capitao: "Diego Rocha", lema: "Tempero de campeão" },
  { id: "informatica", nome: "Informática", cor: "#1f6fb2", capitao: "Lucas Farias", lema: "Compilando vitórias" },
  { id: "servidores", nome: "Servidores", cor: "#7b2d8e", capitao: "Rafaela Dias", lema: "Experiência em jogo" },
];

/* status: "agendado" | "ao-vivo" | "encerrado" */
const JOGOS = [
  { data: "22/10", dia: "22/10", hora: "08:00", modalidade: "futsal-m", timeA: "agroecologia", timeB: "informatica", local: LOCAIS.ginasio, placar: "3 x 1", status: "encerrado" },
  { data: "22/10", dia: "22/10", hora: "09:30", modalidade: "futsal-f", timeA: "agroindustria", timeB: "servidores", local: LOCAIS.ginasio, placar: "2 x 2", status: "encerrado" },
  { data: "22/10", dia: "22/10", hora: "14:00", modalidade: "xadrez", timeA: "informatica", timeB: "servidores", local: LOCAIS.ginasio, placar: "—", status: "encerrado" },
  { data: "23/10", dia: "23/10", hora: "08:00", modalidade: "volei", timeA: "agroecologia", timeB: "agroindustria", local: LOCAIS.ginasio, placar: "2 x 0", status: "encerrado" },
  { data: "23/10", dia: "23/10", hora: "10:00", modalidade: "basquete", timeA: "informatica", timeB: "servidores", local: LOCAIS.ginasio, placar: "18 x 15", status: "encerrado" },
  { data: "23/10", dia: "23/10", hora: "15:00", modalidade: "handebol", timeA: "agroecologia", timeB: "servidores", local: LOCAIS.ginasio, placar: "—", status: "agendado" },
  { data: "24/10", dia: "24/10", hora: "08:30", modalidade: "queimada", timeA: "agroindustria", timeB: "informatica", local: LOCAIS.ginasio, placar: "—", status: "agendado" },
  { data: "24/10", dia: "24/10", hora: "11:00", modalidade: "tenis-mesa", timeA: "agroecologia", timeB: "servidores", local: LOCAIS.ginasio, placar: "—", status: "agendado" },
  { data: "24/10", dia: "24/10", hora: "16:00", modalidade: "futsal-m", timeA: "agroindustria", timeB: "informatica", local: LOCAIS.ginasio, placar: "—", status: "ao-vivo" },
  { data: "27/10", dia: "27/10", hora: "08:00", modalidade: "atletismo", timeA: "agroecologia", timeB: "informatica", local: LOCAIS.estadio, placar: "—", status: "agendado" },
  { data: "27/10", dia: "27/10", hora: "09:00", modalidade: "volei", timeA: "agroindustria", timeB: "servidores", local: LOCAIS.ginasio, placar: "—", status: "agendado" },
  { data: "30/10", dia: "30/10", hora: "18:00", modalidade: "futsal-m", timeA: "agroecologia", timeB: "agroindustria", local: LOCAIS.ginasio, placar: "—", status: "agendado" },
];

/* Classificação por modalidade: equipe, j, v, e, d, pts */
const CLASSIFICACAO = {
  "futsal-m": [
    { equipe: "agroecologia", j: 3, v: 3, e: 0, d: 0, pts: 9 },
    { equipe: "agroindustria", j: 3, v: 2, e: 0, d: 1, pts: 6 },
    { equipe: "informatica", j: 3, v: 1, e: 0, d: 2, pts: 3 },
    { equipe: "servidores", j: 3, v: 0, e: 0, d: 3, pts: 0 },
  ],
  "futsal-f": [
    { equipe: "agroindustria", j: 2, v: 1, e: 1, d: 0, pts: 4 },
    { equipe: "servidores", j: 2, v: 1, e: 1, d: 0, pts: 4 },
    { equipe: "agroecologia", j: 2, v: 0, e: 1, d: 1, pts: 1 },
    { equipe: "informatica", j: 2, v: 0, e: 1, d: 1, pts: 1 },
  ],
  "volei": [
    { equipe: "informatica", j: 2, v: 2, e: 0, d: 0, pts: 6 },
    { equipe: "agroecologia", j: 1, v: 1, e: 0, d: 0, pts: 3 },
    { equipe: "agroindustria", j: 2, v: 0, e: 0, d: 2, pts: 0 },
    { equipe: "servidores", j: 1, v: 0, e: 0, d: 1, pts: 0 },
  ],
  "basquete": [
    { equipe: "informatica", j: 1, v: 1, e: 0, d: 0, pts: 3 },
    { equipe: "servidores", j: 1, v: 0, e: 0, d: 1, pts: 0 },
  ],
  "handebol": [
    { equipe: "agroecologia", j: 0, v: 0, e: 0, d: 0, pts: 0 },
    { equipe: "servidores", j: 0, v: 0, e: 0, d: 0, pts: 0 },
  ],
  "queimada": [
    { equipe: "agroindustria", j: 0, v: 0, e: 0, d: 0, pts: 0 },
    { equipe: "informatica", j: 0, v: 0, e: 0, d: 0, pts: 0 },
  ],
  "xadrez": [
    { equipe: "informatica", j: 1, v: 1, e: 0, d: 0, pts: 3 },
    { equipe: "servidores", j: 1, v: 0, e: 0, d: 1, pts: 0 },
  ],
  "tenis-mesa": [
    { equipe: "agroecologia", j: 0, v: 0, e: 0, d: 0, pts: 0 },
    { equipe: "servidores", j: 0, v: 0, e: 0, d: 0, pts: 0 },
  ],
  "atletismo": [
    { equipe: "agroecologia", j: 0, v: 0, e: 0, d: 0, pts: 0 },
    { equipe: "informatica", j: 0, v: 0, e: 0, d: 0, pts: 0 },
  ],
};

/* Quadro geral de medalhas (consolidado de todas as modalidades) */
const MEDALHAS = [
  { equipe: "agroecologia", ouro: 3, prata: 1, bronze: 1 },
  { equipe: "agroindustria", ouro: 2, prata: 2, bronze: 0 },
  { equipe: "informatica", ouro: 1, prata: 2, bronze: 1 },
  { equipe: "servidores", ouro: 0, prata: 1, bronze: 2 },
];

/* Data/hora oficial de abertura do JIFAL, usada na contagem regressiva */
const DATA_INICIO_JIFAL = new Date("2026-10-22T08:00:00-03:00");
