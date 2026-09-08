# Task 6 — telas T06–T11

## Escopo entregue

- T06/T07: portfólio com filtro de status, criação, edição, exclusão e orientação do erro 422 para histórico relacionado.
- T08/T09: lançamentos reais de custo e demanda por serviço, totais e sinalização de capacidade excedida.
- T10: pendências sem vínculo, criação/remoção de vínculos e mensagem da API quando a contribuição excede o saldo disponível.
- T11: cadastro, edição e exclusão de indicadores por serviço, meta, sentido e objetivo opcional.
- O menu habilita T06, T10 e T11; os links de cada serviço habilitam T08 e T09. T01–T05 permanecem preservadas.

## Evidência TDD

1. `npm test -w @eduitsm/web -- portfolio-pages.test.tsx` ficou RED porque as cinco páginas T06–T11 ainda não existiam.
2. Após a implementação mínima, a mesma suíte expôs três falhas de integração de UI (rolagem não suportada no jsdom, confirmação textual e objetivo opcional); foram corrigidas sem alterar a API.
3. A suíte focada ficou GREEN com 6/6 testes. Um novo RED comprovou que os links T08/T09 ainda faltavam; após adicioná-los, as suítes focadas T03–T11 ficaram GREEN com 17/17 testes.

## Gates completos

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0, 80/80 testes (58 API e 22 web).
- `npm run build`: exit 0.
- `git diff --check`: exit 0.

## Concern

A API atual fornece apenas metadados de indicadores, sem medição ou resultado de avaliação. Por isso T11 registra meta e sentido e deixa explícito que “abaixo/acima da meta” será exibido na fase de simulação, sem fabricar um status local divergente.

## Fix round 1

- DELETE de vínculos e indicadores agora desabilita a ação enquanto pendente, remove a linha somente após sucesso e informa sucesso ou a mensagem da API com fallback em caso de falha.
- Os testes de UI agora cobrem criação/exclusão de vínculo, PUT/DELETE de indicador e os dois resultados de DELETE em ambas as telas.
- Gates frescos: `npm run lint`, `npm run typecheck`, `npm test` com PostgreSQL (84/84: 58 API e 26 web), `npm run build` e `git diff --check`.
