/* ===================================================================
   JIIFAL 2026 — Jogos Internos IF Baiano, Campus Alagoinhas.
   Dados extraídos estritamente da Minuta do Regulamento Geral dos
   Jogos Internos IF Baiano - Campus Alagoinhas (JIIFAL) e do card
   oficial de apresentação das equipes.
   A Comissão Organizadora pode editar estes dados conforme o
   regulamento final for publicado (chaveado, horários, locais etc.).
=================================================================== */

const EVENTO = {
  sigla: "JIIFAL",
  nome: "Jogos Internos do IF Baiano - Campus Alagoinhas",
  tagline: "Esporte, Integração e Respeito!",
  dataInicio: "2026-08-05",
  dataFim: "2026-08-07",
  dataInicioExtenso: "05 de agosto de 2026",
  dataFimExtenso: "07 de agosto de 2026",
  locais: [
    "Ginásio Poliesportivo Educacional de Alagoinhas",
    "Estádio Antônio de Figueiredo Carneiro (Carneirão)",
  ],
};

/* Art. 10 e seguintes — sorteio, inscrições e divulgação do chaveado */
const DATAS_IMPORTANTES = [
  { data: "08/07/2026", evento: "Sorteio das equipes" },
  { data: "28/07 a 30/07/2026", evento: "Inscrições das modalidades esportivas (até 23h59 do dia 30/07)" },
  { data: "29/07/2026", evento: "Prazo para envio do link do Instagram da equipe e da trilha sonora da Prova de Abertura (até 23h59)" },
  { data: "31/07/2026", evento: "Prazo para envio da trilha sonora do Show de Talentos e divulgação do chaveado (até 23h59)" },
  { data: "05 a 07/08/2026", evento: "Realização do JIIFAL 2026" },
];

/* DAS EQUIPES — nomes, homenageadas, mascotes, cores e turmas conforme regulamento e card oficial */
const EQUIPES = [
  {
    id: "equipe-1",
    numero: 1,
    homenageada: "Hortência",
    mascote: "Coruja",
    cor: "Azul",
    hex: "#1958c9",
    hexEscuro: "#123f94",
    turmas: [
      "1º B Agroindústria",
      "1º B Agroecologia",
      "2º A Agroindústria",
      "3º B Agroindústria",
    ],
  },
  {
    id: "equipe-2",
    numero: 2,
    homenageada: "Rebeca Andrade",
    mascote: "Abelha",
    cor: "Amarela",
    hex: "#f0b90b",
    hexEscuro: "#c99502",
    turmas: [
      "1º Informática",
      "2º B Agroecologia",
      "2º Informática",
      "3º B Agroecologia",
    ],
  },
  {
    id: "equipe-3",
    numero: 3,
    homenageada: "Raíssa Leal",
    mascote: "Tatu",
    cor: "Vermelha",
    hex: "#d1222e",
    hexEscuro: "#9c0f1a",
    turmas: [
      "2º A Agroecologia",
      "3º A Agroindústria",
      "3º Informática",
      "1º A Agroindústria",
    ],
  },
  {
    id: "equipe-4",
    numero: 4,
    homenageada: "Marta",
    mascote: "Raposa",
    cor: "Laranja",
    hex: "#ea7c14",
    hexEscuro: "#b95c08",
    turmas: [
      "1º A Agroecologia",
      "2º B Agroindústria",
      "3º A Agroecologia",
    ],
  },
];

/* Art. 15 — modalidades esportivas coletivas e individuais */
const MODALIDADES_ESPORTIVAS = [
  {
    nome: "Atletismo",
    icone: "🏃",
    tipo: "Individual",
    provas: "100 m, 200 m, 400 m, 800 m (masc. e fem.), 2.000 m (fem.) e 4.000 m (masc.)",
    limite: "Até 2 estudantes por equipe em cada prova; cada atleta pode disputar até 2 provas",
  },
  {
    nome: "Salto em Distância",
    icone: "🦵",
    tipo: "Individual",
    provas: "Masculino e feminino",
    limite: "Até 2 estudantes por equipe",
  },
  {
    nome: "Futsal",
    icone: "⚽",
    tipo: "Coletivo",
    provas: "Masculino e feminino",
    limite: "De 5 a 12 estudantes por equipe",
  },
  {
    nome: "Handebol",
    icone: "🤾",
    tipo: "Coletivo",
    provas: "Masculino e feminino",
    limite: "De 7 a 12 estudantes por equipe",
  },
  {
    nome: "Tênis de Mesa",
    icone: "🏓",
    tipo: "Individual",
    provas: "Masculino e feminino",
    limite: "Até 2 estudantes por equipe",
  },
  {
    nome: "Vôlei de Areia",
    icone: "🏖️",
    tipo: "Individual",
    provas: "Masculino e feminino",
    limite: "Até 3 estudantes por equipe",
  },
  {
    nome: "Voleibol de Quadra",
    icone: "🏐",
    tipo: "Coletivo",
    provas: "Masculino e feminino",
    limite: "De 6 a 12 estudantes por equipe",
  },
  {
    nome: "Xadrez",
    icone: "♟️",
    tipo: "Individual",
    provas: "Masculino e feminino",
    limite: "Até 2 estudantes por equipe",
  },
  {
    nome: "Futevôlei",
    icone: "🏐",
    tipo: "Individual",
    provas: "Masculino e feminino",
    limite: "Até 3 estudantes por equipe",
  },
  {
    nome: "Baleado",
    icone: "🎯",
    tipo: "Coletivo",
    provas: "Masculino e feminino",
    limite: "De 6 a 8 estudantes por equipe",
  },
  {
    nome: "Basquete 3x3",
    icone: "🏀",
    tipo: "Coletivo",
    provas: "Masculino e feminino",
    limite: "3 estudantes titulares e 1 suplente por equipe",
  },
  {
    nome: "Videogame (FIFA)",
    icone: "🎮",
    tipo: "Individual (1x1)",
    provas: "Masculino e feminino",
    limite: "Até 2 estudantes por equipe",
  },
];

/* Art. 11, 14 e regulamentos específicos — provas artísticas obrigatórias */
const PROVAS_ARTISTICAS = [
  {
    nome: "Prova de Abertura",
    icone: "🎭",
    descricao: "Performance artística/cultural que homenageia a atleta da equipe, com tempo de 2 a 5 minutos e participação mínima de 8 integrantes.",
  },
  {
    nome: "Show de Talentos",
    icone: "🎤",
    descricao: "Até 2 apresentações por equipe entre música vocal, música instrumental, dança ou cena (stand up, teatro ou recital de poesia), com 2 a 6 minutos cada.",
  },
  {
    nome: "Instagram da Equipe",
    icone: "📸",
    descricao: "Perfil oficial e público da equipe nos Jogos Internos, avaliado por identidade visual, conteúdo/criatividade, cobertura do evento e engajamento orgânico.",
  },
];

/* Art. 11 — a equipe que não participar de alguma prova artística perde 10 pontos na pontuação final */
const SANCAO_PROVA_ARTISTICA = "A equipe que não apresentar representantes em alguma das provas artísticas sofre sanção de -10 pontos na pontuação final (Art. 11, Parágrafo Único).";

/* Art. 20 — quadro de pontuação geral */
const PONTUACAO = {
  colocacoes: ["1º colocado", "2º colocado", "3º colocado", "4º colocado"],
  esportiva: [5, 3, 2, 1],
  artistica: "Até 10 pontos por colocação (1º ao 4º lugar), atribuídos pela banca avaliadora da Comissão Cultural e Artística.",
  observacao: "A pontuação esportiva vale para cada modalidade, por gênero e, no caso do atletismo, por prova. Equipes que não inscreverem atletas em uma modalidade não pontuam nela (Art. 19, Parágrafo Único).",
};

/* Anexo I — Programação (as tabelas de modalidade/local/horário do anexo estão em branco
   no regulamento; serão preenchidas quando o chaveado for divulgado em 31/07/2026) */
const PROGRAMACAO = [
  {
    dia: "Terça-feira",
    data: "05/08/2026",
    itens: [
      { titulo: "Cerimônia de Abertura", horario: "" },
      { titulo: "Prova/Apresentação de Abertura", horario: "" },
      { titulo: "Modalidades esportivas", horario: "A divulgar no chaveado" },
      { titulo: "Almoço", horario: "" },
    ],
  },
  {
    dia: "Quinta-feira",
    data: "06/08/2026",
    itens: [
      { titulo: "Modalidades esportivas", horario: "A divulgar no chaveado" },
      { titulo: "Almoço", horario: "" },
    ],
  },
  {
    dia: "Sexta-feira",
    data: "07/08/2026",
    itens: [
      { titulo: "Modalidades esportivas", horario: "A divulgar no chaveado" },
      { titulo: "Almoço", horario: "" },
      { titulo: "Show de Talentos", horario: "13h às 14h30" },
      { titulo: "Cerimônia de Encerramento", horario: "14h30 às 15h30" },
    ],
  },
];

/* Capítulos do Regulamento Geral — resumo para a seção "Regulamento" */
const REGULAMENTO_RESUMO = [
  {
    titulo: "Participantes",
    texto: "Podem participar estudantes regularmente matriculados nos cursos técnicos integrados ao ensino médio do Campus, com frequência igual ou superior a 75%. É vedada a participação de estudantes de FIC, cursos subsequentes, graduação, pós-graduação e do Programa Partiu IF (Art. 6º e 7º).",
  },
  {
    titulo: "Limite de inscrições por estudante",
    texto: "Cada estudante pode se inscrever em, no máximo, duas modalidades coletivas e uma individual (ou duas individuais e uma coletiva), podendo disputar até 2 provas no atletismo (Art. 10, §1º).",
  },
  {
    titulo: "Formato das disputas",
    texto: "Até 2 equipes: partida única. Até 3 equipes: rodízio simples. A partir de 4 equipes: eliminatória simples, com disputa de 3º lugar (Art. 17).",
  },
  {
    titulo: "Provas artísticas obrigatórias",
    texto: "É obrigatória a participação de todas as equipes na Prova de Abertura, no Show de Talentos e no Instagram da equipe, sob pena de perda de 10 pontos na pontuação final (Art. 11).",
  },
  {
    titulo: "Uniformes",
    texto: "Os uniformes devem conter numeração de 0 a 99 nas costas e a logomarca institucional do IF Baiano – Campus Alagoinhas na frente (8 cm x 4 cm). O Instituto também disponibiliza uniformes padrão por empréstimo (Art. 13).",
  },
  {
    titulo: "Disciplina e recursos",
    texto: "Casos de indisciplina, agressão ou condutas antidesportivas são julgados pela Comissão Disciplinar. Recursos devem ser protocolados por escrito pela madrinha da equipe junto à CAE em até 1 dia após o fato (Art. 21 a 32).",
  },
];
