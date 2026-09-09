# Task 10 — Relatório e regra de completude

## Escopo entregue

- `GET /api/v1/relatorios/estrategia` retorna organização, 4 Ps, objetivos, portfólio, vínculos e indicadores da organização obtida exclusivamente pelo `sub` autenticado.
- `GET /api/v1/relatorios/estrategia/exportacao` gera anexo HTML (`relatorio-estrategia.html`) com conteúdo escapado.
- A exportação retorna `422 ESTRATEGIA_INCOMPLETA` sem os quatro Ps; `estrategiaCompleta` agora pertence ao contrato compartilhado e é reutilizada pela estratégia e pelo relatório.

## Evidência TDD

1. O RED inicial falhou porque o módulo de relatório não existia e as rotas retornavam 404.
2. O GREEN cobriu os quatro Ps vazios, o relatório estruturado, o anexo HTML e o isolamento de conteúdo entre organizações.
3. A tipagem identificou todas as fábricas de aplicação que precisavam declarar o novo serviço; elas receberam stubs explícitos sem alterar comportamento das fases anteriores.

## Gates completos

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0; 88 testes API e 30 testes web.
- `npm run build`: exit 0.
- `git diff --check`: exit 0.
