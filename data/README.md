# Dados do site

Todo o conteúdo variável do site (modalidades, times, jogos, notícias) fica
nestes arquivos JSON. Edite-os diretamente e publique (`git push`) para
atualizar o site — não é necessário mexer no HTML/JS.

## `modalidades.json`

```json
{ "id": "futsal", "nome": "Futsal", "icone": "⚽", "tipo": "coletivo" }
```

- `id`: identificador único, usado em `jogos.json` (`modalidadeId`).
- `tipo`: `"coletivo"` gera tabela de classificação automática (V/E/D/pontos).
  `"individual"` mostra apenas a lista de resultados/observações, sem tabela.

## `times.json`

```json
{ "id": "azul", "nome": "Time Azul", "cor": "#1565C0" }
```

- `cor`: usada como destaque visual (bolinha/borda) nas listas e tabelas.

## `jogos.json`

```json
{
  "id": "fut-01",
  "data": "2026-07-08",
  "hora": "09:00",
  "modalidadeId": "futsal",
  "fase": "Classificatória",
  "local": "Quadra 1",
  "timeA": "azul",
  "timeB": "verde",
  "placarA": 3,
  "placarB": 1,
  "status": "realizado",
  "observacao": "opcional — usado sobretudo em modalidades individuais"
}
```

- `status`: `"agendado"` (ainda não jogado) ou `"realizado"` (com placar
  preenchido). Ao registrar o resultado, mude o status e preencha
  `placarA`/`placarB`.
- Para modalidades individuais sem confronto 1x1 (ex.: atletismo), deixe
  `timeA`/`timeB`/`placarA`/`placarB` como `null` e descreva o resultado em
  `observacao`.
- A classificação (Vitória = 3 pts, Empate = 1 pt, Derrota = 0 pt) é
  calculada automaticamente a partir dos jogos `"realizado"` das
  modalidades `"coletivo"`. Ajuste a lógica em `js/resultados.js` se as
  regras oficiais forem diferentes.

## `noticias.json`

```json
{
  "id": "abertura-2026",
  "titulo": "...",
  "data": "2026-07-05",
  "resumo": "...",
  "corpo": "..."
}
```

- `corpo` aceita apenas texto simples (quebras de linha viram parágrafos).
  Novas notícias: adicione um novo objeto no início do array (mais recente
  primeiro, ou deixe que a ordenação por data no JS cuide disso).

## Importante

Os dados de exemplo (modalidades, times, jogos e notícias) neste diretório
são **placeholders** para demonstrar o funcionamento do site. Substitua
pelos dados reais definidos pela comissão organizadora antes de publicar
(ver seção "Itens em aberto" do `spec.md`).
