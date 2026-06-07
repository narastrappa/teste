# Spec — Sistema de Automação de Licitações

**Versão:** 1.1  
**Data:** Junho 2025  
**Revisão:** Correções de inconsistências internas, adição de regras de negócio ausentes e detalhamento de ambiguidades identificadas em revisão técnica.

---

## Escopo

| Módulo | Status |
|--------|--------|
| 1. Busca de Editais | ✅ No escopo |
| 2. Submissão de Propostas | ✅ No escopo |
| 3. Acompanhamento de Propostas | ✅ No escopo |
| 4. Impugnação de Editais | ✅ No escopo |
| 5. Checagem de Documentos | ✅ No escopo |
| 6. Folha de Pagamento | ✅ No escopo (sem integração bancária) |
| 7. Envio de Comprovantes | ✅ No escopo |
| Pagamento automático bancário | ❌ Fora do escopo |

---

## Módulo 1 — Busca e Monitoramento de Editais

### Visão Geral

Agente automatizado que monitora portais públicos de licitação em tempo real, filtra editais relevantes por critérios configuráveis e notifica a equipe via e-mail e/ou WhatsApp.

### Portais a Monitorar

- ComprasNet (compras.gov.br) — Portal federal PNCP
- BEC/SP — Bolsa Eletrônica de Compras do Estado de SP
- Licitações-e (Banco do Brasil)
- Portais municipais configuráveis via URL
- Diário Oficial da União (DOU) — seção III

### Fluxo do Processo

1. Scheduler dispara scraper a cada N minutos (configurável, padrão: 60 min)
2. Scraper acessa cada portal e extrai lista de editais novos/atualizados
3. Parser estrutura os dados: número, objeto, órgão, modalidade, valor estimado, prazo, link
4. Filtro aplica critérios da empresa (CNAE, palavras-chave, valor mín/máx, UF, modalidade)
5. Editais aprovados nos filtros são salvos no banco de dados
6. Notificação é disparada para a equipe com resumo e link direto

### Critérios de Filtro (configuráveis)

| Parâmetro | Tipo | Exemplo | Obrigatório |
|-----------|------|---------|-------------|
| `palavras_chave` | `Array<string>` | `["tecnologia", "TI", "software"]` | Sim |
| `palavras_excluir` | `Array<string>` | `["obras", "construção"]` | Não |
| `valor_minimo` | `number (R$)` | `50000` | Não |
| `valor_maximo` | `number (R$)` | `5000000` | Não |
| `modalidades` | `Array<string>` | `["pregão", "concorrência"]` | Não |
| `ufs` | `Array<string>` | `["BA", "SE", "AL"]` | Não |
| `portais` | `Array<string>` | `["comprasnet", "bec"]` | Sim |

### Modelo de Dados — Edital

```
Edital {
  id:               UUID          -- PK
  numero:           string        -- número do edital/processo
  objeto:           string        -- descrição do objeto licitado
  orgao:            string        -- nome do órgão contratante
  modalidade:       enum          -- pregão | concorrência | tomada_de_precos | convite | leilão | dispensa
  valor_estimado:   decimal       -- nullable
  data_publicacao:  datetime
  data_abertura:    datetime      -- data de abertura das propostas
  prazo_proposta:   datetime      -- prazo final para envio de proposta
  link_edital:      string        -- URL direta do edital
  portal_origem:    string        -- comprasnet | bec | licitacoes-e | outro
  status:           enum          -- novo | em_analise | proposta_enviada | desclassificado | vencedor | perdedor
                                  -- Nota: "vencedor" e "perdedor" referem-se ao resultado da licitação para a empresa.
                                  -- Manter coerência com o enum status de Proposta.
  relevancia_score: integer       -- score 0–100 calculado pelos filtros
  notificado:       boolean       -- flag de controle de notificação
  created_at:       datetime
  updated_at:       datetime
}
```

### Contrato da API

```
GET    /api/editais
  Query: status, portal, data_abertura_inicio, data_abertura_fim, valor_min, valor_max, page, per_page
  Retorna: lista paginada de editais

GET    /api/editais/:id
  Retorna: edital completo com histórico de status

PATCH  /api/editais/:id/status
  Body:    { status: string }
  Retorna: edital atualizado

POST   /api/scraper/run
  Retorna: { job_id }  -- execução assíncrona

GET    /api/scraper/jobs/:job_id
  Retorna: { status, editais_encontrados, editais_novos, erros }
```

### Regras de Negócio

- Edital com `data_abertura` no passado é descartado automaticamente ao ser inserido
- Editais duplicados identificados por `numero + portal_origem` (upsert, não duplicar)
- Notificação enviada apenas uma vez por edital (flag `notificado`)
- Se o scraper falhar 3 vezes consecutivas em um portal, alertar o administrador
- `relevancia_score` calculado pela fórmula: `(palavras_encontradas / total_palavras_chave) × 100`, arredondado para inteiro. Palavras encontradas no campo `objeto` valem peso 2; nos campos `orgao` e `modalidade` valem peso 1. Score final normalizado no intervalo 0–100. Exemplo: 2 de 3 palavras-chave encontradas, ambas no objeto → `min((2×2)/(3×2) × 100, 100) = 67`.
- Scraper sem retorno de editais por 2 horas consecutivas em qualquer portal deve disparar alerta ao administrador (adicional à regra de 3 falhas consecutivas, que cobre erros de conexão).

---

## Módulo 2 — Submissão de Propostas

### Visão Geral

Assistente de preenchimento e submissão de propostas que utiliza templates pré-configurados com dados da empresa, checklists de documentação e RPA para upload nos portais.

### Fluxo do Processo

1. Usuário seleciona edital com status `em_analise` e inicia elaboração de proposta
2. Sistema carrega template de proposta adequado à modalidade e ao tipo de objeto
3. Template é pré-preenchido com dados cadastrais da empresa (do perfil cadastrado)
4. Usuário preenche dados específicos: preços, prazos, metodologia
5. IA revisa proposta: verifica conformidade com edital, campos obrigatórios, erros de digitação
6. Checklist de documentos habilitatórios é gerado automaticamente
7. Proposta e documentos são empacotados conforme formato exigido pelo portal
8. RPA realiza upload no portal (quando suportado) ou gera pacote para upload manual. No caso de upload manual, o sistema exibe instruções passo a passo específicas para o portal em questão e aguarda confirmação do usuário de que o upload foi concluído, momento em que solicita o número de protocolo gerado pelo portal.
9. Status do edital atualizado para `proposta_enviada`; protocolo registrado

### Modelo de Dados — Proposta

```
Proposta {
  id:                       UUID
  edital_id:                UUID          -- FK → Edital
  template_id:              UUID          -- FK → Template
  versao:                   integer       -- versão da proposta (1, 2, 3...)
  status:                   enum          -- rascunho | revisao_ia | aprovada | enviada | habilitada | desclassificada | vencedora | perdida
  valor_proposto:           decimal
  prazo_entrega_dias:       integer
  protocolo_envio:          string        -- nullable
  data_envio:               datetime      -- nullable
  arquivo_proposta_path:    string        -- caminho do PDF/DOC gerado
  arquivo_pacote_path:      string        -- caminho do ZIP com proposta + documentos
  revisao_ia_score:         integer       -- score de conformidade 0–100
  revisao_ia_observacoes:   JSON          -- [{ tipo, campo, descricao }]
  responsavel_id:           UUID          -- FK → Usuario
  created_at:               datetime
  updated_at:               datetime
}
```

### Modelo de Dados — Template

```
Template {
  id:               UUID
  nome:             string
  modalidade:       enum          -- mesmo enum de Edital
  tipo_objeto:      string        -- ex: "serviços de TI", "fornecimento de equipamentos"
  arquivo_base_path: string       -- caminho do DOCX/ODT base
  variaveis:        JSON          -- { "{{razao_social}}": "empresa.razao_social", ... }
  ativo:            boolean
  created_at:       datetime
}
```

### Contrato da API

```
POST   /api/propostas
  Body:    { edital_id, template_id, valor_proposto, prazo_entrega_dias }
  Retorna: proposta criada

GET    /api/propostas/:id
  Retorna: proposta completa com resultado da revisão IA

POST   /api/propostas/:id/revisar
  Retorna: { score, observacoes: [{ tipo, campo, descricao }] }

POST   /api/propostas/:id/empacotar
  Retorna: { arquivo_pacote_path, checklist_pendente: [] }

POST   /api/propostas/:id/enviar
  Body:    { portal_credentials_id }
  Retorna: { job_id }
```

### Regras de Negócio

- Bloqueio de envio se `revisao_ia_score < 70` (limiar configurável via variável de ambiente `IA_SCORE_MIN_ENVIO`)
- O `revisao_ia_score` é calculado com base nos seguintes critérios objetivos (cada item com peso igual):
  1. Todos os campos obrigatórios do template estão preenchidos
  2. `valor_proposto` está dentro do intervalo aceitável (≥ 70% e ≤ 120% do `valor_estimado` do edital)
  3. `prazo_entrega_dias` é compatível com o exigido no edital
  4. Objeto da proposta corresponde ao objeto do edital (similaridade semântica ≥ 0,80)
  5. Ausência de erros ortográficos graves em campos de texto livre
  6. Todos os documentos habilitatórios do Módulo 5 estão com status `valido`
  Score = (critérios atendidos / 6) × 100, arredondado. `revisao_ia_observacoes` lista cada critério reprovado com campo e descrição.
- Versões anteriores são imutáveis após status `enviada`
- Checklist gerado com base nos requisitos de habilitação do edital (parsing automático)
- Se `prazo_proposta` do edital for em menos de 24h, alertar o responsável imediatamente
- Proposta com `valor_proposto` abaixo de 70% do `valor_estimado` dispara alerta de inexequibilidade

---

## Módulo 3 — Acompanhamento de Propostas

### Visão Geral

Dashboard e sistema de alertas que monitora o andamento das licitações em que a empresa participa, rastreando mudanças de status nos portais em tempo real.

### Fluxo do Processo

1. Scheduler verifica status das propostas `enviadas` nos portais a cada 2 horas
2. Scraper extrai status atual: habilitada, desclassificada, em julgamento, resultado
3. Sistema compara com status anterior; se mudou, registra evento de timeline
4. Notificação enviada à equipe com detalhe da mudança
5. Se a empresa venceu, fluxo de contratos é iniciado automaticamente

### Modelo de Dados — EventoAcompanhamento

```
EventoAcompanhamento {
  id:               UUID
  proposta_id:      UUID          -- FK → Proposta
  tipo:             enum          -- habilitacao | desclassificacao | julgamento | recurso | resultado | contrato
  status_anterior:  string
  status_novo:      string
  descricao:        string        -- texto extraído do portal
  link_ata:         string        -- nullable
  notificado:       boolean
  created_at:       datetime
}
```

### Contrato da API

```
GET    /api/propostas/:id/timeline
  Retorna: lista cronológica de eventos da proposta

GET    /api/dashboard
  Retorna: { em_aberto, enviadas, habilitadas, vencidas, perdidas, total_valor_vencido }

POST   /api/acompanhamento/sync
  Retorna: { atualizadas, sem_mudanca, erros }
```

### Regras de Negócio

- Propostas com `data_abertura` em até 48h são verificadas a cada 30 minutos
- Alertar equipe 24h antes do fim do prazo recursal (prazo para interposição de recurso após divulgação do resultado)
- Resultado final confirmado por dois acessos ao portal com intervalo de 1h (evitar falso positivo)

---

## Módulo 4 — Impugnação de Editais

### Visão Geral

Módulo de análise jurídica assistida por IA que identifica cláusulas irregulares em editais e gera minuta de impugnação fundamentada, para revisão e assinatura do advogado responsável.

### Fluxo do Processo

1. Usuário seleciona edital e solicita análise de impugnação
2. IA extrai e analisa o texto completo do edital (PDF → texto)
3. IA identifica possíveis irregularidades com base na Lei 14.133/2021 e jurisprudência do TCU
4. Lista de irregularidades é apresentada ao usuário para seleção
5. IA gera minuta com fundamentação legal para cada item selecionado
6. Advogado revisa, ajusta e assina digitalmente
7. Sistema registra e pode disparar protocolo no portal (quando disponível)

### Categorias de Irregularidade

| Categoria | Descrição | Base Legal |
|-----------|-----------|------------|
| Especificação restritiva | Marca ou modelo específico sem justificativa | Art. 41, Lei 14.133 |
| Prazo exíguo | Prazo para proposta inferior ao mínimo legal | Art. 55, Lei 14.133 |
| Habilitação excessiva | Exigências de qualificação desproporcional | Art. 67, Lei 14.133 |
| Critério de julgamento indevido | Critério não previsto no tipo de licitação | Art. 33, Lei 14.133 |
| Exigência ilegal de capital | Capital social mínimo desproporcional | Súmula TCU 247 |
| Vedação de consórcio | Proibição injustificada de consórcios | Art. 15, Lei 14.133 |
| Sigilo indevido | Planilha de custos não divulgada | Art. 6º, Lei 14.133 |

### Modelo de Dados — Impugnacao

```
Impugnacao {
  id:                     UUID
  edital_id:              UUID          -- FK → Edital
  status:                 enum          -- analise_ia | revisao_advogado | aprovada | protocolada | deferida | indeferida
  irregularidades:        JSON          -- [{ categoria, descricao, trecho_edital, fundamentacao, incluir: boolean }]
  minuta_path:            string        -- caminho do DOCX da minuta
  protocolo:              string        -- nullable
  data_limite_protocolo:  datetime      -- prazo máximo para impugnar
  advogado_responsavel_id: UUID         -- FK → Usuario
  revisao_ia_modelo:      string        -- versão do modelo de IA usado
  created_at:             datetime
}
```

### Contrato da API

```
POST   /api/impugnacoes
  Body:    { edital_id }
  Retorna: { impugnacao_id, job_id }  -- análise assíncrona

GET    /api/impugnacoes/:id
  Retorna: análise completa com irregularidades encontradas

POST   /api/impugnacoes/:id/gerar-minuta
  Body:    { irregularidades_ids: UUID[] }
  Retorna: { minuta_path, url_download }
```

### Regras de Negócio

- Prazo de impugnação: até 3 dias úteis antes da abertura (art. 164, Lei 14.133); alertar quando prazo < 48h
- O cálculo de dias úteis deve excluir sábados, domingos e feriados nacionais. A lista de feriados nacionais deve ser mantida como tabela parametrizável no banco (`feriados_nacionais`) e atualizada anualmente. Feriados estaduais e municipais são opcionais e configuráveis.
- `data_limite_protocolo` deve ser calculada e armazenada em UTC, com exibição convertida para o fuso do usuário
- Minuta sempre gerada em DOCX editável (nunca PDF)
- Toda análise de IA deve registrar `revisao_ia_modelo` e data de execução (auditoria)
- Se o edital não puder ser extraído como texto (imagem), alertar usuário para OCR manual

---

## Módulo 5 — Checagem de Documentos Habilitatórios

### Visão Geral

Pipeline de validação automática que monitora as certidões e documentos habilitatórios da empresa, alertando sobre vencimentos e garantindo que o dossiê de habilitação está sempre atualizado.

### Documentos Monitorados

| Documento | Órgão Emissor | Validade Típica | Alerta |
|-----------|---------------|-----------------|--------|
| CND Federal (Receita + PGFN) | Receita Federal | 180 dias | 30 dias antes |
| CRF (FGTS) | Caixa Econômica Federal | 30 dias | 15 dias antes |
| CNDT (Trabalhista) | TST | 180 dias | 30 dias antes |
| CND Estadual | SEFAZ Estadual | 60–180 dias | 20 dias antes |
| CND Municipal | Prefeitura Municipal | 60–180 dias | 20 dias antes |
| Certidão de Falência | TJ Estadual | 60–90 dias | 20 dias antes |
| Balanço Patrimonial | Contabilidade | 1 ano (exercício) | 60 dias antes |
| Contrato Social | Junta Comercial | Permanente | N/A |
| Alvará de Funcionamento | Prefeitura Municipal | 1 ano | 45 dias antes |
| Registro no Conselho | CREA/CRC/CFM | 1 ano | 30 dias antes |

### Modelo de Dados — Documento

```
Documento {
  id:                       UUID
  tipo:                     enum          -- cnd_federal | crf_fgts | cndt | cnd_estadual | cnd_municipal
                                          -- certidao_falencia | balanco | contrato_social | alvara
                                          -- registro_conselho | outro
  descricao:                string
  arquivo_path:             string        -- caminho do PDF
  data_emissao:             date
  data_validade:            date          -- nullable
  dias_alerta:              integer       -- padrão por tipo de documento
  status:                   enum          -- valido | proximo_vencimento | vencido | nao_aplicavel
  emitido_automaticamente:  boolean       -- se pode ser renovado via automação
  url_emissao:              string        -- URL do portal de emissão (nullable)
  responsavel_id:           UUID          -- FK → Usuario
  observacoes:              text
  created_at:               datetime
  updated_at:               datetime
}
```

### Contrato da API

```
GET    /api/documentos
  Query: status, tipo
  Retorna: lista de documentos

POST   /api/documentos
  Body:    multipart — { tipo, data_validade, arquivo, ... }
  Retorna: documento criado

PUT    /api/documentos/:id
  Body:    multipart — nova versão com nova data de validade
  Retorna: documento atualizado

GET    /api/documentos/status
  Retorna: { validos, proximos_vencimento, vencidos, lista_critica: [] }

POST   /api/documentos/:id/renovar
  Retorna: { job_id }  -- RPA de renovação automática (se suportado)
```

### Regras de Negócio

- Scheduler verifica vencimentos diariamente às 08h00
- Alerta enviado quando resta `dias_alerta` para a validade
- Segundo alerta na metade do prazo original (ex: alerta=30 dias → segundo alerta em 15 dias)
- Documento vencido bloqueia geração de novo pacote de proposta até ser renovado
- OCR aplicado no PDF para extrair `data_validade` automaticamente. Se a confiança do OCR for inferior a 80%, o campo não é preenchido automaticamente — o sistema deve exibir a imagem do trecho identificado e solicitar confirmação ou correção manual pelo usuário. Nunca preencher `data_validade` com valor de baixa confiança sem aviso explícito.
- Histórico de versões preservado — versão anterior nunca é sobrescrita

---

## Módulo 6 — Folha de Pagamento

> **Escopo:** Este módulo gerencia a folha, calcula proventos e gera o arquivo CNAB 240 para download.  
> **Fora do escopo:** Transmissão bancária automática. O envio do arquivo ao banco é realizado manualmente pelo financeiro.

### Fluxo do Processo

1. RH lança a folha do mês: salários, horas extras, descontos, benefícios
2. Sistema calcula INSS, IRRF, FGTS e gera holerite individual em PDF
3. Gestor revisa e aprova a folha
4. Sistema gera arquivo CNAB 240
5. Financeiro baixa o CNAB e realiza o envio manualmente ao banco
6. Financeiro registra no sistema a confirmação de envio e a data prevista de crédito
7. No dia do crédito, status atualizado para `aguardando_confirmacao`
8. Financeiro confirma crédito manualmente; status atualizado para `paga`
9. Comprovantes são disparados (Módulo 7)

### Modelo de Dados — Funcionario

```
Funcionario {
  id:                       UUID
  nome:                     string
  cpf:                      string        -- único
  email:                    string
  telefone_whatsapp:        string        -- nullable, formato E.164: +55DDNÚMERO
  cargo:                    string
  departamento:             string
  data_admissao:            date
  data_demissao:            date          -- nullable
  tipo_contrato:            enum          -- clt | pj | estagio | terceirizado
  salario_base:             decimal
  banco:                    string        -- código de 3 dígitos
  agencia:                  string
  conta:                    string
  tipo_conta:               enum          -- corrente | poupanca
  chave_pix:                string        -- nullable
  ativo:                    boolean
  preferencia_comprovante:  enum          -- email | whatsapp | ambos
}
```

### Modelo de Dados — Folha

```
Folha {
  id:                       UUID
  competencia:              string        -- formato "YYYY-MM", ex: "2025-06"
  sufixo_revisao:           integer       -- padrão 0; folhas de correção usam 1, 2, ... (ex: competencia="2025-06" + sufixo_revisao=1)
                                          -- UNIQUE constraint composta em (competencia, sufixo_revisao)
                                          -- Substitui a notação anterior de string sufixada ("2025-06-C1"), que quebrava o formato e a constraint única.
  status:                   enum          -- rascunho | aprovada | cnab_gerado | enviada_banco | aguardando_confirmacao | paga | cancelada
                                          -- "aguardando_confirmacao" adicionado: estado entre envio ao banco e confirmação do crédito (citado no fluxo, ausente do enum original)
  total_proventos:          decimal
  total_descontos:          decimal
  total_liquido:            decimal
  total_fgts:               decimal
  arquivo_cnab_path:        string        -- nullable
  data_geracao_cnab:        datetime      -- nullable
  data_envio_banco:         date          -- nullable, preenchida manualmente
  data_credito_prevista:    date          -- nullable
  data_credito_confirmada:  date          -- nullable
  aprovado_por_id:          UUID          -- FK → Usuario, nullable
  created_at:               datetime
  updated_at:               datetime
}
```

### Modelo de Dados — ItemFolha (Holerite)

```
ItemFolha {
  id:                       UUID
  folha_id:                 UUID          -- FK → Folha
  funcionario_id:           UUID          -- FK → Funcionario
  salario_base:             decimal
  horas_extras_valor:       decimal
  adicional_noturno:        decimal
  adicional_periculosidade: decimal
  vr_valor:                 decimal
  vt_valor:                 decimal
  outros_proventos:         JSON          -- [{ descricao, valor }]
  inss:                     decimal
  irrf:                     decimal
  desconto_vt:              decimal
  outros_descontos:         JSON          -- [{ descricao, valor }]
  total_proventos:          decimal
  total_descontos:          decimal
  valor_liquido:            decimal
  fgts:                     decimal
  status:                   enum          -- pendente | pago | cancelado
  holerite_pdf_path:        string        -- nullable
  comprovante_enviado:      boolean
}
```

### Geração do CNAB 240

O sistema gera o arquivo CNAB 240 (padrão FEBRABAN) para download. O envio ao banco é manual.

- Bancos suportados: Bradesco (237), Itaú (341), BB (001), Caixa (104), Santander (033)
- Estrutura: Header de Arquivo → Header de Lote → Segmentos A/B → Trailer de Lote → Trailer de Arquivo
- CNAB gerado somente se todos os campos bancários dos funcionários estiverem preenchidos
- Nome do arquivo: `CNAB_YYYY-MM_YYYYMMDDHHMMSS.rem`

### Contrato da API

```
POST   /api/folhas
  Body:    { competencia }
  Retorna: folha criada

POST   /api/folhas/:id/itens/:funcionario_id
  Body:    { salario_base, horas_extras_valor, vr_valor, outros_proventos, outros_descontos, ... }
  Retorna: item criado/atualizado

POST   /api/folhas/:id/calcular
  Retorna: folha com totais recalculados (INSS, IRRF, FGTS)

POST   /api/folhas/:id/aprovar
  Requer:  perfil "gestor"
  Retorna: folha aprovada; PDFs dos holerites gerados em background

POST   /api/folhas/:id/gerar-cnab
  Retorna: { arquivo_cnab_path, url_download }

PATCH  /api/folhas/:id/confirmar-envio-banco
  Body:    { data_envio_banco, data_credito_prevista }
  Retorna: folha atualizada

PATCH  /api/folhas/:id/confirmar-pagamento
  Body:    { data_credito_confirmada }
  Retorna: folha com status "paga"; dispara envio de comprovantes
```

### Regras de Negócio

- Folha não pode ser aprovada se qualquer `valor_liquido` for negativo
- Folha aprovada é imutável; correções são lançadas como nova entrada com o mesmo `competencia` e `sufixo_revisao` incrementado (ex: `competencia="2025-06"`, `sufixo_revisao=1`). A constraint UNIQUE composta `(competencia, sufixo_revisao)` garante integridade.
- CNAB gerado somente para folhas com status `aprovada`
- `competencia` é única por mês apenas para folhas originais (`sufixo_revisao = 0`); folhas de correção aceitam múltiplos registros no mesmo mês
- IRRF calculado com tabela progressiva por faixas de renda vigente (Lei 14.848/2024); tabela parametrizável no banco (`tabela_irrf`), atualizável apenas por perfil `admin`. Deve registrar a data de vigência de cada versão da tabela.
- INSS calculado com alíquotas progressivas por faixas (reforma previdenciária — contribuição por faixa de salário, não alíquota única sobre o total). Tabela parametrizável no banco (`tabela_inss`), atualizável apenas por perfil `admin`.
- Alterações nas tabelas de IRRF e INSS não afetam folhas já aprovadas; aplicam-se somente a novos cálculos.

---

## Módulo 7 — Envio de Comprovantes de Pagamento

### Visão Geral

Módulo que gera comprovantes individuais em PDF e os distribui automaticamente para cada funcionário via e-mail e/ou WhatsApp, com log de entrega e reenvio sob demanda.

### Fluxo do Processo

1. Evento `pagamento_confirmado` dispara o pipeline de comprovantes
2. Para cada funcionário da folha, sistema gera PDF do comprovante
3. PDF nomeado: `Comprovante_CPF_YYYY-MM.pdf`
4. Dispatcher enfileira envios conforme `preferencia_comprovante` de cada funcionário
5. Worker de e-mail envia PDF em anexo
6. Worker de WhatsApp envia PDF via API (Z-API ou Evolution API)
7. Log de entrega atualizado: `enfileirado → enviado → entregue | falha`
8. Falhas reintentadas 3x com backoff exponencial (5min, 15min, 45min)
9. Relatório de envio disponível para o RH

### Conteúdo do Comprovante PDF

- Cabeçalho: logo da empresa, nome, CNPJ, endereço
- Dados do funcionário: nome, CPF, cargo, departamento
- Competência: mês/ano de referência
- Tabela de proventos: salário base, horas extras, adicionais, benefícios
- Tabela de descontos: INSS, IRRF, VT, outros
- Totais: total proventos, total descontos, valor líquido
- Informações de crédito: banco, agência, conta, data de crédito
- Rodapé: `Documento gerado eletronicamente em DD/MM/YYYY`

### Modelo de Dados — LogEnvioComprovante

```
LogEnvioComprovante {
  id:                       UUID
  item_folha_id:            UUID          -- FK → ItemFolha
  canal:                    enum          -- email | whatsapp
  destinatario:             string        -- endereço de e-mail ou número E.164
  status:                   enum          -- enfileirado | enviado | entregue | falha | sem_canal
                                          -- "sem_canal" adicionado: estado para funcionários sem e-mail nem WhatsApp cadastrado (citado nas regras de negócio, ausente do enum original)
  tentativas:               integer       -- padrão 0
  ultima_tentativa_at:      datetime      -- nullable
  erro_descricao:           string        -- nullable
  arquivo_comprovante_path: string
  created_at:               datetime
  updated_at:               datetime
}
```

### Contrato da API

```
POST   /api/comprovantes/folha/:folha_id/enviar
  Retorna: { enfileirados, sem_canal: [] }  -- sem_canal lista funcionários sem e-mail nem WhatsApp

POST   /api/comprovantes/item/:item_folha_id/reenviar
  Body:    { canal? }  -- opcional: forçar canal específico
  Retorna: { log_id }

GET    /api/comprovantes/folha/:folha_id/relatorio
  Retorna: { total, enviados, entregues, falhas, pendentes, logs: [] }
```

### Regras de Negócio

- Comprovante enviado somente após `status` da folha = `paga`
- Funcionário sem e-mail E sem WhatsApp: log com `status = sem_canal`; alertar RH
- PDF gerado uma única vez por competência e reutilizado em reenvios
- Reenvio manual pelo RH não conta na contagem de tentativas automáticas
- Números de WhatsApp obrigatoriamente no formato E.164: `+55DDNÚMERO`

---

## Infraestrutura e Requisitos Técnicos

### Stack Recomendada

| Camada | Tecnologia Sugerida | Alternativa |
|--------|---------------------|-------------|
| Backend / API | Node.js + Fastify ou Python + FastAPI | Laravel, Django |
| Banco de dados | PostgreSQL 15+ | MySQL 8 |
| Filas / Workers | BullMQ (Redis) ou Celery (Python) | RabbitMQ |
| Agendamento | node-cron / APScheduler | Cron Linux, n8n |
| RPA / Scraping | Playwright ou Puppeteer | Selenium, UiPath |
| Armazenamento | MinIO (self-hosted) ou S3 | Google Cloud Storage |
| E-mail | Nodemailer + SMTP ou SendGrid | AWS SES, Postmark |
| WhatsApp | Z-API ou Evolution API | Twilio WhatsApp |
| IA / LLM | Claude API (Anthropic) | OpenAI GPT-4o |
| Frontend | React + Vite ou Next.js | Vue.js, Nuxt |
| Auth | JWT + Refresh Token | OAuth 2.0, Auth0 |

### Perfis de Usuário (RBAC)

| Perfil | Permissões |
|--------|------------|
| `admin` | Acesso total. Gerencia usuários, configurações, integrações. |
| `gestor` | Aprova folhas, visualiza todos os módulos, sem gerenciar usuários. |
| `analista_licitacao` | CRUD em editais, propostas e impugnações. |
| `rh` | CRUD em funcionários e folha de pagamento. |
| `financeiro` | Visualiza folha, confirma envio ao banco e confirma pagamento. |
| `readonly` | Apenas visualização em todos os módulos. |

### Variáveis de Ambiente

```env
# Banco de dados
DATABASE_URL=postgresql://user:pass@host:5432/licitacao

# Cache e filas
REDIS_URL=redis://host:6379

# Armazenamento de arquivos
STORAGE_ENDPOINT=https://minio.exemplo.com
STORAGE_KEY=access-key
STORAGE_SECRET=secret-key
STORAGE_BUCKET=licitacao-files

# E-mail
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=noreply@empresa.com
SMTP_PASS=senha

# WhatsApp
ZAPI_INSTANCE_ID=instancia-id
ZAPI_TOKEN=token
WHATSAPP_HEALTH_CHECK_INTERVAL_MIN=10  # intervalo de verificação de saúde da instância WhatsApp

# IA
ANTHROPIC_API_KEY=sk-ant-...
IA_SCORE_MIN_ENVIO=70                  # limiar mínimo de score para envio de proposta (Módulo 2)

# OCR
OCR_CONFIDENCE_MIN=0.80                # confiança mínima do OCR para preenchimento automático (Módulo 5)

# Auth
JWT_SECRET=chave-secreta-longa

# App
COMPANY_LOGO_PATH=/app/assets/logo.png
ALERT_EMAIL=admin@empresa.com
```

### Tabelas Parametrizáveis (banco de dados)

Tabelas que requerem atualização periódica por parte do `admin`. Nenhuma dessas tabelas deve ser hardcoded no código.

| Tabela | Conteúdo | Atualização |
|--------|----------|-------------|
| `tabela_irrf` | Faixas de renda e alíquotas do IRRF, com data de vigência | Anual (ou conforme legislação) |
| `tabela_inss` | Faixas e alíquotas progressivas do INSS, com data de vigência | Anual (ou conforme legislação) |
| `feriados_nacionais` | Datas de feriados nacionais por ano | Anual |
| `feriados_estaduais` | Datas por UF (opcional) | Anual |
| `adaptadores_portal` | Configuração dos scrapers por portal (seletores CSS, endpoints, tipo de autenticação) | Sob demanda (quando portal muda) |

### Monitoramento da Instância WhatsApp

A integração via Z-API ou Evolution API requer atenção ao ciclo de vida da instância:

- O sistema deve verificar a saúde da instância a cada `WHATSAPP_HEALTH_CHECK_INTERVAL_MIN` minutos via endpoint de status da API
- Se a instância reportar status diferente de `connected`, alertar o administrador via e-mail imediatamente
- O painel administrativo deve exibir o status atual da instância e oferecer link para reconexão (QR Code)
- Falhas de entrega por instância desconectada devem ser registradas como `falha` no `LogEnvioComprovante`, com `erro_descricao` descritivo, e reprocessadas automaticamente quando a conexão for restabelecida

### Plano de Implementação

| Fase | Módulos | Estimativa | Justificativa |
|------|---------|------------|---------------|
| Fase 1 — Core | Módulo 5 (Documentos) + Módulo 1 (Busca) | 3–4 semanas | Módulo 5 precede o Módulo 2: documentos vencidos bloqueiam geração de pacotes de proposta. Módulo 1 alimenta todos os módulos subsequentes. |
| Fase 2 — Propostas | Módulo 2 (Submissão) + Módulo 3 (Acompanhamento) | 3–4 semanas | Depende do Módulo 1 (editais) e do Módulo 5 (dossiê válido). |
| Fase 3 — Jurídico | Módulo 4 (Impugnação) | 2–3 semanas | Depende do Módulo 1 (editais) e da infraestrutura de IA já operacional. |
| Fase 4 — RH | Módulo 6 (Folha) + Módulo 7 (Comprovantes) | 3–4 semanas | Módulo 7 depende do Módulo 6 (evento `pagamento_confirmado`). Sem dependência dos módulos de licitação. |
