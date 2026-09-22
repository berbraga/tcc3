# EduITSM TCC3 Examples, PDF and Indicator Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Completar as lacunas do TCC3 atual com vínculo indicador-serviço-objetivo persistido, PDF utilizável, exemplo TechNova reproduzível e evidências/documentação atualizadas.

**Architecture:** Preservar React/TypeScript, Express, Prisma/PostgreSQL e `packages/shared`. Adicionar a associação opcional `indicadorId` ao vínculo por migração incremental, gerar PDF no servidor a partir do relatório persistido e manter HTML como prévia. Separar fixture didática, roteiro e resultados de simulação para que números pedagógicos não apareçam como medições gerais.

**Tech Stack:** React, TypeScript, Express, Zod, Prisma 6/PostgreSQL 16, Vitest, Supertest, Playwright e biblioteca PDF já compatível com o workspace; nenhuma dependência será atualizada sem necessidade concreta.

**Spec:** `docs/superpowers/specs/2026-09-21-alinhamento-tcc3-codigo-design.md`, requisitos do TCC3 recuperados do commit histórico `f2218dd`, especialmente Quadros 11, 14–16, 17–23 e 25–27 e seção 4.3.5.5.

## Global Constraints

- Preservar dados existentes; vínculos antigos com `indicadorId` nulo permanecem válidos e não recebem associação inventada.
- Derivar organização do usuário autenticado e validar serviço, objetivo e indicador na mesma organização.
- PDF deve ser arquivo abrível e legível; bytes isolados não contam como validação.
- Estratégia incompleta retorna 422 na exportação e informa os Ps ausentes.
- Contribuições 35% + 70% retornam 422 com saldo 65%; contribuição adicional de 65% é aceita.
- A amostra didática 8, 12, 15, 20 e 25 tem média independente de 16 minutos.
- Cumprimento de SLA não será chamado de uptime; receita não será derivada sem fonte/fórmula documental.
- Edge, nuvem, acessibilidade manual e disponibilidade temporal permanecem pendentes sem evidência externa.
- Não alterar monografia, diagramas ou protótipos; registrar divergências em `docs/ajustes-documentais-propostos.md`.

## Review Focus

- Migração com vínculos legados: `indicadorId` nulo, nenhuma associação automática e rollback seguro.
- Autorização indireta: indicador precisa pertencer ao serviço e à organização do vínculo; IDs cruzados retornam 403/404 conforme contrato.
- PDF real: acentos, caracteres HTML perigosos, paginação, conteúdo persistido e bloqueio de estratégia incompleta.
- Exemplo versus simulação: fixture de cinco atendimentos nunca pode contaminar o painel geral nem criar medição artificial.
- Seed idempotente: períodos obedecem aos contratos da API e Portal B2B continua EM_DESENHO até transição explícita.

### Task 1: Contrato e migração do indicador no vínculo

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260922120000_vinculo_indicador/migration.sql`
- Modify: `apps/api/src/modules/vinculos/vinculo.service.ts`
- Modify: `apps/api/src/modules/vinculos/vinculo.repository.ts`
- Modify: `apps/api/src/modules/vinculos/vinculo.routes.ts`
- Modify: `apps/web/src/pages/vinculos-page.tsx`
- Test: `apps/api/test/vinculo.service.test.ts`, `apps/api/test/alinhamento.api.test.ts`, `apps/web/src/test/strategy-pages.test.tsx`

**Interfaces:**
- `VinculoEstrategicoInput` passa a conter `indicadorId?: string | null` para compatibilidade legada.
- Repositório valida `indicadorId` por `servicoId`, `objetivoId` e `organizacaoId` antes da transação de limite.
- Resposta lista o indicador selecionado com nome/tipo quando existir.

- [ ] Escrever testes RED para vínculo legado sem indicador, indicador de outro serviço, indicador de outra organização, seleção persistida e recarregamento.
- [ ] Criar migração incremental nullable sem backfill inventado; verificar que linhas anteriores permanecem com `NULL`.
- [ ] Implementar validação de coerência dentro da transação e retorno 422/404 conforme recurso e regra.
- [ ] Atualizar formulário para selecionar indicador compatível, preservar seleção após erro e mostrar acesso à criação quando não houver indicador.
- [ ] Rodar testes API/web, lint e typecheck; commit `feat: persist indicator evidence on strategic links`.

### Task 2: TechNova, fixture conhecida e roteiro demonstrável

**Files:**
- Modify: `apps/api/src/modules/demo/seed.service.ts`
- Modify: `apps/api/test/seed-demo.test.ts`, `apps/api/test/servico.service.test.ts`
- Create: `apps/api/src/modules/simulacao/fixture-didatica.ts`
- Create: `apps/api/test/fixture-didatica.test.ts`
- Create: `docs/roteiro-demonstracao-technova.md`

**Interfaces:**
- `calcularMediaAtendimentos(tempos: readonly number[]): number` retorna média aritmética válida.
- `fixtureCincoAtendimentos` exporta `[8, 12, 15, 20, 25]` somente para testes/roteiro didático.

- [ ] Escrever teste RED para soma 80, média 16 e avaliação MENOR_MELHOR com meta 15 como abaixo da meta.
- [ ] Corrigir seed para períodos `YYYY-MM`, CAPEX `150000`, OPEX mensal `15000`, demanda `500 clientes` separada de `10000 transações/mês`, estratégia e padrão do segundo projeto consecutivo; manter Portal B2B EM_DESENHO.
- [ ] Garantir que seed não crie `Medicao` nem resultado de cenário como se fosse execução pedagógica.
- [ ] Escrever roteiro com contas locais, pré-condições, ordem indicador→vínculo, 35%/70%/65%, fixture, revisão e professor.
- [ ] Rodar seed idempotente e testes; commit `docs: add reproducible TechNova demonstration`.

### Task 3: PDF utilizável e prévia HTML

**Files:**
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/api/src/modules/relatorios/relatorio.service.ts`
- Modify: `apps/api/src/modules/relatorios/relatorio.routes.ts`
- Modify: `apps/api/test/relatorio.service.test.ts`, `apps/api/test/relatorio.api.test.ts`
- Modify: `apps/web/src/pages/relatorio-page.tsx`
- Modify: `apps/web/src/test/report-pages.test.tsx`
- Modify: `package.json`, `apps/api/package.json` only if the selected PDF library is necessary

**Interfaces:**
- `exportarPdf(usuarioId: string): Promise<{ nomeArquivo: string; contentType: 'application/pdf'; conteudo: Buffer }>`.
- HTML remains available as `renderizarHtml`/preview and is not the primary export response.

- [ ] Escrever testes RED para 422 com cada P ausente, conteúdo PDF autorizado e HTML preview.
- [ ] Implementar PDF server-side com fonte persistida, UTF-8/acentos, títulos, tabelas e paginação; incluir análise de ambiente, 4 Ps, versão, objetivos, portfólio, vínculos/indicador, medições, período, cenário e origem.
- [ ] Validar arquivo abrindo com parser/inspeção de páginas e texto extraído, não apenas magic bytes.
- [ ] Testar professor lendo relatório de aluno e aluno sem acesso cruzado; confirmar ausência de credenciais/campos internos.
- [ ] Rodar API/web/build; commit `feat: export strategy report as readable pdf`.

### Task 4: Rastreabilidade, ajustes documentais e verificação final

**Files:**
- Create: `docs/ajustes-documentais-propostos.md`
- Modify: `docs/alinhamento-tcc.md`
- Modify: `docs/rastreabilidade.md`
- Modify: `README.md`
- Modify: `docs/decisoes-tecnicas.md`
- Test: `tests/e2e/ts15.spec.ts`, `apps/api/test/cenario.api.test.ts`, `apps/api/test/relatorio.api.test.ts`

**Interfaces:**
- Rastreabilidade registra fonte, arquivo/rota/tela, teste/comando e estado para RF01–RF13, RN01–RN11, RNF01–RNF11, TS01–TS15, UC01–UC14 e T01–T15.

- [ ] Adicionar E2E do fluxo TechNova completo com seleção de indicador no vínculo e PDF baixado/aberto.
- [ ] Atualizar ajustes documentais para SLA/disponibilidade, receita, cadastro de professor, indicador no vínculo e estado histórico.
- [ ] Registrar resultados efetivamente executados e manter pendências Edge, nuvem, acessibilidade manual, uptime e receita.
- [ ] Rodar `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm audit --omit=dev --offline` e `git diff --check`.
- [ ] Fazer revisão independente e somente então informar funcionalidades, evidências e bloqueios sem declarar 100%.
