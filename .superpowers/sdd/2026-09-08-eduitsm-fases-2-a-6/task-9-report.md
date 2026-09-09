# Task 9 — telas T12–T13

## Escopo entregue

- T12 executa `POST /api/v1/cenarios` com estado de execução, erro e sucesso acessível.
- T13 consome `GET /api/v1/indicadores/painel`, apresenta vazio, resultado abaixo da meta, filtro por serviço e links de revisão.
- As rotas e o menu habilitam somente T12 e T13 nesta fase.

## Evidência TDD

1. O primeiro RED da Task 9 falhou ao importar as páginas ainda inexistentes.
2. Após a implementação mínima, `simulation-pages.test.tsx` ficou GREEN para envio, execução, vazio, abaixo da meta e filtro de serviço.
3. O fix round 1 adicionou RED para `GET /indicadores/painel?periodo=2026-01`: a rota ignorava o parâmetro e misturava medições de janeiro e fevereiro.
4. O GREEN valida `periodo` no contrato compartilhado, filtra `Medicao.periodoRef` no repositório, retorna o mês em cada linha e refaz a query React por `queryKey` e parâmetros Axios.

## Ruling

`periodo` é opcional para preservar o painel agregado já entregue. Quando informado, usa o formato estrito `AAAA-MM`, limita a consulta ao intervalo UTC do mês e a resposta retorna o mesmo período. O filtro por serviço permanece local porque todos os itens do período autorizado já foram carregados por uma única consulta.

## Gates completos

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0; 81 testes API e 30 testes web.
- `npm run build`: exit 0.
- `git diff --check`: exit 0.
