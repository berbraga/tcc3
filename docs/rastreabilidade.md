# Rastreabilidade

| Item | Implementação | Evidência automatizada |
|---|---|---|
| RF08 — autenticar e distinguir perfis | `modules/auth`, middleware JWT e T01 | `auth.service.test.ts`, `api.test.ts`, `integration.test.ts`, `pages.test.tsx` |
| RF09 — organização isolada por usuário | `modules/organizacoes`, repositório Prisma e T02 | `api.test.ts`, `integration.test.ts`, `pages.test.tsx` |
| RN01 — exatamente uma organização ativa | cadastro transacional, seed reparador e `usuarioId @unique` | teste positivo/negativo de registro e integração real |
| TS09 — acesso cruzado | organização derivada do `sub` do JWT e serviço de propriedade reutilizável | teste de integração real com resposta 403 em `integration.test.ts` |
| TS10 — token ausente, inválido ou expirado | middleware de autenticação e `jsonwebtoken.verify` | casos parametrizados e teste real de expiração |
| T01 — login | `pages/login-page.tsx` | submissão, persistência de sessão e erro visível |
| T02 — painel inicial | `pages/painel-page.tsx` e `components/layout.tsx` | carregamento, erro, vazio, edição e confirmação de sucesso |
| RF10 / T03 — análise SWOT | `analiseAmbienteSchema`, `modules/analises-ambiente` e `pages/analise-page.tsx` | `analise-ambiente.service.test.ts`, `analise-ambiente.integration.test.ts`, `strategy-pages.test.tsx`: categoria coerente com tipo, CRUD e isolamento |
| RF05 / T04 — estratégia e histórico | `normalizarEstrategia`, `estrategiaCompleta`, `modules/estrategia` e `pages/estrategia-page.tsx` | `estrategia.service.test.ts`, `strategy-pages.test.tsx`: espaços, versão sem alteração, histórico e concorrência PostgreSQL |
| RN02 / RN03 — quatro Ps e versão imutável | regra compartilhada `estrategiaCompleta` e lock da organização em `PrismaEstrategiaRepository` | `estrategia.service.test.ts`: completude, sem versão artificial e versões concorrentes consecutivas |
| RF04 / T05 — objetivos estratégicos | `modules/objetivos` e `pages/objetivos-page.tsx` | `objetivo.service.test.ts`, `strategy-pages.test.tsx`: CRUD isolado, código único e bloqueio de remoção com vínculos/indicadores |
| RF01 / T06 — portfólio e RN10 | `modules/servicos`, `PrismaVinculoRepository.listarPendencias` e `pages/servicos-page.tsx` | `servico.api.test.ts`, `vinculo.service.test.ts`, `alinhamento.api.test.ts`: status e pendência para todo serviço sem vínculo |
| RF02 / T08 — custos | `CustoServico` Decimal no Prisma, `modules/servicos` e `pages/custos-page.tsx` | `servico.api.test.ts`, `portfolio-pages.test.tsx`: CAPEX/OPEX separados e realizado ausente distinto de zero |
| RF03 / T09 — demanda e capacidade | `DemandaCapacidade`, `modules/servicos` e `pages/demanda-page.tsx` | `servico.api.test.ts`, `portfolio-pages.test.tsx`: período/unidade, insuficiência e capacidade zero não calculável |
| RN05 / RN06 / T10 — vínculo estratégico | `PrismaVinculoRepository.criarComLimite` e `modules/vinculos` | `vinculo.service.test.ts`, `alinhamento.api.test.ts`: 100%, excesso, saldo 422 e concorrência HTTP PostgreSQL |
| RF06 / RN04 / RN08 / T11 — indicadores | `modules/indicadores` e `pages/indicadores-page.tsx` | `indicador.service.test.ts`, `alinhamento.api.test.ts`, `portfolio-pages.test.tsx`: autorização, meta/sentido e histórico descontinuado |
| RF12 / T15 — acompanhamento de alunos | `modules/professor`, `GET /professor/ambientes/:organizacaoId/relatorio`, `pages/ambientes-page.tsx` e modo leitura da página de relatório | `professor.api.test.ts`, `professor.repository.integration.test.ts`, `report-pages.test.tsx`: lista, alvo aluno autorizado, aluno bloqueado e UI sem troca de token |
| RF13 / T14 / T14b — relatório e exportação | `modules/relatorios`, HTML imprimível e `pages/relatorio-page.tsx` | `relatorio.service.test.ts`, `relatorio.api.test.ts`, `report-pages.test.tsx`: 4 Ps/422, escape HTML, indicadores com período/origem e download |
| RN11 / TS11 — professor somente leitura no alvo | rotas de supervisão somente leitura e bloqueio explícito de escrita em `/professor/ambientes/:organizacaoId`; mutações normais continuam no próprio ambiente derivado do JWT | `professor.api.test.ts`: alvo 403, aluno 403 e edição do ambiente próprio 201 |
| Seed de demonstração seguro | `config/seed-demo.ts` bloqueia alvos sem autorização explícita e qualquer produção antes dos `upsert`s | `seed-demo.test.ts` aceita somente desenvolvimento/teste com flag e recusa flag ausente ou produção |

As regras de simulação, relatório, supervisão, desempenho e navegadores permanecem associadas às tasks seguintes ou às evidências já nomeadas abaixo; nenhum modelo, menu ou mock é contabilizado como funcionalidade validada.

## Matriz TS01–TS15

| Caso | Evidência nomeada | Situação neste checkout |
|---|---|---|
| RF07 / RF11 / T12 / T13 | `modules/simulacao`, migração `20260921160000_cenario_medicao_identidade`, `pages/cenario-page.tsx` e `pages/indicadores-painel-page.tsx` | `cenario.api.test.ts`, `simulacao.test.ts`, `indicadores.calculo.test.ts`, `simulation-pages.test.tsx`: pré-requisitos, UTC, idempotência, concorrência, cenário/origem/denominador, sem medição e descontinuados |
| RN07 / RN08 / RN09 | gerador puro v1, cálculo separado, `Medicao.cenarioId` e índice parcial de legado | testes de determinismo, integração HTTP real e `medicao.integridade.test.ts`; cumprimento de SLA validado, uptime e receita explicitamente pendentes |
| TS01 | `indicadores.calculo.test.ts` — cumprimento de SLA com tolerância de 0,01 ponto percentual | Automatizado; não representa disponibilidade temporal/uptime |
| TS02 | `indicadores.calculo.test.ts` — `TS02 — calcula tempo médio pela média aritmética dos registros do período` | Automatizado |
| TS03 | `indicadores.calculo.test.ts` — parâmetros `TS03 — avalia ...` | Automatizado |
| TS04 | `simulacao.test.ts` — `TS04 — produz bytes idênticos...` | Automatizado |
| TS05 | `vinculo.service.test.ts` — `TS05 — recusa contribuição acima de 100% e aceita exatamente 100%` | Automatizado |
| TS06 | `relatorio.service.test.ts` — `TS06 — bloqueia exportação com 422...` | Automatizado |
| TS07 | `cenario.api.test.ts` — `TS07 — ignora o serviço descontinuado...` | Automatizado |
| TS08 | `alinhamento.api.test.ts` — `TS08 — responde 422 e informa a contribuição disponível...` | Integração HTTP |
| TS09 | `integration.test.ts` — `TS09 — bloqueia acesso entre organizações...` | Integração com PostgreSQL |
| TS10 | `integration.test.ts` — `TS10 — token ausente, inválido ou expirado responde 401` | Integração HTTP |
| TS11 | `professor.api.test.ts` — escrita no ambiente-alvo do aluno retorna 403; escrita no próprio ambiente retorna 201 | Integração HTTP com limites de autorização explícitos |
| TS12 | `simulacao.performance.test.ts` — `TS12 — gera 10.000 registros em até dez segundos` | Medição monotônica de geração pura, limite 10.000 ms; persistência/cálculo/carga pendentes de medição da Task 7 |
| TS13 | `servico.api.test.ts` — `TS13 — cadastro e consulta HTTP permanecem em até dois segundos` | Medição monotônica, limite 2.000 ms por operação |
| TS14 | `tests/e2e/ts14.spec.ts` — login, painel e navegação do fluxo estratégico | Validado em 21/09/2026: Firefox 141.0 e Google Chrome 153.0.8010.52, API/web/PostgreSQL reais |
| TS15 | `tests/e2e/ts15.spec.ts` — aluno percorre organização, SWOT, 4 Ps, objetivo, serviço, custo, demanda, vínculo, indicador, cenário, painel, revisão e relatório; professor lê aluno, recebe 403 ao escrever no alvo e edita o próprio ambiente | Validado em 21/09/2026: Firefox 141.0 e Google Chrome 153.0.8010.52, API/web/PostgreSQL reais sem mock |

## Acessibilidade e compatibilidade

- `apps/web/src/test/accessibility.test.tsx` executa axe em `LoginPage` e em `RelatorioPage` renderizados, incluindo formulário, tabela e alerta; também verifica rótulos de formulário, foco sequencial por teclado, cabeçalhos e mensagens com `role="alert"`. `color-contrast` não é avaliado em JSDOM.
- `tests/e2e/ts14.spec.ts` e `tests/e2e/ts15.spec.ts` executam API, web e PostgreSQL reais no schema isolado `verify`; `tests/e2e/start-api.mjs` valida `E2E_DATABASE_URL` antes de Prisma/migração/seed. Em 21/09/2026, ambas passaram em Firefox 141.0 e Google Chrome 153.0.8010.52. Microsoft Edge não está instalado; validação nele e a checagem manual de teclado/foco continuam pendentes.

## Verificação final desta entrega

Em 08/09/2026, no worktree `feat/fases-restantes`, foram executados com saída fresca:

- `npm run lint` e `npm run typecheck`, ambos concluídos sem erros.
- `npm test`, com 102 testes da API em 23 arquivos e 42 testes da web em 6 arquivos, todos aprovados. Durante a suíte da API, o Prisma encontrou as duas migrações versionadas e não encontrou migração pendente no schema de teste.
- `npm run build`, concluído para `@eduitsm/shared`, `@eduitsm/api` e `@eduitsm/web`.
- `npm audit --omit=dev --offline`, que reportou 0 vulnerabilidades.

Também foram verificados `git diff --check` e o diff desde a Fase 1: não há alteração ou remoção dos documentos de referência, protótipos em `telas/` ou diagramas em `diagramas/`. TS14 e TS15 continuam pendentes conforme a matriz acima, pois este ambiente não possui runner E2E de navegador com backend completo.

Após a revisão final, o comando `NODE_ENV=production EDUITSM_DEMO_SEED=true npm run db:seed` também foi executado e recusado com saída 1 antes dos `upsert`s. O seed demo só aceita `NODE_ENV=development` ou `NODE_ENV=test` junto de `EDUITSM_DEMO_SEED=true`.
