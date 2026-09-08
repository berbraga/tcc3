# Task 3 — objetivos, cobertura e telas T03–T05

## Escopo entregue

- Contrato compartilhado `objetivoSchema` e `ObjetivoInput`, com código/descrição/prazo/status e rejeição de campos extras como `organizacaoId`.
- `ObjetivoService` e `PrismaObjetivoRepository` com criação, listagem e cobertura sempre filtradas pela organização derivada do usuário autenticado.
- Rotas autenticadas `GET|POST /api/v1/objetivos`, `GET /api/v1/objetivos/cobertura` e `GET /api/v1/objetivos/:id/cobertura`, incluindo 422 para código duplicado e 404 para objetivo ausente ou de outra organização.
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
5. Rodada de revisão: testes adicionados antes das correções.
   - RED na API: a soma de `0.10` e `0.20` retornava `0.30000000000000004`.
   - RED no web: T03–T05 não exibiam a organização ativa, T04 não mostrava o histórico e T05 limpava o formulário após erro.
6. Mesmos testes após as correções.
   - GREEN, exit 0: 6/6 testes focados da API e 11/11 testes focados do web.
7. Fix round 2: teste integrado com dois vínculos no mesmo objetivo, objetivo sem vínculo e vínculo de outra organização.
   - RED: `GET /objetivos/cobertura` retornava 404 e T04 mostrava o total cadastrado.
   - GREEN: 7/7 testes focados da API e 11/11 testes focados do web; o resumo retorna um objetivo alinhado distinto.

Os testes cobrem status/prazo inválidos, campo organizacional do cliente, código duplicado, isolamento entre organizações, cobertura zero e fracionária, persistência PostgreSQL real, cabeçalho com organização ativa, estados das três telas, edição SWOT, histórico e nova versão dos 4 Ps, quantidade de objetivos alinhados, criação de objetivo, preservação dos campos em falha e navegação por teclado.

## Gates completos

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0, 56/56 testes.
- `npm run build`: exit 0.
- `git diff --check`: exit 0.
- `git status --short`: somente arquivos da Task 3 antes do commit.

## Decisões e concerns

O modelo `ObjetivoEstrategico` e sua unicidade por organização/código já existiam na migração inicial, então nenhuma migração foi necessária. A cobertura usa `Prisma.Decimal` durante toda a soma e só converte o total na borda da resposta. T03–T05 compartilham o cache da consulta de organização; T04 consome também `/estrategia/versoes`.

**Ruling do fix round 2:** “objetivos alinhados” significa objetivos distintos da organização autenticada que possuem ao menos um `VinculoEstrategico`. O repositório aplica `count` com `organizacaoId` e `vinculos.some`, e T04 usa esse resumo real em vez do total de objetivos cadastrados. A tela T05 continua consultando a cobertura por objetivo; uma agregação em lote poderá ser adicionada se medições futuras apontarem custo relevante. Nenhuma funcionalidade da Fase 3 foi habilitada.
