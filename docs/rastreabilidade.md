# Rastreabilidade TCC3 — evidência de código

Fonte: TCC3 recuperado somente para leitura do commit histórico 4d2fc17. Origem:
4.3.5.3 (RF01–RF07), 4.4.2 (RF08–RF13), 4.4.3 (RNF), 4.4.4 (RN)
e 4.4.14 (TS). Validado exige comando executado neste checkout; pendente e
bloqueado não contam como pronto.

## Requisitos funcionais

| Item e fonte | Código | Teste/evidência | Estado |
|---|---|---|---|
| RF01 — 4.3.5.3 / T06 | modules/servicos; servicos-page.tsx | servico.api.test.ts; portfolio-pages.test.tsx | Validado |
| RF02 — 4.3.5.3 / T08 | CustoServico Decimal; custos-page.tsx | servico.api.test.ts; portfolio-pages.test.tsx: CAPEX/OPEX e null distinto de zero | Validado |
| RF03 — 4.3.5.3 / T09 | DemandaCapacidade; demanda-page.tsx | servico.api.test.ts; portfolio-pages.test.tsx: período, unidade e capacidade ausente | Validado |
| RF04 — 4.3.5.3 / T10 | modules/vinculos; migração `VinculoEstrategico.indicadorId`; vinculos-page.tsx | vinculo.service.test.ts; alinhamento.api.test.ts; TS15: indicador persistido, 35%/70%/65%, 422/saldo | Validado |
| RF05 — 4.3.5.3 / T04 | normalizarEstrategia; estrategiaCompleta; estrategia-page.tsx | estrategia.service.test.ts; strategy-pages.test.tsx: quatro Ps, histórico e concorrência | Validado |
| RF06 — 4.3.5.3 / T11 | modules/indicadores; indicadores-page.tsx | indicador.service.test.ts; alinhamento.api.test.ts; portfolio-pages.test.tsx | Validado |
| RF07 — 4.3.5.3 / T13 | simulacao/calculo.ts; indicadores-painel-page.tsx | indicadores.calculo.test.ts; cenario.api.test.ts; simulation-pages.test.tsx | Validado para SLA (cumprimento), satisfação e tempo; receita/custo pendentes |
| RF08 — 4.4.2 / T01 | modules/auth; JWT middleware; AuthProvider; login-page.tsx | auth.service.test.ts; integration.test.ts; auth-flow.test.tsx | Validado |
| RF09 — 4.4.2 / T02 | modules/organizacoes; Prisma; painel-page.tsx | api.test.ts; integration.test.ts; pages.test.tsx | Validado |
| RF10 — 4.4.2 / T03 | analiseAmbienteSchema; analises-ambiente; analise-page.tsx | analise-ambiente.service.test.ts; analise-ambiente.integration.test.ts; strategy-pages.test.tsx | Validado |
| RF11 — 4.4.2 / T12 | simulacao gerador/cenario.service/calculo; cenario-page.tsx | simulacao.test.ts; cenario.api.test.ts; simulation-pages.test.tsx | Validado |
| RF12 — 4.4.2 / T15 | professor; GET /professor/ambientes/:organizacaoId/relatorio; ambientes-page.tsx | professor.api.test.ts; professor.repository.integration.test.ts; report-pages.test.tsx; TS15 E2E | Validado |
| RF13 — 4.4.2 / T14 | relatorios; prévia HTML e PDF no servidor; relatorio-page.tsx | relatorio.service.test.ts extrai texto/páginas/acentos; relatorio.api.test.ts; report-pages.test.tsx; TS15 E2E baixa PDF | Validado |

## Regras de negócio

| Item e fonte | Código | Teste/evidência | Estado |
|---|---|---|---|
| RN01 — 4.4.4 | cadastro transacional; usuarioId unique; seed reparador | auth.service.test.ts; seed-idempotencia.integration.test.ts | Validado |
| RN02 — 4.4.4 | estrategiaCompleta normaliza espaços; exportação bloqueada | estrategia.service.test.ts; relatorio.service.test.ts (TS06) | Validado |
| RN03 — 4.4.4 | PrismaEstrategiaRepository bloqueia organização e versão imutável | estrategia.service.test.ts: sem alteração e concorrência | Validado |
| RN04 — 4.4.4 | serviço autorizado antes de indicador | indicador.service.test.ts; alinhamento.api.test.ts | Validado |
| RN05 — 4.4.4 | vínculo/indicador na mesma organização, serviço e objetivo; justificativa | vinculo.service.test.ts; alinhamento.api.test.ts; TS15 | Validado |
| RN06 — 4.4.4 | criarComLimite transacional por objetivo | vinculo.service.test.ts; alinhamento.api.test.ts: 100%, excesso, saldo e concorrência HTTP; TS15: 35/70/65 | Validado |
| RN07 — 4.4.4 | filtro EM_OPERACAO; histórico preservado | indicadores.calculo.test.ts (TS07); cenario.api.test.ts | Validado |
| RN08 — 4.4.4 | meta/sentido obrigatórios e comparação por direção | indicador.service.test.ts; indicadores.calculo.test.ts (TS03) | Validado |
| RN09 — 4.4.4 | gerador puro v1; semente; UTC; ordem; persistência separada | simulacao.test.ts (TS04); cenario.api.test.ts | Validado |
| RN10 — 4.4.4 | listarPendencias; servicos-page.tsx | vinculo.service.test.ts; alinhamento.api.test.ts: todo status sem vínculo | Validado |
| RN11 — 4.4.4 | leitura alvo por professor; escrita própria pelo sub | professor.api.test.ts (TS11); professor.repository.integration.test.ts; TS15 E2E | Validado |

## Requisitos não funcionais

| Item e fonte | Código/evidência | Estado |
|---|---|---|
| RNF01 — 4.4.3 | menu lateral e rotas T01–T15; TS15 E2E; revisão layout | Implementado; pendente ensaio manual de profundidade |
| RNF02 — 4.4.3 | gerador/cálculo/persistência separados; benchmark | Validado localmente: TS12 4,48 ms; TS13 p95 107,96 ms |
| RNF03 — 4.4.3 | SPA Vite/React; test:e2e Firefox 141.0 e Chrome 153.0.8010.52 | Pendente: Microsoft Edge não instalado |
| RNF04 — 4.4.3 | styles.css min-width 1024px; accessibility.test.tsx; TS14/TS15 | Implementado; pendente inspeção visual 1024/1440 px |
| RNF05 — 4.4.3 | bcrypt, JWT expirável, sessão e 401 | Validado: auth.service.test.ts; integration.test.ts; auth-flow.test.tsx |
| RNF06 — 4.4.3 | organização pelo JWT; filtros por cadeia; leitura só professor | Validado: TS09, alinhamento.api.test.ts e professor.api.test.ts |
| RNF07 — 4.4.3 | Dockerfile, Compose, CORS, Tailscale e operação documentados | Pendente: sem nuvem ou janela real de disponibilidade |
| RNF08 — 4.4.3 | Git, camadas web/domínio/repositório e cálculo separado | Validado: npm test; indicadores.calculo.test.ts; simulacao.test.ts |
| RNF09 — 4.4.3 | interface em português e ajuda didática | Implementado; pendente revisão humana integral de termos ITIL |
| RNF10 — 4.4.3 | benchmark 40 JWTs, Express e PostgreSQL TCP | Validado localmente; não extrapolado para nuvem |
| RNF11 — 4.4.3 | versões imutáveis de EstrategiaServico | Validado: estrategia.service.test.ts; strategy-pages.test.tsx |

## Casos de teste

| Item e fonte | Evidência executável | Estado |
|---|---|---|
| TS01 — 4.4.14 | indicadores.calculo.test.ts: percentual de slaCumprido, tolerância 0,01 p.p. | Bloqueado: cumprimento de SLA não é disponibilidade/uptime do TCC |
| TS02 — 4.4.14 | indicadores.calculo.test.ts e fixture-didatica.test.ts: 8+12+15+20+25 = 80; média 16 | Validado |
| TS03 — 4.4.14 | indicadores.calculo.test.ts: acima, igual e abaixo em ambos sentidos | Validado |
| TS04 — 4.4.14 | simulacao.test.ts: mesma semente/parâmetros, conteúdo canônico idêntico | Validado |
| TS05 — 4.4.14 | vinculo.service.test.ts: 100% aceito e excesso recusado; TS15: 35% + 70% recusado, +65% aceito | Validado |
| TS06 — 4.4.14 | relatorio.service.test.ts: P vazio retorna 422 | Validado |
| TS07 — 4.4.14 | indicadores.calculo.test.ts e cenario.api.test.ts: descontinuado excluído | Validado |
| TS08 — 4.4.14 | alinhamento.api.test.ts: POST retorna 422 e saldo; TS15 mostra saldo de 65% e preserva formulário | Validado por HTTP/PostgreSQL e SPA real |
| TS09 — 4.4.14 | integration.test.ts: dois alunos, cruzado 403 sem dados | Validado por HTTP/PostgreSQL |
| TS10 — 4.4.14 | integration.test.ts: token ausente, inválido e expirado 401 | Validado por HTTP |
| TS11 — 4.4.14 | professor.api.test.ts: aluno 403; próprio ambiente permite escrita | Validado por HTTP/PostgreSQL |
| TS12 — 4.4.14 | simulacao.performance.test.ts e npm run benchmark: 10.000 em 4,48 ms | Validado localmente contra 10 s |
| TS13 — 4.4.14 | servico.api.test.ts e benchmark: 40 consultas, p95 107,96 ms, 0 erro | Validado localmente contra 2 s |
| TS14 — 4.4.14 | tests/e2e/ts14.spec.ts em Firefox 141.0 e Chrome 153.0.8010.52 | Pendente: Edge não instalado; três navegadores não cumprido |
| TS15 — 4.4.14 | tests/e2e/ts15.spec.ts: login, indicador antes do vínculo, 35/70/65, simulação, revisão, download PDF e professor sem escrita | Validado em Firefox e Chrome, sem mock |

## Casos de uso

| Item e fonte | Fluxo/API/tela | Evidência | Estado |
|---|---|---|---|
| UC01 — acesso | `POST /auth/registro`, `/auth/login`, T01 | auth.service.test.ts; auth-flow.test.tsx | Validado |
| UC02 — organização | `/organizacoes/minha`, T02 | api.test.ts; pages.test.tsx | Validado |
| UC03 — SWOT | `/analises-ambiente`, T03 | analise-ambiente.integration.test.ts | Validado |
| UC04 — quatro Ps | `/estrategia`, versões, T04 | estrategia.service.test.ts | Validado |
| UC05 — objetivos | `/objetivos`, cobertura, T05 | objetivo.service.test.ts | Validado |
| UC06 — portfólio | `/servicos`, T06/T07 | servico.api.test.ts | Validado |
| UC07 — custos | `/servicos/:id/custos`, T08 | servico.api.test.ts | Validado |
| UC08 — demanda | `/servicos/:id/demanda`, T09 | servico.api.test.ts | Validado |
| UC09 — vínculo | `/vinculos`, T10/T10b | vinculo.service.test.ts; TS15 | Validado |
| UC10 — indicador | `/servicos/:id/indicadores`, T11 | indicador.service.test.ts | Validado |
| UC11 — cenário | `POST /cenarios`, T12 | cenario.api.test.ts | Validado |
| UC12 — painel | `/indicadores/painel`, T13 | indicadores.calculo.test.ts | Validado para fontes definidas |
| UC13 — relatório | `/relatorios/estrategia/exportacao`, T14/T14b | relatorio.service.test.ts; TS15 | Validado |
| UC14 — professor | `/professor/ambientes`, T15 | professor.api.test.ts; TS15 | Validado |

## Telas e estados alternativos

| Tela | Comportamento e evidência | Estado |
|---|---|---|
| T01–T02 | login reativo, sessão, organização e painel sem dados fixos; auth-flow.test.tsx | Validado |
| T03–T05 | SWOT, quatro Ps/histórico e objetivos/cobertura; strategy-pages.test.tsx | Validado |
| T06–T09 | portfólio, detalhe, custos e demanda; portfolio-pages.test.tsx | Validado |
| T10/T10b | indicador obrigatório, saldo e erro 422 preservando formulário; portfolio-pages.test.tsx; TS15 | Validado |
| T11–T13 | indicadores, cenário e painel; simulation-pages.test.tsx | Validado para fontes definidas |
| T14/T14b | prévia HTML, PDF e bloqueio dos Ps ausentes; report-pages.test.tsx; relatorio.service.test.ts | Validado |
| T15 | leitura do aluno e bloqueio de escrita; report-pages.test.tsx; TS15 | Validado |

## Limites assumidos e retomada

- SLA é **cumprimento de SLA** (slaCumprido / registros elegíveis), não disponibilidade temporal. A fonte não fornece uptime/downtime; TS01 permanece bloqueado.
- CUSTO e RECEITA existem no enum, mas o TCC não define fonte operacional ou fórmula. Não há gráfico, medição ou alegação de cálculo para esses tipos.
- E2E, benchmark e gates usam PostgreSQL descartável protegido antes de migrar, seed ou limpeza. Nenhuma prova usa menu, mock ou modelo como substituto de fluxo real.
- Pendências externas: Edge, inspeção visual/teclado/foco/contraste manual, revisão integral de vocabulário ITIL e implantação/monitoramento em nuvem.
