# Task 5 — vínculos e indicadores

## Escopo entregue

- Contratos compartilhados estritos para vínculo estratégico e indicador, sem aceitar `organizacaoId` vindo do cliente.
- `VinculoService` e repositório Prisma com serviço/objetivo filtrados pela organização do `sub`, contribuição positiva até 100, saldo explícito no erro e remoção autorizada.
- `IndicadorService` e repositório Prisma com meta obrigatória, objetivo opcional restrito à própria organização, suporte aos sentidos maior/melhor e menor/melhor, histórico legível e bloqueio de criação em serviço descontinuado.
- Rotas autenticadas `GET|POST /api/v1/vinculos`, `GET /api/v1/vinculos/pendencias`, `DELETE /api/v1/vinculos/:id`, `GET|POST /api/v1/servicos/:id/indicadores` e `PUT|DELETE /api/v1/indicadores/:id`.
- Pendências retornam somente serviços `EM_OPERACAO` sem vínculo; a cobertura por objetivo reaproveita a consulta autorizada existente e soma `Decimal` antes da resposta pública.

## Evidência TDD

1. No início, os testes de serviço e as classes de domínio da Task 5 já estavam presentes como arquivos não rastreados. A tentativa focada de composição evidenciou os adaptadores Prisma ausentes, pois `alinhamento.api.test.ts` importava `PrismaVinculoRepository` e `PrismaIndicadorRepository` ainda inexistentes.
2. Após implementar os adaptadores, rotas e composição mínima, `npm test -w @eduitsm/api -- test/vinculo.service.test.ts test/indicador.service.test.ts test/alinhamento.api.test.ts` passou: 3 arquivos, 10 testes.
3. A primeira rodada de lint/typecheck revelou os fixtures de dependência antigos sem os novos serviços e o parâmetro mesclado da rota sem tipo. Os fixtures receberam apenas doubles sem efeitos e a rota passou a validar o parâmetro tipado.
4. Lint, typecheck e o mesmo teste focado passaram novamente após a correção.

Os testes cobrem serviço/objetivo inexistente ou de outra organização, justificativa vazia, contribuição 0 e 100, excesso acima de 100 com saldo, pendências, cobertura, meta ausente, serviço descontinuado, os dois sentidos, leitura do histórico e `PUT`/`DELETE` autorizado.

## Gates completos

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0, 73/73 testes (57 API e 16 web).
- `npm run build`: exit 0.
- `git diff --check`: exit 0.
- `git status --short`: somente arquivos da Task 5 e seus ajustes de fixtures de composição antes do commit.

## Concerns

Nenhuma migração foi necessária: os modelos `VinculoEstrategico` e `Indicador`, suas relações e `Decimal` já existiam na fundação Prisma. A atualização de um indicador de serviço descontinuado permanece permitida para corrigir sua configuração histórica; a criação de novos indicadores é bloqueada. Medições e o cálculo de desempenho continuam fora deste escopo e serão tratados pela fase de simulação.
