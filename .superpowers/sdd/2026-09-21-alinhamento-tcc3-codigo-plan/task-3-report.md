# Task 3 — auditoria das Fases 2 e 3

## Entrega

- O contrato de SWOT valida a combinação tipo/categoria e a tela só oferece categorias compatíveis.
- O fluxo dos quatro Ps normaliza espaços em branco e usa `estrategiaCompleta` como fonte única de completude. Não há versão para um salvamento sem mudança; mudanças concorrentes recebem números consecutivos por bloqueio transacional da organização.
- Objetivos agora podem ser atualizados e removidos no próprio ambiente. Códigos duplicados recebem `422`; objetivos com vínculo ou indicador recebem `422 OBJETIVO_POSSUI_RELACOES`, sem exclusão em cascata.
- RN10 lista qualquer serviço sem vínculo. Os custos exibem CAPEX e OPEX separadamente; `null` e zero realizado permanecem distintos. Demanda com capacidade zero informa utilização não calculável.
- As integrações existentes, agora reexecutadas, cobrem limite concorrente de vínculos, resposta `422` com saldo, isolamento de serviço/objetivo/indicador e meta/sentido obrigatórios.

## TDD e evidências

- RED/GREEN: combinações SWOT incompatíveis, estratégia normalizada sem alteração, histórico concorrente, pendências RN10, separação CAPEX/OPEX, capacidade zero e CRUD de objetivos.
- `npm run test -w @eduitsm/web -- portfolio-pages.test.tsx`: 12 testes aprovados.
- `npm run test -w @eduitsm/api -- servico.api.test.ts`: 114 testes API aprovados; inclui PostgreSQL no schema `test` e o caso de `valorRealizado: 0`.
- Gates completos: `npm run lint`, `npm run typecheck`, `npm test` (114 API + 56 web), `npm run build` e `git diff --check` aprovados.

## Decisão e pendências

- A remoção de objetivo com relações é bloqueada. O usuário deve remover vínculos/indicadores antes, evitando alterar o histórico por cascata sem uma regra explícita no TCC3.
- O ensaio manual em navegadores e as medições de carga/desempenho não foram executados nesta task e continuam pendentes de evidência específica.
