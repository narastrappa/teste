# Spec — Site dos Jogos Internos do IFBaiano, Campus Alagoinhas

## 1. Visão geral

Site institucional para divulgar os Jogos Internos do Campus Alagoinhas do
IFBaiano. Serve como canal central de informação para alunos, professores e
comunidade: calendário de partidas, resultados, classificação, notícias,
regulamento e contato da comissão organizadora.

- **Mantenedor:** o próprio autor do site, editando código/arquivos
  diretamente (sem painel administrativo).
- **Tipo de site:** estático (HTML/CSS/JS), sem backend nem banco de dados.
- **Prioridade de dispositivo:** mobile-first — a maior parte do acesso será
  via celular durante os jogos, mas o layout deve ser responsivo também em
  desktop.
- **Identidade visual:** seguir o padrão visual oficial do IFBaiano (cores e
  logo institucionais — verde/branco, conforme manual de marca do Instituto
  Federal Baiano).
- **Prazo:** o site precisa estar no ar **antes do início dos jogos** (data
  exata a definir pelo autor).

## 2. Objetivos do site

1. Divulgar o calendário de jogos (datas, horários, locais, modalidades).
2. Publicar resultados e a classificação/tabela de cada modalidade.
3. Funcionar como portal informativo do evento: notícias, regulamento e
   contato da comissão organizadora.

Fora de escopo nesta primeira versão: inscrição online de equipes/atletas
(times já são formados fora do site) e painel administrativo dinâmico.

## 3. Público-alvo

- Alunos do Campus Alagoinhas (principal público, acesso majoritariamente
  via celular).
- Professores, servidores e comissão organizadora.
- Familiares e comunidade externa interessada em acompanhar os jogos.

## 4. Estrutura de páginas

Site multi-página (não single-page), com navegação simples e persistente
(menu fixo/sticky no topo, colapsável em mobile).

| Página | Conteúdo |
|---|---|
| **Home** | Chamada do evento (nome, período, campus), destaques/últimas notícias, próximos jogos do dia, link rápido para classificação e regulamento |
| **Calendário** | Lista/tabela de jogos por dia, com data, horário, modalidade, times, local. Filtro por modalidade e/ou dia |
| **Resultados & Classificação** | Placares das partidas já realizadas e tabela de classificação por modalidade (pontos, vitórias, saldo, etc., conforme regras de cada esporte) |
| **Notícias** | Lista cronológica de posts curtos (avisos, resumos de rodada, destaques, fotos pontuais) |
| **Regulamento** | Texto ou PDF embutido com as regras oficiais dos Jogos Internos |
| **Comissão & Contato** | Quem organiza (professores/responsáveis), formas de contato (e-mail, redes sociais do evento, se houver) |

> Modalidades e times participantes serão preenchidos pelo autor conforme
> definição da comissão organizadora mais próximo da data — o site deve
> tratá-los como dados configuráveis, não hardcoded espalhados pelo código.

## 5. Modelo de dados de conteúdo

Como o site é estático e mantido manualmente pelo autor, o conteúdo variável
(jogos, resultados, notícias) deve ficar isolado em arquivos de dados
separados do HTML/JS de apresentação, para facilitar atualização rápida
durante o evento sem mexer em lógica de página.

Estrutura sugerida (a validar durante a implementação):

```
/data
  modalidades.json   # lista de modalidades (nome, ícone, regras de pontuação)
  times.json          # times participantes (nome, cor/identidade)
  jogos.json           # partidas: data, hora, local, modalidade, times, placar (quando houver)
  noticias/            # um arquivo .md por notícia, ou um noticias.json
```

Páginas HTML leem esses arquivos via JS (fetch local) e renderizam listas e
tabelas dinamicamente no navegador. Isso evita duplicar HTML a cada partida
ou notícia nova — basta editar o JSON/Markdown correspondente.

### 5.1 Atualização de resultados durante os jogos

Abordagens possíveis (decidir durante a implementação, conforme a rotina real
do evento):

- **A. Editar `jogos.json` e publicar (git push):** simples, funciona bem se
  o autor tem notebook/acesso a git durante os jogos e atualizações não
  precisam ser instantâneas (minutos de defasagem são aceitáveis).
- **B. Atualização só ao final de cada dia/rodada:** reduz a frequência de
  publicação — atualiza-se um resumo consolidado por dia, sem placar "ao
  vivo".
- **C. Formulário externo alimentando o JSON** (ex.: Google Sheets exportado
  como JSON): permite que alguém sem conhecimento técnico registre placares,
  que são então publicados por script. Mais complexo, avaliar se compensa
  para uma primeira versão estática.

Recomendação inicial: começar pela abordagem **A** (mais simples, sem
dependências externas) e migrar para **C** apenas se a comissão organizadora
tiver mais de uma pessoa alimentando resultados simultaneamente.

## 6. Requisitos funcionais

- RF01 — Exibir lista de jogos futuros e passados, com filtro por modalidade.
- RF02 — Exibir classificação por modalidade, calculada a partir dos
  resultados registrados (ou informada diretamente, a definir).
- RF03 — Exibir lista de notícias/avisos em ordem cronológica reversa.
- RF04 — Exibir o regulamento do evento (texto na página ou PDF anexado).
- RF05 — Exibir informações de contato da comissão organizadora.
- RF06 — Navegação funcional e legível em telas pequenas (mobile-first).
- RF07 — Nenhuma funcionalidade deve exigir login, backend ou banco de
  dados — tudo lido de arquivos estáticos.

## 7. Requisitos não funcionais

- RNF01 — Site 100% estático, hospedável em serviços gratuitos (ex.: GitHub
  Pages, Netlify, Vercel).
- RNF02 — Performance: carregamento rápido mesmo em conexão móvel limitada
  (imagens otimizadas, sem frameworks pesados desnecessários).
- RNF03 — Acessibilidade básica: contraste adequado, textos alternativos em
  imagens, navegação por teclado funcional.
- RNF04 — Responsivo, com layout mobile-first e breakpoints para tablet e
  desktop.
- RNF05 — Identidade visual alinhada ao manual de marca do IFBaiano (cores
  institucionais, logo oficial do campus/instituto).
- RNF06 — Código organizado de forma que o autor (não-desenvolvedor
  especializado) consiga atualizar dados de jogos e notícias sem precisar
  entender toda a base de código.

## 8. Design e identidade visual

- Paleta baseada nas cores institucionais do IFBaiano (verde predominante,
  branco, detalhes em cinza/preto para texto).
- Logo oficial do IFBaiano / Campus Alagoinhas no cabeçalho.
- Tipografia legível, priorizando clareza em telas pequenas.
- Elementos visuais esportivos (ícones de modalidades, cores de times) podem
  complementar a identidade institucional, desde que não conflitem com o
  padrão oficial.

## 9. Itens em aberto (a definir pelo autor antes ou durante a implementação)

- [ ] Lista final de modalidades esportivas.
- [ ] Nomes/identidade dos times mistos (cores, mascotes, etc.).
- [ ] Datas exatas do evento e cronograma de fases (classificatória, semi,
      final).
- [ ] Regras de pontuação/classificação por modalidade (para a tabela).
- [ ] Nome(s) e contato(s) da comissão organizadora.
- [ ] Onde hospedar o site (GitHub Pages, Netlify, domínio próprio do
      campus, etc.).
- [ ] Decisão final sobre o fluxo de atualização de resultados (seção 5.1).

## 10. Fora de escopo (nesta versão)

- Inscrição online de equipes/atletas.
- Painel administrativo com login.
- Placar ao vivo em tempo real (WebSocket/polling automático).
- Área de comentários ou interação social dos usuários no site.
