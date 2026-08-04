/* ===================================================================
   JIIFAL 2026 — Jogos Internos IF Baiano, Campus Alagoinhas.
   Dados extraídos estritamente do Regulamento Geral dos Jogos
   Internos IF Baiano - Campus Alagoinhas (JIIFAL), incluindo o
   Anexo I (programação com horários, locais e coordenação), e do
   card oficial de apresentação das equipes.
   Regulamento completo: https://drive.google.com/file/d/1rtL1Z3Dfe5ANg89fJKAZsCH7M_A3uCLl/view?usp=sharing
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
    "Campus Alagoinhas",
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
    torcida: "Hortência",
    instagram: "https://www.instagram.com/equipehortencia?igsh=ODkydWNiNXZrZ2Rx",
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
    torcida: "Império",
    instagram: "https://www.instagram.com/imperio.jifal?igsh=Z3k3cWdmY3Y2d29q",
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
    torcida: "Fuleco",
    instagram: "https://www.instagram.com/fuleco.jifal/?utm_source=ig_web_button_share_sheet",
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
    torcida: "Guardiã",
    instagram: "https://www.instagram.com/guardia.jifal?igsh=ZHpiZm05YjJheWR4",
    turmas: [
      "1º A Agroecologia",
      "2º B Agroindústria",
      "3º A Agroecologia",
    ],
  },
];

/* A Classificação Geral e os resultados dos jogos deixaram de ser um array
   estático: agora são preenchidos pelo(a) administrador(a) logado(a) (ver
   js/firebase-app.js) e ficam salvos no Firestore, visíveis a todos os
   visitantes do site em tempo real. */

/* Art. 15 — modalidades esportivas coletivas e individuais */
const MODALIDADES_ESPORTIVAS = [
  {
    nome: "Atletismo",
    icone: "🏃",
    tipo: "Individual",
    provas: "100 m, 200 m, 400 m e 800 m (masc. e fem.), 1.500 m (fem.) e 3.000 m (masc.)",
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
    provas: "Masculino e misto",
    limite: "2 titulares e até 1 reserva por equipe",
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

/* Anexo I — Programação oficial (horário, atividade, local e coordenação) */
const PROGRAMACAO = [
  {
    dia: "Quarta-feira",
    data: "05/08/2026",
    itens: [
      { horario: "08h00 – 08h40", atividade: "Abertura dos Jogos", local: "Quadra", coordenacao: "Comissão Organizadora" },
      { horario: "08h40 – 09h30", atividade: "Prova de Abertura", local: "Quadra", coordenacao: "Comissão Artística Cultural" },
      { horario: "09h40 – 11h00", atividade: "Baleado", local: "Quadra", coordenacao: "Jamyle Rocha, Julio Cesar, Fabrício Faro" },
      { horario: "10h00 – 12h00", atividade: "Xadrez", local: "Biblioteca", coordenacao: "Dante Bitencourt, Marcio Araujo, Mario Marcos" },
      { horario: "11h00 – 12h00", atividade: "Salto em Distância", local: "Pista de Salto", coordenacao: "Fernando Marinho, Julio Cesar" },
      { horario: "11h00 – 12h00", atividade: "Basquete 3x3", local: "Quadra", coordenacao: "Jonatas Vinicius, Marcio Borges" },
      { horario: "11h00 – 12h00", atividade: "Vôlei de Areia", local: "Quadra de Areia", coordenacao: "Eberson Luis, Genivaldo Cruz" },
      { horario: "12h00 – 13h00", atividade: "Almoço", local: "Refeitório", coordenacao: "—" },
      { horario: "13h00 – 14h00", atividade: "Basquete 3x3", local: "Quadra", coordenacao: "Jonatas Vinicius, Marcio Borges" },
      { horario: "13h00 – 15h00", atividade: "Vôlei de Areia", local: "Quadra de Areia", coordenacao: "Eberson Luis, Genivaldo Cruz" },
      { horario: "14h00 – 16h00", atividade: "Tênis de Mesa", local: "Refeitório", coordenacao: "Dante Bitencourt, Gil Cesar, Mario Marcos" },
      { horario: "14h00 – 16h30", atividade: "Videogame – FIFA", local: "Auditório", coordenacao: "Marcio Araujo, Jamyle Rocha, Fabrício Faro" },
      { horario: "14h30 – 17h00", atividade: "Atletismo", local: "Estádio Carneirão", coordenacao: "Fernando Marinho, Julio Cesar, Marcos Santana" },
      { horario: "15h30 – 17h00", atividade: "Futevôlei", local: "Quadra de Areia", coordenacao: "Eberson Luis, Genivaldo Cruz" },
    ],
    observacao: "Transporte para os atletas do Atletismo com saída do campus às 14h00, com destino ao Estádio Carneirão.",
  },
  {
    dia: "Quinta-feira",
    data: "06/08/2026",
    itens: [
      { horario: "08h00 – 11h00", atividade: "Vôlei de Quadra", local: "Ginásio Municipal", coordenacao: "Marcos Santana, Eberson Luis" },
      { horario: "11h00 – 12h00", atividade: "Futsal", local: "Ginásio Municipal", coordenacao: "Fernando Marinho, Marcos Santana" },
      { horario: "12h00 – 13h00", atividade: "Almoço", local: "Refeitório", coordenacao: "—" },
      { horario: "13h00 – 14h00", atividade: "Futsal", local: "Ginásio Municipal", coordenacao: "Fernando Marinho, Marcos Santana" },
      { horario: "15h00 – 17h00", atividade: "Handebol", local: "Ginásio Municipal", coordenacao: "Jonatas Vinicius, Marcos Santana" },
    ],
  },
  {
    dia: "Sexta-feira",
    data: "07/08/2026",
    itens: [
      { horario: "08h00 – 12h00", atividade: "Finais de Baleado, Handebol, Vôlei e Futsal", local: "Ginásio Municipal", coordenacao: "Fernando Marinho, Marcos Santana, Eberson Luis, Jonatas Vinicius" },
      { horario: "12h00 – 13h00", atividade: "Almoço", local: "Refeitório", coordenacao: "—" },
      { horario: "13h00 – 14h00", atividade: "Show de Talentos", local: "Auditório", coordenacao: "Comissão Artística Cultural" },
      { horario: "14h00", atividade: "Cerimônia de Encerramento e Entrega de Medalhas", local: "Hall do Prédio Administrativo", coordenacao: "Comissão Organizadora" },
    ],
  },
];

/* Chaveado oficial das modalidades esportivas coletivas (Tabela Modalidades
   Esportivas — JIIFAL 2026). Times identificados por id de equipe; quando o
   confronto ainda depende de um resultado anterior, o valor é um texto
   (ex.: "Perdedor SF1", "Vencedor SF1"). */
const CHAVEADO = [
  {
    modalidade: "Baleado Feminino",
    local: "Quadra IF",
    data: "05/08",
    fases: [
      { fase: "Semifinal 1", horario: "09h20 – 09h40", timeA: "equipe-1", timeB: "equipe-4" },
      { fase: "Semifinal 2", horario: "10h00 – 10h20", timeA: "equipe-2", timeB: "equipe-3" },
      { fase: "Disputa de 3º Lugar", horario: "10h40 – 11h00", timeA: "Perdedor SF1", timeB: "Perdedor SF2" },
      { fase: "Final", horario: "09h20 – 09h40 (07/08 · Ginásio Municipal)", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Baleado Masculino",
    local: "Quadra IF",
    data: "05/08",
    fases: [
      { fase: "Semifinal 1", horario: "09h40 – 10h00", timeA: "equipe-2", timeB: "equipe-1" },
      { fase: "Semifinal 2", horario: "10h20 – 10h40", timeA: "equipe-3", timeB: "equipe-4" },
      { fase: "Disputa de 3º Lugar", horario: "11h00 – 11h20", timeA: "Perdedor SF1", timeB: "Perdedor SF2" },
      { fase: "Final", horario: "09h20 – 09h40 (07/08 · Ginásio Municipal)", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Basquete 3x3 Masculino",
    local: "Quadra IF",
    data: "05/08",
    fases: [
      { fase: "Semifinal 1", horario: "11h20 – 11h40", timeA: "equipe-3", timeB: "equipe-1" },
      { fase: "Semifinal 2", horario: "13h00 – 13h20", timeA: "equipe-4", timeB: "equipe-2" },
      { fase: "Disputa de 3º Lugar", horario: "13h40 – 14h00", timeA: "Perdedor SF1", timeB: "Perdedor SF2" },
      { fase: "Final", horario: "14h20 – 14h40", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Basquete 3x3 Feminino",
    local: "Quadra IF",
    data: "05/08",
    observacao: "Formato de rodízio entre as equipes participantes, conforme tabela oficial (sem semifinal/final).",
    fases: [
      { fase: "1ª Rodada", horario: "11h40 – 12h00", timeA: "equipe-1", timeB: "equipe-2" },
      { fase: "2ª Rodada", horario: "13h20 – 13h40", timeA: "equipe-2", timeB: "equipe-4" },
      { fase: "3ª Rodada", horario: "14h00 – 14h20", timeA: "equipe-1", timeB: "equipe-4" },
    ],
  },
  {
    modalidade: "Vôlei de Areia Feminino",
    local: "Quadra de Areia IF",
    data: "05/08",
    observacao: "Não haverá disputa de 3º lugar. O 3º colocado será a equipe derrotada pelo campeão na semifinal.",
    fases: [
      { fase: "Semifinal 1", horario: "11h00 – 11h30", timeA: "equipe-1", timeB: "equipe-3" },
      { fase: "Semifinal 2", horario: "11h30 – 12h00", timeA: "equipe-4", timeB: "equipe-2" },
      { fase: "Final", horario: "14h00 – 14h30", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Vôlei de Areia Masculino",
    local: "Quadra de Areia IF",
    data: "05/08",
    observacao: "Não haverá disputa de 3º lugar. O 3º colocado será a equipe derrotada pelo campeão na semifinal.",
    fases: [
      { fase: "Semifinal 1", horario: "13h00 – 13h30", timeA: "equipe-1", timeB: "equipe-4" },
      { fase: "Semifinal 2", horario: "13h30 – 14h00", timeA: "equipe-3", timeB: "equipe-2" },
      { fase: "Final", horario: "14h30 – 15h00", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Futevôlei Masculino",
    local: "Quadra de Areia IF",
    data: "05/08",
    observacao: "Não haverá disputa de 3º lugar. O 3º colocado será a equipe derrotada pelo campeão na semifinal.",
    fases: [
      { fase: "Semifinal 1", horario: "15h00 – 15h30", timeA: "equipe-2", timeB: "equipe-4" },
      { fase: "Semifinal 2", horario: "15h30 – 16h00", timeA: "equipe-1", timeB: "equipe-3" },
      { fase: "Final", horario: "16h20 – 16h50", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Vôlei de Quadra Feminino",
    local: "Ginásio Municipal",
    data: "06/08",
    fases: [
      { fase: "Semifinal 1", horario: "08h00 – 08h30", timeA: "equipe-2", timeB: "equipe-3" },
      { fase: "Semifinal 2", horario: "08h30 – 09h00", timeA: "equipe-1", timeB: "equipe-4" },
      { fase: "Disputa de 3º Lugar", horario: "10h00 – 10h30", timeA: "Perdedor SF1", timeB: "Perdedor SF2" },
      { fase: "Final", horario: "08h00 – 08h30 (07/08 · Ginásio Municipal)", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Vôlei de Quadra Masculino",
    local: "Ginásio Municipal",
    data: "06/08",
    fases: [
      { fase: "Semifinal 1", horario: "09h00 – 09h30", timeA: "equipe-3", timeB: "equipe-4" },
      { fase: "Semifinal 2", horario: "09h00 – 10h00", timeA: "equipe-2", timeB: "equipe-1" },
      { fase: "Disputa de 3º Lugar", horario: "10h30 – 11h00", timeA: "Perdedor SF1", timeB: "Perdedor SF2" },
      { fase: "Final", horario: "08h30 – 08h00 (07/08 · Ginásio Municipal, conforme tabela oficial)", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Futsal Feminino",
    local: "Ginásio Municipal",
    data: "06/08",
    fases: [
      { fase: "Semifinal 1", horario: "11h10 – 11h35", timeA: "equipe-3", timeB: "equipe-2" },
      { fase: "Semifinal 2", horario: "13h00 – 13h25", timeA: "equipe-4", timeB: "equipe-1" },
      { fase: "Disputa de 3º Lugar", horario: "13h50 – 14h15", timeA: "Perdedor SF1", timeB: "Perdedor SF2" },
      { fase: "Final", horario: "11h30 – 12h00 (07/08 · Ginásio Municipal)", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Futsal Masculino",
    local: "Ginásio Municipal",
    data: "06/08",
    fases: [
      { fase: "Semifinal 1", horario: "11h35 – 12h00", timeA: "equipe-4", timeB: "equipe-3" },
      { fase: "Semifinal 2", horario: "13h25 – 13h50", timeA: "equipe-1", timeB: "equipe-2" },
      { fase: "Disputa de 3º Lugar", horario: "14h15 – 14h40", timeA: "Perdedor SF1", timeB: "Perdedor SF2" },
      { fase: "Final", horario: "A definir (07/08 · Ginásio Municipal, início previsto 11h00)", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Handebol Feminino",
    local: "Ginásio Municipal",
    data: "06/08",
    fases: [
      { fase: "Semifinal 1", horario: "14h20 – 14h45", timeA: "equipe-4", timeB: "equipe-1" },
      { fase: "Semifinal 2", horario: "15h10 – 15h35", timeA: "equipe-2", timeB: "equipe-3" },
      { fase: "Disputa de 3º Lugar", horario: "16h00 – 16h25", timeA: "Perdedor SF1", timeB: "Perdedor SF2" },
      { fase: "Final", horario: "09h40 – 10h10 (07/08 · Ginásio Municipal)", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
  {
    modalidade: "Handebol Masculino",
    local: "Ginásio Municipal",
    data: "06/08",
    fases: [
      { fase: "Semifinal 1", horario: "14h45 – 15h10", timeA: "equipe-1", timeB: "equipe-2" },
      { fase: "Semifinal 2", horario: "15h35 – 16h00", timeA: "equipe-3", timeB: "equipe-4" },
      { fase: "Disputa de 3º Lugar", horario: "16h25 – 16h50", timeA: "Perdedor SF1", timeB: "Perdedor SF2" },
      { fase: "Final", horario: "10h10 – 10h40 (07/08 · Ginásio Municipal)", timeA: "Vencedor SF1", timeB: "Vencedor SF2" },
    ],
  },
];

/* Chaveado oficial das modalidades individuais (Xadrez, Tênis de Mesa,
   Videogame FIFA) — disputadas dentro de cada equipe e depois entre equipes,
   conforme os pôsteres de chaveamento oficiais. */
const CHAVEADO_INDIVIDUAL = [
  {
    modalidade: "Xadrez Masculino",
    local: "Biblioteca",
    data: "05/08",
    inicio: "10h00",
    formato:
      "Cada equipe inscreve 2 atletas, que se enfrentam entre si na fase interna. Semifinal 1: vencedor da Equipe Azul (Hortência) × vencedor da Equipe Amarela (Império). Semifinal 2: vencedor da Equipe Laranja (Guardiã) × vencedor da Equipe Vermelha (Fuleco). Os vencedores das semifinais disputam a final.",
  },
  {
    modalidade: "Xadrez Feminino",
    local: "Biblioteca",
    data: "05/08",
    inicio: "10h00",
    formato:
      "Cada equipe pode inscrever até 2 jogadoras. Na Equipe Azul (Hortência), as duas jogadoras disputam uma fase interna antes de avançar. Semifinal 1: vencedora da fase interna da Equipe Azul × jogadora da Equipe Laranja (Guardiã). Semifinal 2: jogadora da Equipe Amarela (Império) × jogadora da Equipe Vermelha (Fuleco). As vencedoras das semifinais disputam a final.",
  },
  {
    modalidade: "Tênis de Mesa Masculino",
    local: "Refeitório",
    data: "05/08",
    inicio: "14h00",
    formato:
      "Cada equipe inscreve 2 atletas, que disputam entre si a fase interna. Semifinal 1: vencedor da Equipe Amarela (Império) × vencedor da Equipe Laranja (Guardiã). Semifinal 2: vencedor da Equipe Vermelha (Fuleco) × vencedor da Equipe Azul (Hortência). Vencedores da semifinal disputam a final; perdedores disputam o 3º lugar.",
  },
  {
    modalidade: "Tênis de Mesa Feminino",
    local: "Refeitório",
    data: "05/08",
    inicio: "14h00",
    formato:
      "Equipes Laranja (Guardiã) e Amarela (Império) inscrevem 1 atleta cada, direto nas semifinais. Equipes Vermelha (Fuleco) e Azul (Hortência) inscrevem até 2 atletas, com fase interna prévia. Semifinal 1: atleta da Equipe Laranja × vencedora da fase interna da Equipe Vermelha. Semifinal 2: vencedora da fase interna da Equipe Azul × atleta da Equipe Amarela. Vencedoras da semifinal disputam a final; perdedoras disputam o 3º lugar.",
  },
  {
    modalidade: "Videogame FIFA Masculino",
    local: "Auditório",
    data: "05/08",
    inicio: "14h00",
    formato:
      "Equipes Azul (Hortência) e Amarela (Império) disputam fase interna entre seus 2 atletas; Equipes Vermelha (Fuleco) e Laranja (Guardiã) inscrevem 1 atleta cada. Semifinal 1: vencedor da Equipe Azul × atleta da Equipe Vermelha. Semifinal 2: vencedor da Equipe Amarela × vencedor da fase interna da Equipe Laranja. Sistema eliminatório simples; vencedores da semifinal disputam a final, perdedores disputam o 3º lugar.",
  },
  {
    modalidade: "Videogame FIFA Feminino",
    local: "Auditório",
    data: "05/08",
    inicio: "14h00",
    formato:
      "Equipe Vermelha (Fuleco) disputa fase interna entre suas 2 jogadoras; Equipes Laranja (Guardiã) e Azul (Hortência) inscrevem 1 jogadora cada, que se enfrentam diretamente. A vencedora da Equipe Vermelha enfrenta a vencedora do confronto Laranja × Azul na final. Sistema eliminatório simples; perdedoras da semifinal disputam o 3º lugar. Em caso de empate, o vencedor é definido nas penalidades.",
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
    texto: "Cada estudante pode se inscrever em, no máximo, duas modalidades coletivas e uma individual (ou duas individuais e uma coletiva), podendo disputar até 2 provas no atletismo. Estudantes inscritas nas modalidades femininas ficam dispensadas dessa limitação (Art. 10, §1º).",
  },
  {
    titulo: "Composição das equipes",
    texto: "Nas modalidades coletivas (Baleado, Futsal, Voleibol de Quadra, Handebol, Vôlei de Areia e Basquete 3x3), estudantes na condição de Matrícula de Vínculo Institucional e egressos concluintes do 3º ano em 2025.2 não podem representar mais de 50% da equipe inscrita (Art. 15, §3º).",
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

/* Exposição global para o módulo js/firebase-app.js (que roda como ES module
   e não compartilha automaticamente as constantes deste script clássico). */
window.EQUIPES = EQUIPES;
window.MODALIDADES_ESPORTIVAS = MODALIDADES_ESPORTIVAS;
window.PROVAS_ARTISTICAS = PROVAS_ARTISTICAS;
window.PONTUACAO = PONTUACAO;
window.CHAVEADO = CHAVEADO;
window.CHAVEADO_INDIVIDUAL = CHAVEADO_INDIVIDUAL;
