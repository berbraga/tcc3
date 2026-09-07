# Fase 1 do EduITSM — plano de implementação

> **Para agentes executores:** SUB-SKILL OBRIGATÓRIA: use `superpowers:executing-plans` para executar as tarefas em ordem. Os passos usam caixas de seleção para acompanhamento.

**Objetivo:** entregar a fundação executável, a autenticação e o primeiro fluxo vertical T01 -> T02 com dados reais.

**Arquitetura:** monorepo npm; SPA React; API Express em camadas; Prisma/PostgreSQL; contratos Zod compartilhados. Autorização deriva usuário e organização do JWT, nunca do cliente.

**Stack:** Node.js 22, TypeScript estrito, React, React Router, Axios, TanStack Query, Express, Prisma, PostgreSQL 16, JWT, bcrypt, Zod, Vitest e Supertest.

**Especificação:** `docs/superpowers/specs/2026-09-07-fase-1-design.md`

## Restrições globais

- API sob `/api/v1`; todas as rotas exceto autenticação e saúde exigem JWT.
- Interface em português brasileiro e funcional a partir de 1024 px.
- Treze entidades no schema; funcionalidades após a Fase 1 não serão expostas por rotas vazias.
- Erros incluem `code`, `message` e `details` quando aplicável.
- Senhas usam bcrypt; segredo JWT existe apenas no ambiente.

---

### Tarefa 1: Fundação do monorepo e persistência

**Arquivos:** criar configurações raiz, `docker-compose.yml`, `.env.example`, `packages/shared`, `apps/api/prisma/schema.prisma`, migração e seed.

**Interfaces:** produz scripts `dev`, `build`, `lint`, `typecheck`, `test`, `db:migrate` e `db:seed`; produz `PrismaClient` com as treze entidades.

- [ ] Criar workspaces e configurações TypeScript/ESLint/Vitest.
- [ ] Modelar enums, treze entidades, índices, unicidades e ações referenciais.
- [ ] Iniciar PostgreSQL 16 e gerar a migração inicial.
- [ ] Criar seed idempotente com professor, aluno e TechNova Retail.
- [ ] Executar geração Prisma e checagem do schema.

### Tarefa 2: Contratos e aplicação HTTP mínima

**Arquivos:** criar contratos Zod em `packages/shared/src`; criar configuração, app, servidor, erros e middleware da API.

**Interfaces:** `env`, `AppError`, `errorHandler`, `GET /api/v1/health` e schemas de autenticação/organização.

- [ ] Escrever teste HTTP que espera `200` e `{ status: "ok" }` do health check (RED).
- [ ] Criar app Express mínimo e tratamento padronizado (GREEN).
- [ ] Testar payload inválido e ausência de stack trace (RED/GREEN).
- [ ] Executar os testes da API e refatorar mantendo-os verdes.

### Tarefa 3: Autenticação e RN01

**Arquivos:** criar repositórios de usuário/organização, serviço de autenticação, controlador, rotas e middleware JWT.

**Interfaces:** `AuthService.registrar`, `AuthService.login`, `autenticar`, `POST /auth/registro`, `POST /auth/login`.

- [ ] Escrever testes negativos e positivos para registro, normalização, perfil ALUNO e organização automática (RED).
- [ ] Implementar transação Prisma, bcrypt e resposta segura (GREEN).
- [ ] Escrever testes de login válido e credencial genérica inválida (RED).
- [ ] Implementar login e emissão JWT com expiração (GREEN).
- [ ] Escrever testes HTTP para token ausente, inválido e expirado (RED).
- [ ] Implementar middleware de autenticação e confirmar 401 nos três casos (GREEN).

### Tarefa 4: Organização atual e isolamento

**Arquivos:** criar repositório, serviço, controlador e rotas de organização.

**Interfaces:** `OrganizacaoService.obterMinha`, `OrganizacaoService.atualizarMinha`, `GET|PUT /organizacoes/minha`.

- [ ] Escrever testes que derivam a organização do usuário autenticado e ignoram IDs externos (RED).
- [ ] Implementar leitura e atualização pelos relacionamentos do usuário (GREEN).
- [ ] Escrever teste de tentativa de acesso cruzado retornando 403 sem dados (RED).
- [ ] Implementar guarda reutilizável de propriedade organizacional (GREEN).
- [ ] Executar testes de autenticação e isolamento completos.

### Tarefa 5: SPA T01 e T02

**Arquivos:** criar Vite React em `apps/web/src`, cliente HTTP, contexto de autenticação, rotas, componentes de layout e estilos.

**Interfaces:** `/login`, `/painel`, sessão em `sessionStorage`, hooks Query para login e organização.

- [ ] Escrever teste da submissão do login e apresentação do erro real da API (RED).
- [ ] Implementar T01 com validação, carregamento e autenticação real (GREEN).
- [ ] Escrever teste do painel carregando e editando a organização (RED).
- [ ] Implementar rota protegida, T02, cabeçalho, menu e formulário de organização (GREEN).
- [ ] Implementar estados de carregamento, erro, vazio e sucesso sem depender somente de cor.
- [ ] Validar navegação por teclado e layouts de 1440x900 e 1024 px.

### Tarefa 6: Documentação, rastreabilidade e verificação

**Arquivos:** criar `README.md`, `docs/rastreabilidade.md`; ajustar configurações conforme resultados.

**Interfaces:** comandos reproduzíveis e matriz RF08/RF09/RN01/TS09/TS10.

- [ ] Documentar pré-requisitos, ambiente, banco, migração, seed, execução e credenciais locais.
- [ ] Registrar o que está implementado, preparado e pendente.
- [ ] Executar migração e seed a partir de banco limpo.
- [ ] Executar `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
- [ ] Corrigir todas as falhas e repetir o conjunto completo com evidência fresca.
- [ ] Conferir item a item a definição de pronto da Fase 1.
