# Task 1 — contratos e persistência SWOT

## Escopo entregue

- Contrato compartilhado `analiseAmbienteSchema` e tipo `AnaliseAmbienteInput`.
- `AnaliseAmbienteService` com `listar`, `criar`, `atualizar` e `remover`.
- Repositório Prisma com todas as operações filtradas por `organizacaoId` resolvido a partir do `usuarioId` autenticado.
- Rotas autenticadas `GET|POST /api/v1/analises-ambiente` e `PUT|DELETE /api/v1/analises-ambiente/:id`.
- Migração que substitui somente o índice simples pelo índice `(organizacao_id, categoria)`, sem atualizar ou remover registros.

## Evidência TDD

1. `npm run test -w @eduitsm/api -- analise-ambiente.service.test.ts`
   - RED, exit 1: módulo `analise-ambiente.service.js` inexistente.
2. Mesmo comando após contrato e serviço mínimos.
   - GREEN, exit 0: 1 arquivo, 4 testes aprovados.
3. `npm run test -w @eduitsm/api -- analise-ambiente.integration.test.ts`
   - RED, exit 1: `PrismaAnaliseAmbienteRepository` ainda inexistente.
4. Mesmo comando após repositório, rotas e composição.
   - GREEN, exit 0: migração aplicada; 1 arquivo, 2 testes aprovados.
5. `npm run test -w @eduitsm/api -- analise-ambiente.service.test.ts analise-ambiente.integration.test.ts`
   - exit 0: 2 arquivos, 6 testes aprovados.

Os testes cobrem CRUD autorizado, `404` em atualização e remoção por outra organização, persistência real, exclusão real e `422` para descrição vazia.

## Gates completos

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0, 25/25 testes (20 API e 5 web).
- `npm run build`: exit 0.
- `git diff --check`: exit 0.

## Decisões e concerns

O modelo e a tabela `AnaliseAmbiente` já existiam na fundação da Fase 1. Para cumprir a migração incremental sem reescrever dados, a Task 1 alterou apenas o índice usado pela listagem agrupada por organização e categoria. Nenhuma funcionalidade de Tasks 2 ou 3 foi habilitada.
