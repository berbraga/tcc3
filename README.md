# EduITSM

Ferramenta educacional para praticar Gerenciamento da Estratégia (Strategy Management) da ITIL 4. O fluxo inclui análise SWOT, estratégia, objetivos, portfólio, indicadores, simulação, relatório e visão somente leitura do professor.

## Pré-requisitos

- Node.js 22 ou superior e npm 11
- Docker com Docker Compose para o PostgreSQL local

## Executar localmente

```bash
npm ci
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

Alunos novos usam o link **Cadastre-se como aluno** na tela de login. Cada cadastro cria uma conta ALUNO e uma organização própria em transação única; o professor acompanha esses ambientes em **T15 · Acompanhamento de alunos**.

O cadastro público (`POST /api/v1/auth/registro`) sempre cria perfil Aluno e sua organização na mesma transação.

O professor usa `T15 · Acompanhamento de alunos` para listar e abrir o relatório consolidado de cada aluno em modo somente leitura. Essa consulta mantém o mesmo token do professor; as telas usuais continuam editando apenas sua própria organização. Não há rota de escrita no ambiente-alvo de aluno.

O seed deixa o Portal de Vendas Corporativas (B2B) em **Em desenho**, com CAPEX
planejado de R$ 150.000, OPEX mensal planejado de R$ 15.000, demanda de 500
clientes no primeiro semestre e 10.000 transações por mês em registros
separados. Ele também cria o vínculo inicial de 35% com seu indicador de tempo
médio. Veja [o roteiro TechNova](docs/roteiro-demonstracao-technova.md) para o
exercício 35% + 70% (recusado) + 65% (aceito), simulação e consulta pelo
professor.

Em `T14 · Relatório da estratégia`, a tela apresenta uma prévia HTML e baixa
`relatorio-estrategia.pdf`. A API bloqueia a exportação com 422 quando faltar
qualquer um dos quatro Ps. O PDF não contém credenciais e é produzido somente
com os dados autorizados da organização autenticada.

## Comandos

```bash
npm run dev          # API e SPA em modo desenvolvimento
npm run lint         # análise estática
npm run typecheck    # TypeScript estrito em todos os workspaces
npm test             # testes unitários, HTTP, integração e interface
npm run test:e2e     # TS14 e TS15 em Firefox e Google Chrome reais
npm run benchmark     # benchmark local seguro; exige BENCHMARK_DATABASE_URL schema=verify
npm run build        # builds de produção
npm run db:generate  # gera o Prisma Client
npm run db:migrate   # cria/aplica migrações de desenvolvimento
npm run db:deploy    # aplica migrações versionadas
NODE_ENV=development EDUITSM_DEMO_SEED=true npm run db:seed # popula demo idempotente
```

Os testes da API usam por padrão o schema PostgreSQL isolado `test`. Antes de chamar Prisma, migração ou Vitest, a suíte valida `TEST_DATABASE_URL` (quando informado) ou o padrão. Ela aceita apenas `schema=test`, `schema=verify`, ou banco com sufixo `_test`/`_verify`; uma URL insegura interrompe o comando sem executar escrita. Para outro banco descartável, defina `TEST_DATABASE_URL` com uma dessas identificações.

`npm run test:e2e` inicia API e SPA reais, migra e popula somente o schema descartável `verify` e valida essa URL antes de chamar Prisma. Para substituir o alvo, use `E2E_DATABASE_URL` com `schema=verify` (ou banco com sufixo `_verify`); `DATABASE_URL` do shell é ignorada pelo executor E2E. A suíte não usa mocks de API e cria resultados de simulação identificados separadamente dos dados iniciais do seed.

O benchmark também exige uma URL explícita e descartável; nunca usa `DATABASE_URL` como fallback:

```bash
BENCHMARK_DATABASE_URL='postgresql://eduitsm:eduitsm_dev@localhost:5432/eduitsm?schema=verify' npm run benchmark
```

Ele migra apenas esse schema, mede geração, cálculo, persistência e 40 requisições TCP locais simultâneas e remove no final os usuários temporários de prefixo exclusivo. Consulte `docs/evidencia-desempenho-2026-09-21.md` para hardware, volumes, p50/p95, erros e limitações.

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
| `TEST_DATABASE_URL` | opcional; banco/schema exclusivamente de teste |
| `E2E_DATABASE_URL` | opcional; banco/schema exclusivamente de verificação E2E |
| `BENCHMARK_DATABASE_URL` | obrigatório para `npm run benchmark`; somente schema/banco `verify` descartável |

A API e os comandos Prisma/seed carregam `.env` da raiz do repositório. Somente variáveis com prefixo `VITE_` são incorporadas pelo frontend; não exponha `DATABASE_URL` ou `JWT_SECRET` nele. A API recusa a inicialização sem `DATABASE_URL` ou `JWT_SECRET` válido. Ela aceita CORS somente da origem configurada em `WEB_ORIGIN`; não use `*`. Reinicie a SPA após alterar `VITE_API_URL`, pois o Vite a incorpora na execução/build.

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
- Simulação: máximo de 10.000 registros por cenário; a geração foi medida em 4,48 ms contra o limite TS12 de 10 s no host descrito em `docs/evidencia-desempenho-2026-09-21.md`.
- Cliente HTTP: timeout de 2 s; a carga de 40 `GET /servicos` simultâneos teve p95 de 107,96 ms e zero erros no mesmo host. Isto é evidência local, não garantia de rede externa ou nuvem.
- Índices Prisma cobrem organização, objetivo, serviço, cenário, indicador/período e registros operacionais; as consultas de painel e relatório selecionam apenas os campos exibidos.

## Encerramento seguro

Pare os processos de desenvolvimento com `Ctrl+C`. Para parar somente o banco local, execute `docker compose down`; os dados permanecem no volume. Não use `docker compose down -v` a menos que queira apagar deliberadamente o banco local.

## Matriz de verificação TS01–TS15

Os casos TS01–TS15 têm testes nomeados na suíte API/web/E2E; TS12 e TS13 medem `performance.now()` contra os limites de 10 s e 2 s. Para executar TS14 e TS15 com backend completo, use `npm run test:e2e`.

`axe-core` verifica telas React reais de login e relatório, e os testes de interface verificam rótulos, foco sequencial por teclado, cabeçalhos de tabela e mensagens com papéis semânticos. Em 21/09/2026, TS14 e TS15 foram executados em Firefox 141.0 e Google Chrome 153.0.8010.52. Edge não está instalado neste ambiente; validação manual de teclado/foco em 1024 px e 1440 px, além de Edge, permanecem pendentes. JSDOM não mede contraste de cor.

## Checklist de verificação reproduzível

Execute no topo do repositório, após iniciar o PostgreSQL local. Os testes, E2E e benchmark rejeitam destino de banco que não seja descartável antes de qualquer escrita.

    npm run lint
    npm run typecheck
    npm test
    npm run build
    npm run test:e2e
    npm audit --omit=dev --offline
    git diff --check
    git status --short

Os gates serão reexecutados nesta task. A evidência anterior registrou Firefox 141.0, Google Chrome 153.0.8010.52, 10.000 registros em 4,48 ms e 40 consultas simultâneas com p95 de 107,96 ms. Isto não valida Edge, contraste manual, disponibilidade em nuvem ou rede externa. Consulte docs/rastreabilidade.md para o estado de cada RF, RN, RNF e TS.

## Estrutura

- `apps/api`: Express, serviços de domínio, repositórios Prisma, autenticação e testes.
- `apps/web`: React, rotas, cliente Axios, TanStack Query e telas T01–T15.
- `packages/shared`: contratos Zod e tipos compartilhados.
- `apps/api/prisma`: schema, migrações e seed.
- `docs`: decisões, desenho, plano e rastreabilidade.
