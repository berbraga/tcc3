# EduITSM TCC3 Code Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinhar a implementação atual do EduITSM ao TCC3, estabilizar a fundação e produzir evidências honestas para RF01–RF13, RN01–RN11, RNF01–RNF11 e TS01–TS15.

**Architecture:** Preservar o monorepo React/Express/Prisma existente. A interface usará um `AuthProvider` reativo e o cliente Axios continuará sendo a fronteira de sessão; a API manterá rotas finas, serviços de domínio e repositórios filtrados por organização. Geração de registros, persistência de cenários e cálculo de indicadores permanecerão módulos separados.

**Tech Stack:** TypeScript, React, React Router, Axios, TanStack Query, Express, Prisma/PostgreSQL, Zod, JWT, bcrypt, Vitest, Supertest, Testing Library e Playwright.

**Spec:** `docs/superpowers/specs/2026-09-21-alinhamento-tcc3-codigo-design.md`

## Global Constraints

- Preservar React/TypeScript, Express, Prisma/PostgreSQL, npm workspaces, Axios, TanStack Query, Zod e JWT/bcrypt.
- Não alterar `TCC_3_BernardoBraga_final_sem_revisoes.docx`, diagramas ou protótipos.
- Não incluir helpdesk, incidentes, mudanças, CMDB, cobrança, integrações externas ou turmas.
- Derivar a organização do aluno exclusivamente do `sub` do JWT; IDs do cliente nunca autorizam acesso.
- Professor lê organizações de alunos sem trocar token e pode editar apenas seu próprio ambiente.
- Seed é idempotente e só aceita desenvolvimento/teste com autorização explícita.
- Nunca inventar fórmula de receita nem chamar cumprimento de SLA de uptime/disponibilidade temporal.
- Gates de cada incremento: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check`.

## Review Focus

- Sessão corrompida, expirada ou trocada deve limpar cache e nunca exibir dados de outro usuário.
- Uma URL de produção deve ser recusada antes de qualquer migração, seed ou limpeza do banco de testes.
- Salvamentos concorrentes de estratégia e vínculos não podem criar versões duplicadas nem ultrapassar 100%.
- Duas simulações do mesmo período devem permanecer identificáveis, sem sobrescrever medições silenciosamente.
- Professor deve ler um aluno, receber 403 ao escrever nele e continuar editando o próprio ambiente.

## Mapa de arquivos

- `apps/web/src/auth/`: provider, contrato de sessão e hooks reativos.
- `apps/web/src/services/api.ts`, `apps/web/src/app.tsx`, `apps/web/src/components/layout.tsx`: sessão, 401, cache, rotas e saída.
- `apps/api/src/config/`: ambiente e proteção de banco de testes.
- `apps/api/prisma/seed.ts`, `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`: seed e persistência.
- `apps/api/src/modules/`: serviços/repositórios/rotas de domínio já existentes; modificar apenas divergências demonstradas.
- `apps/api/test/`, `apps/web/src/test/`, `tests/e2e/`: regressões unitárias, HTTP, interface e navegador.
- `docs/alinhamento-tcc.md`, `docs/rastreabilidade.md`, `README.md`, `docs/decisoes-tecnicas.md`: evidência operacional.

### Task 1: Diagnóstico rastreável, ambiente e banco de testes

**Files:** Create `docs/alinhamento-tcc.md`, `apps/api/src/config/database-safety.ts` if missing, `apps/api/test/database-command-safety.test.ts`; modify root `package.json`, `apps/api/package.json`, `apps/api/src/config/env.ts`, `.env.example`, `README.md`.

**Interfaces:** `validarBancoDeTeste(url: string): void`; `carregarAmbiente(input): AmbienteConfig`; scripts `db:deploy`, `db:seed` e `test` recebem ambiente de forma explícita.

- [ ] Registrar diagnóstico atual, fontes TCC3 recuperadas do commit `4d2fc17`, estado de RF/RN/RNF/TS e próximo passo em `docs/alinhamento-tcc.md`.
- [ ] Escrever teste RED que forneça URL de produção e verifique que o comando de teste falha antes de Prisma, migração ou seed.
- [ ] Implementar carregamento único do `.env` da raiz para API, Prisma, seed e testes; manter apenas `VITE_*` exposto ao Vite.
- [ ] Implementar a guarda antes de qualquer conexão Prisma; aceitar somente schema/nome explicitamente de teste e rejeitar senhas/parâmetros enganadores.
- [ ] Corrigir README e scripts para uma instalação limpa: `npm ci`, `db:deploy`, seed demo autorizado, build shared e execução.
- [ ] Rodar teste focado RED/GREEN, depois todos os gates; commit `fix: stabilize environment and test database safety`.

### Task 2: Sessão reativa, expiração, logout e regressões da fundação

**Files:** Create `apps/web/src/auth/auth-context.tsx`, `apps/web/src/auth/session.ts`; modify `apps/web/src/app.tsx`, `apps/web/src/main.tsx`, `apps/web/src/services/api.ts`, `apps/web/src/pages/login-page.tsx`, `apps/web/src/components/layout.tsx`; test `apps/web/src/test/auth-flow.test.tsx`, `apps/api/test/auth.service.test.ts`.

**Interfaces:** `AuthProvider`; `useAuth(): { session, login, logout, replaceSession }`; `parseSession(raw): AuthResponse | null`; Axios response interceptor que chama `logout()` uma vez em `401`.

- [ ] Escrever testes RED para login sem reload, refresh de sessão válida, JSON corrompido, token expirado, 401, logout, troca de usuário e limpeza de cache TanStack Query.
- [ ] Implementar `AuthProvider` com estado inicial reidratado, validação de sessão e navegação protegida sem loop.
- [ ] Integrar login ao provider e mover a autorização do `app.tsx` para o estado reativo.
- [ ] Implementar interceptor `401`, `sessionStorage.removeItem`, `queryClient.clear()` e botão `Sair`.
- [ ] Adicionar E2E/API regression para cadastro transacional e rollback quando uma escrita intermediária falhar; preservar proibição de perfil PROFESSOR no cadastro público.
- [ ] Rodar testes focados e gates completos; commit `fix: harden reactive authentication flow`.

### Task 3: Auditoria e correções das Fases 2 e 3

**Files:** Modify somente arquivos divergentes em `packages/shared/src/index.ts`, `apps/api/src/modules/{analises-ambiente,estrategia,objetivos,servicos,vinculos,indicadores}`, `apps/api/prisma/schema.prisma` e `apps/web/src/pages/*`; test corresponding API/service/UI suites.

**Interfaces:** manter rotas existentes; serviços devem aceitar `usuarioId`/`organizacaoId` derivada e retornar erros de domínio padronizados; `estrategiaCompleta(value): boolean` permanece única fonte da RN02.

- [ ] Escrever testes RED para SWOT tipo/categoria incoerentes, objetivo cruzado, estratégia com espaços, salvamento sem alteração, concorrência de versão e RN10 para todo serviço sem vínculo.
- [ ] Corrigir schemas/serviços/repositórios com filtros por organização e histórico imutável; não adicionar regras não previstas no TCC3.
- [ ] Verificar Decimal em custos, `valorRealizado` ausente versus zero, demanda/capacidade e exclusão/edição com relações.
- [ ] Verificar RN06 sob concorrência e 422 com saldo; testar indicador apenas em serviço autorizado e meta/sentido obrigatórios.
- [ ] Atualizar telas para estados carregando/erro/vazio/sucesso e ajuda didática dos quatro Ps; manter menus reais.
- [ ] Rodar suites focadas, gates e atualizar `docs/rastreabilidade.md`; commit `fix: align strategic and portfolio domains with tcc3`.

### Task 4: Simulação, cenários e semântica dos indicadores

**Files:** Modify `apps/api/prisma/schema.prisma`, create incremental migration, modify `apps/api/src/modules/simulacao/{gerador,cenario.service,cenario.repository,calculo}.ts`, `apps/api/src/modules/indicadores/*`, shared contracts and `apps/web/src/pages/{cenario,indicadores-painel}-page.tsx`; test simulation/calculation/API suites.

**Interfaces:** `gerarRegistros(input): RegistroSimulado[]` permanece pura; `persistirCenario(usuarioId,input)` executa transação; `calcularIndicadores(registros, indicadores)` retorna período, cenário, unidade, valor, denominador e situação.

- [ ] Escrever testes RED para pré-requisitos UC11, timezone/ordenação, serviços em operação, repetição de cenário, cenário concorrente e ausência de dados.
- [ ] Definir versão do gerador, semente, perfil, período inclusivo, timezone e canonicalização; comparar conteúdo operacional, nunca UUID/timestamp.
- [ ] Ajustar persistência para manter cenário identificável em medições/painel e impedir duplicação silenciosa; aplicar migração somente incremental.
- [ ] Calcular cumprimento de SLA como percentual de `slaCumprido` elegível e documentar que não é uptime; manter CUSTO/RECEITA pendentes sem fonte.
- [ ] Garantir que descontinuados não recebem medições nem participam do resultado atual e que estados parciais fazem rollback.
- [ ] Atualizar painel com cenário/período, sem medição, evolução e próximo passo de revisão; rodar benchmark 10.000 separado em geração/persistência/cálculo.
- [ ] Rodar testes focados, gates e registrar a lacuna de receita em `docs/alinhamento-tcc.md`; commit `fix: align simulation identity and indicator semantics`.

### Task 5: Relatório e professor com escopo correto

**Files:** Modify `apps/api/src/modules/{relatorios,professor}`, `apps/web/src/pages/{relatorio,ambientes}-page.tsx`, repositories/shared contracts; test API/UI/integration suites.

**Interfaces:** relatório inclui organização, 4 Ps, versão, portfólio, vínculos, indicadores, período e origem; professor recebe alvo somente como seletor autorizado; escrita em alvo de aluno retorna 403.

- [ ] Escrever testes RED para relatório incompleto 422, isolamento de conteúdo, professor lendo aluno, professor escrevendo aluno 403, aluno acessando supervisão 403 e professor editando próprio ambiente.
- [ ] Corrigir autorização server-side por perfil e organização-alvo sem impersonação; preservar o contexto do próprio professor ao retornar.
- [ ] Corrigir exportação efetiva HTML imprimível/arquivo e sanitização; não tratar JSON como exportação concluída.
- [ ] Testar fluxo relatório/paginação com dados reais e estados de erro/vazio; atualizar rastreabilidade RF12/RF13/RN11.
- [ ] Rodar gates e commit `fix: align report and professor boundaries with tcc3`.

### Task 6: Jornada E2E TS15 e compatibilidade TS14

**Files:** Modify `playwright.config.ts`, `tests/e2e/ts14.spec.ts`; create `tests/e2e/ts15.spec.ts`, helper de ambiente E2E se necessário; modify README/rastreabilidade.

**Interfaces:** comandos `npm run test:e2e` e `npm run test:e2e -- --project=<browser>` usam PostgreSQL descartável, API e web reais; nenhum mock de API no E2E.

- [ ] Escrever TS15 RED para a jornada TechNova login → organização → SWOT → 4 Ps → objetivos → serviço → custos/demanda → vínculo → indicador → operação → cenário → painel → revisão → relatório → professor.
- [ ] Implementar o roteiro com dados de seed separados de resultados simulados; alterar Portal B2B para operação pela UI/API antes de simular.
- [ ] Configurar projetos Firefox/Chromium/Edge somente quando os binários estiverem instalados; registrar versão e marcar navegador ausente como pendente.
- [ ] Executar TS14 e TS15 com API/PostgreSQL reais, sem intervenção manual no banco; registrar screenshots/trace apenas como artefatos ignorados.
- [ ] Atualizar README e `docs/rastreabilidade.md` com versões e resultados reais; commit `test: verify complete tcc3 browser journey`.

### Task 7: Desempenho, capacidade e implantação documentada

**Files:** Create `apps/api/test/load.test.ts` or script de carga controlada; modify `README.md`, `docs/decisoes-tecnicas.md`, CI/deploy somente se a medição justificar.

**Interfaces:** relatório de benchmark registra hardware, volume, operação, p50/p95, erros e tempo total; não altera dados reais sem banco descartável.

- [ ] Escrever teste/roteiro para 40 usuários simultâneos com dados de teste isolados e limites de erro/tempo explícitos.
- [ ] Medir separadamente geração de 10.000 registros, persistência, cálculo e operação HTTP; registrar resultado sem transformar uma medição local em disponibilidade em nuvem.
- [ ] Verificar Chrome/Edge/Firefox disponíveis, layout 1024/1440, foco/teclado manual e limitações de contraste JSDOM.
- [ ] Revisar Docker, CORS, Tailscale, migração, seed seguro, shutdown e variáveis; documentar o que não foi implantado externamente.
- [ ] Rodar gates, auditoria offline, `git diff --check` e commit `docs: record tcc3 performance and deployment evidence`.

### Task 8: Rastreabilidade e verificação final

**Files:** Modify `docs/alinhamento-tcc.md`, `docs/rastreabilidade.md`, `README.md`, `docs/decisoes-tecnicas.md`; create final verification report if needed.

- [ ] Mapear cada RF01–RF13, RN01–RN11, RNF01–RNF11 e TS01–TS15 para seção do TCC3, arquivo, teste/comando e estado explícito.
- [ ] Conferir que nenhuma alegação usa mock, menu, modelo ou teste não executado como funcionalidade validada.
- [ ] Rodar do topo: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit --omit=dev --offline`, `git diff --check` e `git status --short`.
- [ ] Solicitar revisão final independente e usar verification-before-completion antes de declarar o alinhamento concluído.
- [ ] Commit `docs: close tcc3 alignment verification` somente se todas as pendências estiverem explicitamente classificadas.

## Checkpoints

- Após Task 1: fundação e ambiente reproduzíveis.
- Após Task 3: Fases 2–3 auditadas com isolamento real.
- Após Task 4: cenário/painel com semântica documentada e sem mistura entre cenários.
- Após Task 5: relatório e professor server-side seguros.
- Após Task 6: jornada E2E real e navegadores disponíveis registrados.
- Após Task 8: matriz final sem alegações além das evidências.
