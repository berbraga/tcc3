# EduITSM

Ferramenta educacional para praticar Gerenciamento da Estratégia (Strategy Management) da ITIL 4. O fluxo inclui análise SWOT, estratégia, objetivos, portfólio, indicadores, simulação, relatório e visão somente leitura do professor.

## Pré-requisitos

- Node.js 22 ou superior e npm 11
- Docker com Docker Compose para o PostgreSQL local

## Executar localmente

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:deploy
NODE_ENV=development EDUITSM_DEMO_SEED=true npm run db:seed
npm run dev
```

A SPA abre em `http://localhost:5173`; a API usa `http://localhost:3333/api/v1`; o health check é `http://localhost:3333/api/v1/health`.

`db:deploy` aplica somente as migrações já versionadas e é o comando seguro para subir um ambiente. `db:migrate` cria migrações durante desenvolvimento. O seed é idempotente, exclusivo de desenvolvimento/demo e não deve ser usado em produção com dados reais. Ele exige, no mesmo comando, `NODE_ENV=development` (ou `test`) e `EDUITSM_DEMO_SEED=true`; em produção, o processo é recusado mesmo se a flag for informada.

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
npm run db:migrate   # cria/aplica migrações de desenvolvimento
npm run db:deploy    # aplica migrações versionadas
NODE_ENV=development EDUITSM_DEMO_SEED=true npm run db:seed # popula demo idempotente
```

Os testes da API usam por padrão o schema PostgreSQL isolado `test`. Para outro banco, defina `TEST_DATABASE_URL`; a suíte recusa URLs que não indiquem ambiente de teste ou verificação.

## Variáveis e CORS

Copie `.env.example` para `.env`; ele é lido na raiz pelo backend e pelo Vite. Não versione esse arquivo.

| Variável | Uso |
|---|---|
| `DATABASE_URL` | conexão PostgreSQL obrigatória |
| `JWT_SECRET` | obrigatório, mínimo de 32 caracteres |
| `JWT_EXPIRES_IN` | duração do JWT; padrão `1h` |
| `API_PORT` | porta da API; padrão `3333` |
| `WEB_ORIGIN` | origem exata permitida pelo CORS; padrão `http://localhost:5173` |
| `VITE_API_URL` | URL pública da API usada pela SPA |

A API recusa a inicialização sem `DATABASE_URL` ou `JWT_SECRET` válido. Ela aceita CORS somente da origem configurada em `WEB_ORIGIN`; não use `*`. Reinicie a SPA após alterar `VITE_API_URL`, pois o Vite a incorpora na execução/build.

## VPS com Tailscale

1. Descubra o nome ou IP Tailscale da VPS com `tailscale status`.
2. Na VPS, defina em `.env` a origem que será aberta no navegador, por exemplo `WEB_ORIGIN="http://eduitsm-vps:5173"` e `VITE_API_URL="http://eduitsm-vps:3333/api/v1"`.
3. Inicie a API com `npm run dev -w @eduitsm/api` e, em outro terminal, a SPA com `npm run dev -w @eduitsm/web -- --host 0.0.0.0`.
4. Em um dispositivo conectado à mesma tailnet, abra `http://eduitsm-vps:5173`.

Exponha apenas as portas necessárias na interface Tailscale; o PostgreSQL do Compose fica ligado em `127.0.0.1:5432` e não deve ser publicado. Se a VPS também possuir IP público, aplique regras de firewall para não disponibilizar as portas 3333 e 5173 fora da tailnet.

## Build e container da API

O `Dockerfile` empacota a API e executa `db:deploy` antes de iniciar. Forneça as variáveis obrigatórias pelo ambiente/orquestrador, nunca pela imagem ou repositório:

```bash
docker build -t eduitsm-api .
docker run --rm -p 3333:3333 \
  -e DATABASE_URL='postgresql://usuario:senha@host:5432/eduitsm?schema=public' \
  -e JWT_SECRET='um-segredo-unico-com-ao-menos-32-caracteres' \
  -e WEB_ORIGIN='https://sua-spa.exemplo' \
  eduitsm-api
```

Faça `npm run build` para gerar a SPA. Ela pode ser servida como arquivo estático por uma hospedagem/proxy HTTPS; configure `VITE_API_URL` para a URL HTTPS pública da API antes do build. O container deliberadamente não distribui a SPA, para que a URL pública não fique fixa na imagem da API.

## Limites e desempenho

- Payload JSON da API: 32 KiB; excessos retornam `413 PAYLOAD_EXCEDIDO`.
- Paginação do professor: máximo de 100 itens por requisição.
- Simulação: máximo de 10.000 registros por cenário; o teste de desempenho mede o limite de 10 s.
- Cliente HTTP: timeout de 2 s; a consulta crítica de serviços tem teste com limite explícito de 2 s.
- Índices Prisma cobrem organização, objetivo, serviço, cenário, indicador/período e registros operacionais; as consultas de painel e relatório selecionam apenas os campos exibidos.

## Encerramento seguro

Pare os processos de desenvolvimento com `Ctrl+C`. Para parar somente o banco local, execute `docker compose down`; os dados permanecem no volume. Não use `docker compose down -v` a menos que queira apagar deliberadamente o banco local.

## Matriz de verificação TS01–TS15

Os casos TS01–TS13 têm testes nomeados na suíte API/web; TS12 e TS13 medem `performance.now()` contra os limites de 10 s e 2 s. TS15 permanece pendente de ensaio E2E com backend completo. A rastreabilidade completa, inclusive as evidências de acessibilidade, está em [`docs/rastreabilidade.md`](docs/rastreabilidade.md).

`axe-core` verifica telas React reais de login e relatório, e os testes de interface verificam rótulos, foco por teclado, cabeçalhos de tabela e mensagens com papéis semânticos. A checagem manual em navegador continua necessária antes de uma apresentação: nesta máquina há Firefox 155.0.1, mas não há Chrome, Edge ou runner Playwright/WebDriver; portanto TS14 e TS15 não são considerados aprovados aqui.

## Estrutura

- `apps/api`: Express, serviços de domínio, repositórios Prisma, autenticação e testes.
- `apps/web`: React, rotas, cliente Axios, TanStack Query e telas T01–T15.
- `packages/shared`: contratos Zod e tipos compartilhados.
- `apps/api/prisma`: schema, migrações e seed.
- `docs`: decisões, desenho, plano e rastreabilidade.
