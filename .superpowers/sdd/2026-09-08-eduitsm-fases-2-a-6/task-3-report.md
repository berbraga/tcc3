# Task 3 — objetivos, cobertura e telas T03–T05

## Escopo entregue

- Contrato compartilhado `objetivoSchema` e `ObjetivoInput`, com código/descrição/prazo/status e rejeição de campos extras como `organizacaoId`.
- `ObjetivoService` e `PrismaObjetivoRepository` com criação, listagem e cobertura sempre filtradas pela organização derivada do usuário autenticado.
- Rotas autenticadas `GET|POST /api/v1/objetivos` e `GET /api/v1/objetivos/:id/cobertura`, incluindo 422 para código duplicado e 404 para objetivo ausente ou de outra organização.
- Telas T03–T05 conectadas às APIs das Tasks 1–3, com carregamento, erro recuperável, vazio, sucesso, formulários rotulados, tabela semântica, foco visível e navegação por teclado.
- Menu habilitado somente para T02–T05; T06 em diante permanece explicitamente desabilitado.

## Evidência TDD

1. `npm run test -w @eduitsm/api -- objetivo.service.test.ts`
   - RED, exit 1: módulos `objetivo.repository.js` e `objetivo.service.js` inexistentes.
2. Mesmo comando após implementação mínima.
   - GREEN, exit 0: 1 arquivo, 5 testes aprovados.
3. `npm run test -w @eduitsm/web -- strategy-pages.test.tsx`
   - RED, exit 1: páginas `analise-page.js`, `estrategia-page.js` e `objetivos-page.js` inexistentes.
4. Mesmo comando após implementar as páginas e corrigir o fixture HTTP para UUID realista.
   - GREEN, exit 0: 1 arquivo, 10 testes aprovados.
5. Primeira suíte completa.
   - Detectou regressão em T02 causada por uma consulta adicional do layout; a consulta foi removida e o layout original preservado.
6. Segunda suíte completa.
   - GREEN, exit 0: 10 arquivos e 53 testes aprovados (38 API e 15 web).

Os testes cobrem status/prazo inválidos, campo organizacional do cliente, código duplicado, isolamento entre organizações, cobertura zero sem vínculos, persistência PostgreSQL real, estados das três telas, edição SWOT, nova versão dos 4 Ps, criação de objetivo e navegação por teclado.

## Gates completos

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0, 53/53 testes.
- `npm run build`: exit 0.
- `git diff --check`: exit 0.
- `git status --short`: somente arquivos da Task 3 antes do commit.

## Decisões e concerns

O modelo `ObjetivoEstrategico` e sua unicidade por organização/código já existiam na migração inicial, então nenhuma migração foi necessária. Cobertura sem vínculos retorna `{ servicosVinculados: 0, cobertura: 0 }`; vínculos futuros serão somados pelo mesmo repositório sem alterar o contrato. A tela T05 consulta a cobertura por objetivo, conforme a rota prevista; uma agregação em lote poderá ser adicionada se medições futuras apontarem custo relevante. Nenhuma funcionalidade da Fase 3 foi habilitada.
