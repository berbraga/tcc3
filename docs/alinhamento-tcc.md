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
| RF12/RF13, RN11, TS14–TS15 | Implementado historicamente; TS14 Firefox e TS15/jornadas reais requerem evidência fresca. | Tasks 5 e 6 planejadas. |
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

## Próximo passo

Iniciar a Task 2: sessão reativa, expiração, saída e resposta centralizada a `401`.
