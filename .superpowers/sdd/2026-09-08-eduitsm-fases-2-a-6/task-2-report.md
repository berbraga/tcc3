# Task 2 — Quatro Ps e versionamento

## Escopo entregue

- Contrato compartilhado `estrategiaSchema` e tipo `EstrategiaInput`, sem aceitar identificador de organização enviado pelo cliente.
- Predicado único `estrategiaCompleta`, que implementa RN02 e considera qualquer P nulo, vazio ou composto só por espaços como incompleto.
- `EstrategiaService` com leitura atual, criação de nova versão e histórico em ordem decrescente.
- Repositório Prisma filtrado pela organização derivada do `usuarioId`, com cálculo transacional de `max(versao) + 1` e preservação das versões anteriores (RN03).
- Rotas autenticadas `GET|POST /api/v1/estrategia` e `GET /api/v1/estrategia/versoes`.
- Colisão da restrição única `(organizacao_id, versao)` convertida para `422 CONFLITO_VERSAO_ESTRATEGIA`.

## Evidência TDD

1. `npm run test -w @eduitsm/api -- estrategia.service.test.ts`
   - RED, exit 1: módulo `estrategia.service.js` inexistente.
2. Mesmo comando após implementação mínima, antes de recompilar `@eduitsm/shared`.
   - 6/8 testes aprovados; 2 falharam porque o `dist` compartilhado ainda não exportava `estrategiaSchema`.
3. `npm run build -w @eduitsm/shared` seguido do teste focado.
   - GREEN, exit 0: 1 arquivo, 8 testes aprovados.
4. Teste focado após acrescentar a prova de persistência real.
   - GREEN, exit 0: 1 arquivo, 9 testes aprovados.

Os testes cobrem cada P ausente, estratégia completa, versão inicial, preservação da versão anterior, ordenação decrescente, isolamento entre organizações, rotas HTTP, rejeição de `organizacaoId` do cliente, colisão concorrente convertida em 422 e persistência PostgreSQL real.

## Gates completos

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0, 38/38 testes (33 API e 5 web).
- `npm run build`: exit 0.
- `git diff --check`: exit 0.
- `git status --short`: exit 0; antes do commit listou somente os arquivos da Task 2 e os ajustes de composição exigidos nos testes existentes.

## Decisões e concerns

O modelo `EstrategiaServico` e a restrição única por organização/versão já existiam na migração inicial da Fase 1; nenhuma migração adicional foi necessária. Rascunhos incompletos podem ser salvos e versionados, pois RN02 exige bloquear a exportação futura, não o registro da estratégia. Em gravações simultâneas, uma colisão pode retornar 422; o cliente deve recarregar a versão atual antes de reenviar. Nenhuma funcionalidade da Task 3 foi habilitada.
