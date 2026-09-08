# Task 11 — Acompanhamento do professor e T14/T14b/T15

## Escopo entregue

- `GET /api/v1/professor/ambientes` é restrito ao perfil `PROFESSOR`, retorna somente resumos de organizações de alunos e aceita `pagina` e `limite` validados pelo contrato compartilhado.
- O middleware recusa métodos mutáveis autenticados por professor com `403 ACESSO_NEGADO`, preservando a fronteira RN11/TS11 no servidor.
- T14 consome o relatório consolidado real e reutiliza `estrategiaCompleta` de `@eduitsm/shared`; T14b bloqueia exportação enquanto os quatro Ps não estão completos.
- A exportação T14 baixa o Blob como `relatorio-estrategia.html` usando `URL.createObjectURL`, âncora temporária e `URL.revokeObjectURL`; informa pendência, sucesso e falha, inclusive `422`.
- T15 consulta a página atual com `pagina`/`limite` tanto na `queryKey` quanto nos parâmetros Axios e oferece controles anterior/próxima. O menu TURMA aparece somente para professor.

## Evidência TDD

1. O RED inicial da API recebeu 404 para a rota ausente e 500 para escrita de professor; o GREEN criou a rota, a autorização por perfil e o bloqueio de escrita.
2. O RED inicial da web não resolvia as páginas T14/T15; o GREEN passou a apresentar relatório real, bloqueio T14b, resumo somente leitura e menu por perfil.
3. No fix round 1, `report-pages.test.tsx` falhou porque não havia `createObjectURL`, download, revogação, estado 422 nem botões de paginação; o GREEN cobre download, erro 422, query por página e retorno à página anterior.
4. `professor.repository.integration.test.ts` usa PostgreSQL de teste com um professor e três alunos: confirma ordenação, exclusão do professor, resumo sem senha/token e uma página real. O teste de interface cobre a troca explícita entre as páginas 1 e 2.

## Autorização e paginação

- A identidade e o perfil vêm exclusivamente do JWT validado. O aluno recebe 403 ao consultar o endpoint do professor; identificadores enviados pelo cliente não conferem acesso.
- O repositório filtra `usuario.perfil = ALUNO`, seleciona apenas nome/organização/progresso, ordena por nome e executa `skip/take` com contagem na mesma transação Prisma.
- `paginacaoSchema` restringe `pagina >= 1` e `1 <= limite <= 100`; T15 fixa limite 20 e não reutiliza resultado de outra página no cache React Query.

## Limitações deliberadas

- O contrato da Task 11 prevê somente o resumo paginado. Não há endpoint de detalhes de uma organização-alvo, portanto T15 não exibe uma ação de abrir que poderia sugerir acesso além do contrato read-only.
- O download é validado em JSDOM por request, Blob URL, âncora e revogação; a gravação física do arquivo depende do navegador do usuário, como é próprio da Web API.
- O schema PostgreSQL de teste é compartilhado entre arquivos Vitest concorrentes. Por isso a integração não fixa offsets de várias páginas (outros testes podem inserir/remover alunos entre duas leituras); ela valida alunos exclusivos e uma página real. Para tornar offsets multi-página determinísticos seria necessário um schema isolado por arquivo.

## Gates completos

- `npm run lint`: exit 0.
- `npm run typecheck`: exit 0.
- `npm test`: exit 0; 92 testes API e 37 testes web.
- `npm run build`: exit 0.
- `git diff --check`: exit 0.
