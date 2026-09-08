# EduITSM Fases 2 a 6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar as Fases 2–6 do EduITSM, mantendo a Fase 1 executável e cobrindo todas as regras RN02–RN11 e testes TS01–TS15.

**Architecture:** Expandir o monorepo por módulos de domínio independentes. Cada módulo terá contrato Zod compartilhado, serviço testável sem Express, repositório Prisma filtrado por organização e rotas finas. A web seguirá as telas T03–T15 com TanStack Query, estados explícitos e menu habilitado somente após a API correspondente estar pronta.

**Tech Stack:** TypeScript estrito, React, React Router, Axios, TanStack Query, Express, Prisma, PostgreSQL 16, Zod, Vitest, Supertest, bcrypt/JWT e biblioteca de exportação PDF/HTML mínima a ser escolhida na tarefa de relatório.

**Spec:** `docs/superpowers/specs/2026-09-08-fases-2-a-6-design.md`

## Global Constraints

- Preservar documentos, protótipos e diagramas existentes.
- Interface em português brasileiro; tarefas acessíveis em no máximo três níveis.
- Toda rota protegida deriva a organização do `sub` do JWT.
- Cada regra nova recebe teste positivo e negativo antes da implementação.
- Registros operacionais só podem ser criados pelo motor determinístico.
- Antes de cada commit de fase: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- Não expor senha, token, dados de outra organização ou segredos em logs/respostas.

---

## Mapa de arquivos

- `packages/shared/src/index.ts`: schemas, enums, tipos de entrada e respostas das novas rotas.
- `apps/api/prisma/schema.prisma` e `apps/api/prisma/migrations/`: alterações de persistência, índices e constraints.
- `apps/api/src/modules/<modulo>/`: serviços de domínio, rotas e repositórios específicos.
- `apps/api/src/modules/simulacao/`: PRNG determinístico, gerador em lote e calculadora de indicadores.
- `apps/api/test/`: testes unitários, HTTP, integração, desempenho e segurança.
- `apps/web/src/pages/`: páginas T03–T15; `components/` receberá formulários, tabelas e estados reutilizáveis.
- `docs/rastreabilidade.md`, `README.md` e `docs/decisoes-tecnicas.md`: evidências, comandos e decisões de cada fase.
- `~/.agents/skills/eduitsm-development/SKILL.md`: skill reutilizável criada e verificada separadamente após a primeira fase do plano.

## Fase 2 — Direção estratégica

Execute a Task 15 (skill reutilizável) antes da Task 1; ela aparece ao final do documento para manter as tarefas de produto agrupadas.

### Task 1: Contratos e persistência SWOT

**Files:** Modify `packages/shared/src/index.ts`, `apps/api/prisma/schema.prisma`; create migration; test `apps/api/test/analise-ambiente.service.test.ts`.

**Interfaces:** `analiseAmbienteSchema`; `AnaliseAmbienteInput`; `AnaliseAmbienteService.listar(usuarioId)`, `criar(usuarioId, input)`, `atualizar(usuarioId, id, input)`, `remover(usuarioId, id)`.

- [ ] Escrever testes: CRUD autorizado, ID de outra organização retornando 404 e validação de descrição vazia.
- [ ] Rodar `npm run test -w @eduitsm/api -- analise-ambiente.service.test.ts`; confirmar RED.
- [ ] Adicionar schemas Zod, repositório filtrado por `organizacaoId` e migração sem alterar registros existentes.
- [ ] Implementar serviço e rotas `GET|POST /api/v1/analises-ambiente` e `PUT|DELETE /api/v1/analises-ambiente/:id`.
- [ ] Rodar teste unitário e integração; confirmar GREEN.
- [ ] Commitar `feat: add SWOT analysis module`.

### Task 2: Quatro Ps e versionamento

**Files:** Modify shared contracts; create `apps/api/src/modules/estrategia/`; test `apps/api/test/estrategia.service.test.ts`.

**Interfaces:** `estrategiaSchema`; `EstrategiaService.obterAtual(usuarioId)`; `salvarNovaVersao(usuarioId, input)`; `listarVersoes(usuarioId)`; `estrategiaCompleta(value): boolean`.

- [ ] Testar estratégia incompleta, estratégia completa, versão inicial e preservação da versão anterior (RN02/RN03).
- [ ] Rodar teste e observar RED.
- [ ] Implementar leitura, criação de nova versão com `versao = max + 1` e consulta ordenada decrescente.
- [ ] Expor `GET|POST /api/v1/estrategia` e `GET /api/v1/estrategia/versoes`.
- [ ] Testar concorrência de duas gravações e converter conflito para erro de domínio 422 quando necessário.
- [ ] Commitar `feat: add strategy versioning`.

### Task 3: Objetivos, cobertura e telas T03–T05

**Files:** Modify shared/API routes; create `apps/web/src/pages/analise-page.tsx`, `estrategia-page.tsx`, `objetivos-page.tsx`; extend `layout.tsx`, tests `apps/web/src/test/strategy-pages.test.tsx`.

- [ ] Escrever testes de objetivo, código duplicado, status e cobertura sem dados de vínculo.
- [ ] Implementar `GET|POST /api/v1/objetivos` e `GET /api/v1/objetivos/:id/cobertura`, sempre filtrando organização.
- [ ] Criar as três páginas com formulário, tabela, carregamento, vazio, erro, sucesso e navegação por teclado.
- [ ] Habilitar somente T03–T05 no menu e testar criação/edição/navegação no React Testing Library.
- [ ] Executar gates completos e commit `feat: deliver strategic direction screens`.

## Fase 3 — Portfólio e alinhamento

### Task 4: Serviços, custos e demanda

**Files:** Create `apps/api/src/modules/servicos/`; extend shared schemas and Prisma repositories; tests `servico.service.test.ts`, `servico.api.test.ts`.

- [ ] Testar CRUD, organização cruzada 404, CAPEX/OPEX, valores não negativos e demanda/capacidade inválida.
- [ ] Implementar `GET|POST /api/v1/servicos`, `PUT|DELETE /api/v1/servicos/:id`, `GET|POST /api/v1/servicos/:id/custos` e `GET|POST /api/v1/servicos/:id/demanda`.
- [ ] Garantir que exclusão de serviço respeite relações e que descontinuado continue visível no histórico.
- [ ] Commitar `feat: add service portfolio management`.

### Task 5: Vínculos e indicadores

**Files:** Create `apps/api/src/modules/vinculos/` and `apps/api/src/modules/indicadores/`; tests `vinculo.service.test.ts`, `indicador.service.test.ts`.

- [ ] Testar serviço/objetivo inexistente, justificativa vazia, contribuição 0/100, soma acima de 100 com saldo na mensagem (RN04–RN06).
- [ ] Testar indicador sem meta, serviço descontinuado, sentido maior/menor e `DELETE` autorizado.
- [ ] Implementar `GET|POST /api/v1/vinculos`, `DELETE /api/v1/vinculos/:id`, `GET|POST /api/v1/servicos/:id/indicadores` e `PUT|DELETE /api/v1/indicadores/:id`.
- [ ] Adicionar consultas de pendências de alinhamento e cobertura por objetivo.
- [ ] Commitar `feat: add portfolio alignment and indicators`.

### Task 6: Telas T06–T11

**Files:** Create `apps/web/src/pages/servicos-page.tsx`, `custos-page.tsx`, `demanda-page.tsx`, `vinculos-page.tsx`, `indicadores-page.tsx`; shared table/form components and tests.

- [ ] Escrever testes de criação, edição, exclusão, validação 422, pendência sem vínculo e indicadores abaixo da meta.
- [ ] Implementar telas reconhecíveis pelos protótipos, com filtros por status e tabelas legíveis em 1024 px.
- [ ] Habilitar T06–T11 e cobrir os fluxos com dados reais da API.
- [ ] Executar gates e commit `feat: deliver portfolio screens`.

## Fase 4 — Simulação e avaliação

### Task 7: PRNG e gerador determinístico

**Files:** Create `apps/api/src/modules/simulacao/prng.ts`, `gerador.ts`; tests `simulacao.test.ts`, `simulacao.performance.test.ts`.

**Interfaces:** `gerarRegistros(input): RegistroSimulado[]`; input `{ seed, volume, periodoInicio, periodoFim, servicoIds, perfil }`; output com campos compatíveis com `RegistroOperacional`.

- [ ] Testar mesma semente/parâmetros byte a byte iguais, sementes diferentes divergentes e limites de datas/volume.
- [ ] Implementar PRNG sem `Math.random`, geração em lote e sem chamadas HTTP dentro do motor.
- [ ] Medir 10.000 registros em até 10 segundos e rejeitar volume fora do limite configurado.
- [ ] Commitar `feat: add deterministic simulation engine`.

### Task 8: Cenários, medições e cálculo

**Files:** Create `apps/api/src/modules/simulacao/` repositories/services; tests `indicadores.calculo.test.ts`, `cenario.api.test.ts`.

- [ ] Testar disponibilidade com tolerância de 0,01, média aritmética, maior/menor-melhor acima/igual/abaixo e serviço descontinuado ignorado (TS01–TS04/TS07).
- [ ] Implementar `POST /api/v1/cenarios`, persistência em transação e criação exclusiva de registros pelo gerador.
- [ ] Implementar `GET /api/v1/indicadores/painel`, agregando medições por serviço/indicador sem N+1 desnecessário.
- [ ] Commitar `feat: add simulation and indicator evaluation`.

### Task 9: Telas T12–T13

**Files:** Create `apps/web/src/pages/cenario-page.tsx`, `indicadores-painel-page.tsx`; tests `simulation-pages.test.tsx`.

- [ ] Testar formulário de cenário, progresso/estado de execução, painel vazio, abaixo da meta e dados reais.
- [ ] Implementar resumo textual acessível, filtros por período/serviço e links para revisão de estratégia.
- [ ] Habilitar T12–T13 e executar gates completos; commit `feat: deliver simulation screens`.

## Fase 5 — Relatório e professor

### Task 10: Relatório e regra de completude

**Files:** Create `apps/api/src/modules/relatorios/`; tests `relatorio.service.test.ts`, `relatorio.api.test.ts`; modify shared contracts.

- [ ] Testar qualquer P vazio bloqueando exportação com 422, estratégia completa permitindo relatório e conteúdo isolado por organização (RN02/TS06).
- [ ] Implementar `GET /api/v1/relatorios/estrategia` como resposta estruturada; adicionar exportação em formato definido no contrato sem vazar dados.
- [ ] Usar uma única função `estrategiaCompleta` compartilhada pelo serviço e pelo relatório.
- [ ] Commitar `feat: add strategy report export`.

### Task 11: Acompanhamento professor e T14/T14b/T15

**Files:** Create `apps/api/src/modules/professor/`; web pages `relatorio-page.tsx`, `ambientes-page.tsx`; tests `professor.api.test.ts`, `report-pages.test.tsx`.

- [ ] Testar professor lendo ambiente de aluno, escrita do professor retornando 403 e aluno sem acesso a outro ambiente (RN11/TS11).
- [ ] Implementar `GET /api/v1/professor/ambientes` somente para perfil PROFESSOR, com resumo sem senha/token e paginação simples.
- [ ] Implementar visão somente leitura, relatório consolidado e fluxo completo do estudo de caso.
- [ ] Habilitar menu Professor apenas para esse perfil; commit `feat: add reports and professor read-only view`.

## Fase 6 — Robustez e implantação

### Task 12: Suíte TS01–TS15 e acessibilidade

**Files:** Extend `apps/api/test/`, `apps/web/src/test/`; create `tests/e2e/` only if browser runner is available; update `README.md`.

- [ ] Mapear cada TS01–TS15 para um teste nomeado, incluindo TS12/TS13 com medição monotônica e limites explícitos.
- [ ] Executar axe/manual keyboard checks para formulários, tabelas, foco e mensagens não dependentes apenas de cor.
- [ ] Rodar testes em Chrome, Edge e Firefox disponíveis; documentar exatamente qualquer navegador ausente.
- [ ] Commitar `test: complete phase verification matrix`.

### Task 13: Produção, desempenho e deploy

**Files:** Modify `docker-compose.yml`, add `Dockerfile`/configuração de deploy apenas se compatível com o ambiente, CI workflow e `README.md`.

- [ ] Testar build a partir de checkout limpo, migração, seed idempotente e startup com variáveis ausentes recusado.
- [ ] Verificar consultas críticas em até 2 segundos, índices Prisma e limites de payload; corrigir N+1 observados.
- [ ] Documentar portas, CORS por ambiente, Tailscale/local e encerramento seguro de processos.
- [ ] Commitar `chore: finalize production readiness`.

### Task 14: Verificação e integração final

- [ ] Executar `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e `npm audit --omit=dev --offline`.
- [ ] Conferir diff, documentos preservados, migrações aplicáveis e status limpo.
- [ ] Atualizar `docs/rastreabilidade.md` com evidência final e marcar critérios de aceite.
- [ ] Solicitar revisão de código e usar `superpowers:verification-before-completion` antes de declarar conclusão.
- [ ] Commitar `docs: close remaining phases verification`.

## Skill reutilizável (executar antes da Fase 2)

### Task 15: Criar e verificar `eduitsm-development`

**Files:** Create `~/.agents/skills/eduitsm-development/SKILL.md` and pressure scenarios under a temporary test location; do not add runtime-specific secrets.

- [ ] Escrever cenários RED que tentem ignorar isolamento, TDD, seed seguro e gates finais sem a skill.
- [ ] Observar e registrar a falha dos agentes nos cenários baseline.
- [ ] Escrever a skill mínima com gatilhos, invariantes, comandos e referências explícitas a `superpowers:test-driven-development` e `superpowers:verification-before-completion`.
- [ ] Reexecutar os mesmos cenários e confirmar GREEN; fechar racionalizações descobertas.
- [ ] Verificar `wc -w` e frontmatter, instalar/ativar a skill conforme o runtime e documentar a localização sem versionar credenciais.

## Checkpoint de execução

Após cada fase, parar com o commit, resultados dos gates e decisão de escopo. A próxima fase só começa quando o checkpoint da anterior estiver verde. Se uma tarefa exigir nova decisão funcional, pausar e apresentar uma única pergunta objetiva.
