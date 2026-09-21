# Alinhamento EduITSM com TCC3 — desenho de execução

Data: 21 de setembro de 2026

## Objetivo

Alinhar o código atual do EduITSM ao TCC3 atual, preservando React/TypeScript, Express, Prisma/PostgreSQL, npm workspaces, Axios, TanStack Query, Zod, JWT/bcrypt e a separação entre interface, domínio e persistência.

O resultado esperado é o fluxo educacional verificável: autenticação, organização isolada, análise de ambiente, quatro Ps, objetivos, portfólio, custos/demanda, vínculos, indicadores, simulação, painel, revisão, exportação e acompanhamento do professor.

Ficam fora do escopo helpdesk, incidentes, mudanças, CMDB, cobrança, integrações externas, turmas e resultados de pesquisa pedagógica.

## Fontes usadas

1. `TCC_3_BernardoBraga_final_sem_revisoes.docx`, recuperado do commit local `4d2fc17` porque não está no checkout atual.
2. `docs/spec-alinhamento-tcc-codigo.md`, recuperado do mesmo commit histórico.
3. `EduITSM_Visao_Geral_do_Projeto.md`.
4. Código, testes, schema Prisma, README, diagramas e protótipos atuais.

A monografia, seus diagramas e protótipos não serão alterados. O arquivo histórico é fonte de requisitos, não será incorporado automaticamente ao código sem decisão explícita de preservação documental.

## Estado inicial revalidado

- Fases 2–6 já existem no código, mas a fundação ainda precisa de auditoria contra a especificação nova.
- `apps/web/src/app.tsx` lê `sessionStorage` diretamente e não possui contexto reativo de sessão.
- `apps/web/src/services/api.ts` injeta token, mas não trata centralmente `401`, logout ou limpeza de cache.
- Prisma e scripts de banco não compartilham de modo uniforme o `.env` da raiz.
- A proteção do banco de testes deve ocorrer antes de migração, seed ou limpeza.
- O seed usa IDs fixos em parte das relações e deve ser validado com IDs retornados pelos upserts.
- `Medicao` é única por indicador/período e não referencia cenário; a preservação entre execuções precisa de decisão técnica rastreável.
- O cálculo existente usa `slaCumprido`; isso não comprova disponibilidade temporal/uptime.
- Os enums `CUSTO` e `RECEITA` não possuem fonte operacional suficiente para cálculo de receita realizada.
- TS14 foi validado no Firefox Playwright; Chrome/Edge e checagem manual permanecem pendentes. TS15 ainda precisa de jornada E2E completa.

## Estratégia de implementação

### Incremento 1 — estabilização da fundação

Criar um contexto/provider de autenticação reativo e um contrato de sessão validado. O login atualizará o contexto antes da navegação; refresh reidratará somente uma sessão válida; sessão corrompida/expirada será removida e encaminhada ao login sem loop. O interceptor de API tratará `401`, limpará sessão e cache privado e emitirá um evento/ação única. O layout oferecerá `Sair`.

Testar login sem reload, refresh, sessão inválida/expirada, logout, troca de usuário, respostas `401`, cadastro transacional e rollback intermediário.

Padronizar um carregador de ambiente compartilhado pelos scripts Prisma/API/seed/testes, mantendo somente `VITE_*` públicos no frontend. O comando de testes validará banco/schema de teste antes de Prisma. Nenhum reset de volume ou migração destrutiva será executado.

### Incremento 2 — auditoria funcional das Fases 2 e 3

Comparar contratos compartilhados, serviços, repositórios, rotas e telas com RF01–RF06 e RN02–RN06/RN08/RN10. Corrigir somente divergências observadas, sempre com teste positivo e negativo antes da implementação. Verificar organização por JWT em recursos diretos e indiretos, Decimal financeiro, concorrência de vínculos, completude dos quatro Ps, histórico imutável e pendência de todo serviço sem vínculo conforme o TCC3.

### Incremento 3 — simulação e indicadores

Manter geração pura, persistência e cálculo separados. Definir no código e na documentação a versão do gerador, semente, timezone, ordenação, serviços elegíveis, limites e repetição de cenário. Impedir serviços não operacionais e estados parciais apresentados como sucesso.

Preservar cenários distintos por chave/relação incremental quando necessário, sem sobrescrever medições silenciosamente. O painel sempre identificará serviço, indicador, período e cenário.

Interpretação conservadora aprovada: `SLA` será chamado de **cumprimento de SLA**, calculado como percentual de registros elegíveis com `slaCumprido=true`; não será declarado uptime/disponibilidade temporal. `CUSTO` e `RECEITA` continuarão pendentes até haver fonte e fórmula documentadas; não serão preenchidos com metas, custos previstos ou contagem de registros.

### Incremento 4 — relatório, professor e verificação

Garantir exportação efetiva e bloqueio servidor-side para estratégia incompleta. O professor poderá consultar organizações de alunos e seus dados sem trocar token nem escrever no alvo, mas continuará editando seu próprio ambiente. O aluno não acessará rotas de supervisão nem outra organização.

Executar jornada real com API, PostgreSQL e navegador; registrar versões disponíveis. Medir geração pura, persistência, cálculo e tempo total, além de capacidade representativa, sem declarar RNF07 ou navegadores ausentes como validados.

## Contratos de segurança

- Organização do aluno deriva exclusivamente do `sub` do JWT.
- Relações indiretas verificam propriedade até a organização antes de ler/escrever.
- `401` para sessão ausente, inválida ou expirada; `403` para escopo proibido; `404` para recurso inexistente no escopo; `422` para regra de domínio.
- Seed é idempotente, permitido somente em desenvolvimento/teste explicitamente autorizados.
- Senhas, tokens, hashes e dados de outras organizações não aparecem em respostas ou logs.

## Evidência e documentação

Cada incremento terá testes de domínio, HTTP, banco ou interface conforme aplicável; comandos executados serão registrados em `docs/alinhamento-tcc.md`. `docs/rastreabilidade.md` receberá linhas para RF01–RF13, RN01–RN11, RNF01–RNF11 e TS01–TS15, diferenciando `implementado`, `validado`, `pendente` e `bloqueado`.

Gates por incremento: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `git diff --check` e a verificação específica do incremento. A conclusão integral somente será declarada com evidência de desempenho, capacidade, navegadores e implantação; qualquer ausência permanecerá explícita.

## Fora de decisão nesta etapa

- Não inventar fórmula de receita realizada.
- Não transformar cumprimento de SLA em disponibilidade temporal.
- Não adicionar associação de turmas professor–aluno.
- Não alterar TCC3, diagramas ou protótipos.
- Não publicar externamente nem alterar volumes/dados reais sem confirmação específica.
