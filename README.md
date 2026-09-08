# EduITSM

Ferramenta educacional para praticar Gerenciamento da Estratégia (Strategy Management) da ITIL 4. A Fase 1 entrega autenticação, organização isolada por usuário e o painel inicial.

## Pré-requisitos

- Node.js 22 ou superior e npm 11
- Docker com Docker Compose

## Executar localmente

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev
```

A SPA abre em `http://localhost:5173`; a API usa `http://localhost:3333/api/v1`. O health check está em `http://localhost:3333/api/v1/health`.

## Contas locais de demonstração

Estas credenciais existem apenas no seed de desenvolvimento:

| Perfil | E-mail | Senha |
|---|---|---|
| Aluno | `aluno@eduitsm.local` | `EduITSM@2026` |
| Professor | `professor@eduitsm.local` | `EduITSM@2026` |

O cadastro público (`POST /api/v1/auth/registro`) sempre cria perfil Aluno e sua organização na mesma transação.

## Comandos

```bash
npm run dev          # API e SPA em modo desenvolvimento
npm run lint         # análise estática
npm run typecheck    # TypeScript estrito em todos os workspaces
npm test             # testes unitários, HTTP, integração e interface
npm run build        # builds de produção
npm run db:generate  # gera o Prisma Client
npm run db:migrate   # aplica/cria migrações locais
npm run db:seed      # popula dados idempotentes
```

Os testes da API usam por padrão o schema PostgreSQL isolado `test`. Para outro banco, defina `TEST_DATABASE_URL`; a suíte recusa URLs que não indiquem ambiente de teste ou verificação.

## Matriz de verificação TS01–TS15

Os casos TS01–TS13 e TS15 têm testes nomeados na suíte API/web; TS12 e TS13 medem `performance.now()` contra os limites de 10 s e 2 s. A rastreabilidade completa, inclusive as evidências de acessibilidade, está em [`docs/rastreabilidade.md`](docs/rastreabilidade.md).

`axe-core` verifica o documento inicial e os testes de interface verificam rótulos, foco por teclado, cabeçalhos de tabela e mensagens com papéis semânticos. A checagem manual em navegador continua necessária antes de uma apresentação: nesta máquina há Firefox 155.0.1, mas não há Chrome, Edge ou runner Playwright/WebDriver; portanto TS14 não é considerado aprovado aqui.

## Estrutura

- `apps/api`: Express, serviços de domínio, repositórios Prisma, autenticação e testes.
- `apps/web`: React, rotas, cliente Axios, TanStack Query e T01/T02.
- `packages/shared`: contratos Zod e tipos compartilhados.
- `apps/api/prisma`: schema das treze entidades, migração e seed.
- `docs`: decisões, desenho, plano e rastreabilidade.

## Estado do escopo

- Implementado: RF08, RF09, RN01, autenticação JWT/bcrypt, isolamento inicial, T01 e T02.
- Preparado: as treze entidades, enums e relações no banco para as fases seguintes.
- Pendente: funcionalidades das Fases 2 a 6; links correspondentes aparecem desabilitados no menu.

`JWT_SECRET` deve ter pelo menos 32 caracteres e nunca ser versionado. A API aceita CORS somente de `WEB_ORIGIN`; a SPA guarda a sessão apenas em `sessionStorage`.
