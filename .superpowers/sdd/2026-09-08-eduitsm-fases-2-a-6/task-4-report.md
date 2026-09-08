# Task 4 — serviços, custos e demanda

## Escopo entregue

- Contratos compartilhados `servicoSchema`, `custoServicoSchema` e `demandaCapacidadeSchema`, todos estritos e sem aceitar `organizacaoId` do cliente.
- `ServicoService` e `PrismaServicoRepository` com CRUD de portfólio, CAPEX/OPEX e demanda/capacidade.
- Rotas autenticadas `GET|POST /api/v1/servicos`, `PUT|DELETE /api/v1/servicos/:id`, `GET|POST /api/v1/servicos/:id/custos` e `GET|POST /api/v1/servicos/:id/demanda`.
- Ownership derivado do `sub` do JWT: serviços filtram por `organizacaoId`; custos e demandas comprovam a organização pelo relacionamento com o serviço antes de ler ou gravar.
- Exclusão física permitida somente para serviço sem relações. Serviço com histórico retorna 422 `SERVICO_POSSUI_RELACOES`; a atualização para `DESCONTINUADO` preserva e mantém o item visível na listagem.

## Validações e persistência

- Serviço: nome obrigatório, campos textuais limitados e status restrito ao enum do domínio.
- Custos: enum CAPEX/OPEX, período mensal `AAAA-MM`, valores finitos, não negativos, com no máximo duas casas e dentro de `Decimal(12,2)`.
- Demanda/capacidade: período mensal válido, inteiros não negativos dentro do limite PostgreSQL e unidade obrigatória. Demanda maior que capacidade é aceita porque representa déficit operacional válido.
- Os modelos Prisma já existiam na migração inicial. Nenhuma migração foi criada; os `Decimal` persistidos são convertidos para número somente na resposta pública. Os `onDelete: Cascade` existentes foram preservados para remoção do agregado organização, enquanto a rota de serviço aplica a proteção explícita do histórico.

## Evidência TDD

1. `npm run test -w @eduitsm/api -- servico.service.test.ts servico.api.test.ts`
   - RED, exit 1: `servico.service.js` e `servico.repository.js` inexistentes.
2. Mesmo comando após a implementação mínima.
   - GREEN, exit 0: 2 arquivos e 7 testes aprovados.
3. Primeira suíte completa.
   - RED em 1 teste: a expectativa impunha CAPEX antes de OPEX no mesmo período, mas o contrato não define essa ordem e o desempate por UUID é variável.
4. `npm run test -w @eduitsm/api -- servico.api.test.ts` após limitar a expectativa ao contrato público.
   - GREEN, exit 0: 3/3 testes aprovados.

Os testes cobrem CRUD, 404 entre organizações, tentativa de `organizacaoId` no payload, enums, CAPEX/OPEX, valores negativos, períodos inválidos, demanda/capacidade negativa ou fracionária, ownership indireto, exclusão com relações e permanência de descontinuados no histórico.

## Gates completos

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0, 63/63 testes (47 API e 16 web).
- `npm run build`: exit 0.
- `git diff --check`: exit 0.
- `git status --short`: somente arquivos da Task 4 antes do commit.

## Concerns

Não há blocker conhecido. Atualização e exclusão de custos/demanda não fazem parte do contrato desta task. A ordem pública entre custos do mesmo período também não foi especificada; consumidores não devem depender dela.
