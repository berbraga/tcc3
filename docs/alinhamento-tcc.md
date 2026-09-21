# Alinhamento TCC3–código

## Fontes e escopo

- Fonte principal: `TCC_3_BernardoBraga_final_sem_revisoes.docx`, recuperada do commit histórico local `4d2fc17`.
- Fontes auxiliares: `EduITSM_Visao_Geral_do_Projeto.md`, imagens em `telas/`, `diagramas_uml/` e `diagramas/`.
- A monografia, diagramas e protótipos são somente referência e não serão alterados.
- O alinhamento usa o plano `docs/superpowers/plans/2026-09-21-alinhamento-tcc3-codigo-plan.md`.

## Estado revalidado em 21/09/2026

| Grupo | Estado antes desta etapa | Evidência atual |
|---|---|---|
| Fundação, RNF01–RNF06 e TS01–TS05 | Parcial: scripts podiam chamar Prisma antes da proteção do banco; ambiente raiz era carregado somente pela API. | Task 1 em validação: guarda antecipada, carregador raiz e seed idempotente cobertos por testes. |
| RF01–RF06, RN02–RN06/RN08/RN10 | Implementado historicamente; auditoria contra TCC3 pendente. | Código e testes existentes serão verificados na Task 3. |
| RF07/RF11, RN07–RN09, TS01 | Implementado historicamente; preservação de cenários e semântica de indicadores pendentes de auditoria. | Task 4 planejada. |
| RF12/RF13, RN11, TS14–TS15 | Relatório HTML, bloqueio 422, leitura de aluno pelo professor e limites de escrita foram revalidados; TS14 Firefox e TS15/jornadas reais ainda requerem evidência fresca. | Task 5 concluída; Task 6 planejada. |
| RNF07–RNF11 | Configuração/documentação parcial; desempenho, navegadores e nuvem não estão validados por configuração. | Task 7 planejada. |

## Progresso

### Task 1 — ambiente e banco de testes — concluída

- Criado `validarBancoDeTeste`: rejeita URL sem PostgreSQL ou identificação exata de teste antes de Prisma, migração ou Vitest.
- Criado carregador único do `.env` da raiz para API, comandos Prisma, seed e testes; o frontend recebe apenas variáveis `VITE_*` pelo Vite.
- O seed de demonstração foi extraído para serviço idempotente e usa os IDs retornados pelos upserts para relações dependentes.
- Testes RED/GREEN registrados para bloqueio antecipado e idempotência com usuário/organização pré-existentes.

Comandos executados nesta etapa:

```bash
npm exec -w @eduitsm/api vitest run test/database-command-safety.test.ts test/database-safety.test.ts
npm run typecheck -w @eduitsm/api
docker compose up -d
npm run test -w @eduitsm/api
npm ci
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Resultado: instalação limpa concluída; 105 testes API e 42 testes web aprovados; lint, typecheck, build e `git diff --check` aprovados. A execução deliberada com `TEST_DATABASE_URL` no schema `public` falhou antes de Prisma, migração ou seed, como esperado. `npm ci` relatou 8 vulnerabilidades transitivas conhecidas; elas não foram atualizadas nesta tarefa para não ampliar o escopo/dependências.

Correção de revisão: o cleanup do teste de seed agora só executa após `validarBancoDeTeste` concluir com sucesso; uma URL inválida mantém `bancoSeguro=false` e ainda garante o disconnect. O teste focado de seed e a regressão de comando seguro foram reexecutados.

### Task 2 — sessão reativa, expiração, saída e `401` — concluída

- Criados `AuthProvider` e parser de sessão JWT: o estado é reidratado somente quando o JSON, o usuário e a expiração são válidos. Sessões corrompidas ou expiradas são removidas antes do roteamento.
- Login atualiza o contexto reativo e abre o painel sem reload. A sessão válida permanece após refresh lógico; saída e troca de usuário removem sessão e cache TanStack Query.
- O cliente Axios trata `401` centralmente, evitando disparos duplicados concorrentes e permitindo um novo tratamento após a limpeza. Credenciais inválidas continuam exibindo a mensagem na tela de login.
- A interface inclui `Sair`; rotas protegidas retornam ao login sem loop quando não há sessão válida.
- Regressões de API cobrem rejeição de `perfil: PROFESSOR` no cadastro público e rollback real do cadastro aninhado caso a escrita da organização falhe. O teste usa schema PostgreSQL `test` já validado pela Task 1.

TDD: o primeiro teste da suíte `auth-flow` falhou pela ausência de `auth-context`/parser; após a implementação, os sete testes de sessão passaram. A regressão de múltiplas respostas `401` falhou antes do desbloqueio por microtask e passou depois da correção.

Comandos executados nesta etapa:

```bash
npm run test -w @eduitsm/web -- auth-flow.test.tsx
npm run test -w @eduitsm/web
npm run test -w @eduitsm/api -- integration.test.ts auth.service.test.ts api.test.ts
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Resultado: 107 testes API e 49 testes web aprovados; lint, typecheck, build e `git diff --check` aprovados. O fluxo real de navegador TS14/TS15 e validação manual continuam fora desta task e permanecem pendentes de evidência fresca.

Correção de revisão: o interceptor passou a identificar o token `Bearer` da requisição que recebeu `401`. Ele deduplica respostas paralelas pelo token e o `AuthProvider` só limpa sessão/cache se esse token ainda for o ativo no armazenamento. A regressão cobre uma requisição A pendente, saída/troca para B e o `401` tardio de A, preservando a sessão e o cache B.

### Task 3 — estratégia e portfólio — concluída

- A validação compartilhada de SWOT agora rejeita no servidor e no formulário as combinações incoerentes: FORÇA/FRAQUEZA são internas e OPORTUNIDADE/AMEAÇA são externas.
- A única regra de completude dos quatro Ps normaliza espaços em branco; um salvamento sem alteração retorna a versão atual. Alterações efetivas recebem uma nova versão imutável e o repositório bloqueia a organização na transação para numerar gravações concorrentes consecutivamente.
- Objetivos passaram a ter edição e remoção isoladas pela organização. A remoção retorna `422 OBJETIVO_POSSUI_RELACOES` quando ainda houver vínculos ou indicadores, preservando as referências; a decisão evita exclusão em cascata não prevista no TCC3.
- RN10 passou a apontar todo serviço sem vínculo — inclusive proposto e descontinuado. A tela de custos separa CAPEX e OPEX, mantendo `valorRealizado: null` distinto de zero; a tela de demanda informa que a utilização não é calculável quando não há capacidade instalada.
- As regressões HTTP reais confirmam o bloqueio concorrente de contribuição acima de 100% com `422` e saldo, isolamento de objetivo/indicador e meta/sentido obrigatórios. A criação de indicador em serviço descontinuado permanece bloqueada e a leitura de seu histórico é preservada.
- Correção de revisão: uma violação `P2003` do Prisma durante a exclusão concorrente de objetivo é convertida em `POSSUI_RELACOES`, chegando como `422 OBJETIVO_POSSUI_RELACOES`; a regressão produz o erro com gatilho PostgreSQL real no schema configurado, nome único, condição para o objetivo do teste e remoção no `finally`.

TDD: os testes novos falharam antes das correções para combinação SWOT inválida, estratégia normalizada sem alteração, versões concorrentes, pendências RN10, resumo de CAPEX/OPEX e demanda sem capacidade. Após as alterações, as suítes focadas e os gates completos passaram.

Comandos executados nesta etapa:

```bash
npm run test -w @eduitsm/web -- portfolio-pages.test.tsx
npm run test -w @eduitsm/api -- servico.api.test.ts
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

Resultado: 114 testes API e 56 testes web aprovados; lint, typecheck e build aprovados. A suíte usou PostgreSQL no schema `test`, validado antes de migrar. Validação manual de navegador e desempenho/carga permanecem pendentes das tasks específicas, sem serem contabilizados como aprovados aqui.

### Task 4 — simulação, cenário e painel — concluída

- O gerador foi versionado (`v1`), usa período inclusivo em UTC e continua puro; a persistência e o cálculo permanecem em módulos separados. As regressões de determinismo exercitam conteúdo operacional gerado, sem depender de UUIDs de banco ou timestamps de auditoria.
- Um cenário requer ao menos um serviço autorizado em `EM_OPERACAO` e ao menos um indicador nesses serviços. Serviços propostos, em desenho e descontinuados não recebem registros ou medições.
- `Medicao` passou a referenciar `CenarioSimulacao` por migração incremental. A chave de reprodução do cenário é protegida por lock transacional: repetir a mesma entrada devolve o cenário existente (`200`, `reutilizado: true`) e repetições concorrentes não duplicam dados.
- O painel não agrega mais resultados de cenários distintos. Cada resultado traz cenário, semente, perfil, versão do gerador, período, denominador e evolução entre períodos. Indicadores sem fonte operacional aparecem como **Sem medição**, sem valor zero ou situação de meta.
- `SLA` significa somente **cumprimento de SLA**: percentual de registros elegíveis com `slaCumprido=true`, precisão de duas casas e denominador exposto. Não é disponibilidade temporal/uptime. `CUSTO` e `RECEITA` permanecem sem cálculo porque o TCC3 não define fonte operacional/fórmula; o seed contém somente configuração de meta, não resultado simulado.
- Correção de revisão: a migração incremental `20260921162000_medicao_legada_unica` adiciona índice único parcial PostgreSQL para `(indicador_id, periodo_ref)` quando `cenario_id IS NULL`. Assim, uma medição manual/legada não é duplicada, enquanto medições equivalentes de cenários identificados permanecem distintas. A regressão de integridade real confirma `P2002` na segunda escrita legada.

TDD: as regressões para ausência de indicador, repetição idêntica, cenários distintos no mesmo período e indicador sem fonte foram executadas em RED antes da persistência/consulta revisada. Depois da implementação, a integração HTTP real confirmou rollback transacional, exclusão de descontinuados, isolamento entre organizações e idempotência concorrente.

Comandos executados nesta etapa:

```bash
npm run test -w @eduitsm/api -- simulacao.test.ts indicadores.calculo.test.ts cenario.api.test.ts
npm run test -w @eduitsm/web -- simulation-pages.test.tsx
npm run build -w @eduitsm/shared
npm run typecheck -w @eduitsm/api
npm run typecheck -w @eduitsm/web
```

Resultado parcial: 120 testes da API e 4 testes focados da interface aprovados. A medição completa de geração, persistência, cálculo e carga fica registrada para a Task 7; nesta task o limite automatizado de geração pura de 10.000 registros continua sendo TS12, sem alegar desempenho de persistência/carga ainda não medido.

### Task 5 — relatório e acompanhamento pelo professor — concluída

- O relatório consolidado agora inclui organização, quatro Ps, versão, objetivos, portfólio, vínculos, indicadores e cada medição persistida com período, origem, denominador e cenário quando houver. A exportação permanece HTML imprimível, com `Content-Disposition` de anexo e escape de conteúdo; o servidor retorna `422 ESTRATEGIA_INCOMPLETA` se qualquer P estiver vazio.
- Professor consulta a lista paginada e abre `GET /professor/ambientes/:organizacaoId/relatorio` somente para organizações de alunos. A rota usa o token do professor, nunca recebe token de aluno, e retorna `404` para uma organização que não seja de aluno. O aluno recebe `403` na supervisão.
- A escrita em `/professor/ambientes/:organizacaoId` recebe `403` de modo explícito. O bloqueio genérico de qualquer escrita de professor foi removido: as rotas normais derivam o ambiente do `sub` do JWT, portanto o professor pode editar a própria organização sem selecionar um alvo de aluno.
- A interface permite abrir o relatório do aluno pela tabela, identifica leitura somente, não oferece exportação nesse contexto e preserva o menu/conta do professor. O relatório normal continua oferecendo exportação quando os quatro Ps estão completos.
- Correção de revisão: o HTML exportado agora traz versão e data/hora da estratégia, além de período, origem, denominador e cenário de cada medição; a regressão também confirma escape de valores textuais no documento.

TDD: as regressões de leitura de alvo, escrita própria do professor e rota inexistente falharam antes da implementação. A regressão de período/origem falhou antes da normalização da medição para o contrato público. O repositório Prisma foi exercitado no PostgreSQL de teste com uma organização de aluno permitida e uma do professor recusada.

Comandos executados nesta etapa:

```bash
npm run test -w @eduitsm/web -- report-pages.test.tsx
npm run test -w @eduitsm/api -- relatorio.service.test.ts professor.api.test.ts professor.repository.integration.test.ts
npm run build -w @eduitsm/shared
npm run typecheck -w @eduitsm/api
npm run typecheck -w @eduitsm/web
```

Resultado parcial: 125 testes da API e 8 testes focados da interface aprovados. Lint, todos os testes e build completos serão executados antes do commit desta task. TS14/TS15, carga, Chrome/Edge e disponibilidade externa continuam pendentes das tasks específicas.

### Task 6 — jornada E2E e navegadores — concluída

- `tests/e2e/ts15.spec.ts` percorre, pela SPA e sem mock de API, login de aluno, edição da organização, SWOT, quatro Ps, objetivo, serviço, custo, demanda, vínculo, indicador, ativação do Portal B2B, cenário, painel, revisão e exportação HTML. O professor abre o ambiente do aluno, a escrita direta recebe `403 ACESSO_NEGADO` e ele retorna ao próprio painel para editá-lo.
- O executor E2E ignora `DATABASE_URL` do shell, aceita somente `E2E_DATABASE_URL` com identificação de teste e chama `validarBancoDeTeste` antes de Prisma, migração ou seed. O padrão é `schema=verify`; cada resultado gerado recebe marcador de execução e permanece separado dos dados iniciais da demonstração.
- `npm run test:e2e` serializa os projetos para não cruzar mutações do mesmo ambiente de demonstração. Em 21/09/2026 foram aprovados TS14 e TS15 em Firefox 141.0 (Playwright 1.55.0) e Google Chrome 153.0.8010.52; foram quatro testes em 24,7 s, com API, SPA e PostgreSQL reais.
- Microsoft Edge não está instalado neste host; não foi declarado validado. A validação manual de teclado/foco também permanece pendente. Os traces e screenshots só são retidos em falha e não são evidência versionada.

## Próximo passo

Iniciar a Task 7: desempenho, carga e preparação de implantação.
