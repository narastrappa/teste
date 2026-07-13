# Jogos Internos — IFBaiano Campus Alagoinhas

Site estático (HTML/CSS/JS puro, sem build, sem backend) para divulgar os
Jogos Internos do Campus Alagoinhas do IFBaiano: calendário de partidas,
resultados, classificação, notícias, regulamento e contato da comissão
organizadora.

O contexto completo de requisitos está em [`spec.md`](spec.md).

## Estrutura

```
index.html         Home
calendario.html     Calendário de jogos (com filtros)
resultados.html      Resultados e classificação por modalidade
noticias.html         Lista de notícias
noticia.html            Detalhe de uma notícia (?id=...)
regulamento.html          Regulamento do evento
contato.html                Comissão organizadora e contato

css/style.css       Estilos (paleta institucional IFBaiano, mobile-first)
js/                  Lógica de cada página (dados são lidos via fetch)
partials/            Header e footer compartilhados, injetados via JS
data/                Conteúdo editável: modalidades, times, jogos, notícias
```

## Como atualizar o conteúdo

Você **não precisa mexer no HTML/CSS/JS** para atualizar jogos, placares,
times, modalidades ou notícias — edite os arquivos em `data/` (veja
`data/README.md` para o formato de cada um) e publique (`git push`).

Os dados incluídos atualmente são **placeholders de exemplo** para
demonstrar o funcionamento do site. Substitua pelos dados reais definidos
pela comissão organizadora.

## Como rodar localmente

O site usa `fetch()` para carregar os arquivos de `data/` e `partials/`,
então **não funciona abrindo o `index.html` direto no navegador**
(`file://`) — é preciso servir por HTTP. Qualquer servidor estático simples
resolve:

```bash
# Python (já vem instalado na maioria dos sistemas)
python3 -m http.server 8000

# ou Node, sem instalar nada globalmente
npx serve .
```

Depois acesse `http://localhost:8000`.

## Como publicar (hospedagem)

Por ser um site 100% estático, pode ser hospedado gratuitamente em:

- **GitHub Pages** — Settings → Pages → Deploy from branch (`main` / raiz).
- **Netlify** ou **Vercel** — conectar o repositório, sem configuração de
  build necessária (é só HTML/CSS/JS estático).

## Itens pendentes

Ver seção "Itens em aberto" em [`spec.md`](spec.md): lista final de
modalidades, times, datas oficiais, regras de pontuação, contatos reais da
comissão e decisão sobre hospedagem.
