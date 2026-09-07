# EduITSM — desenho da Fase 1

## Objetivo

Entregar uma fundação executável do EduITSM com autenticação real, uma organização isolada por usuário e as telas T01 e T02 consumindo a API REST. As demais entidades ficam modeladas no banco, mas suas funcionalidades permanecem para as fases posteriores.

## Arquitetura

O repositório será um monorepo npm com `apps/api`, `apps/web` e `packages/shared`. A API Express seguirá `routes -> controllers -> services -> repositories`, usando Prisma sobre PostgreSQL. A SPA React usará React Router, Axios e TanStack Query.

O cadastro público cria apenas alunos. Usuário e organização são persistidos na mesma transação, e a restrição única de `Organizacao.usuarioId` garante a RN01. Nenhuma rota protegida recebe `organizacaoId` como autoridade: o contexto vem exclusivamente do JWT validado.

## Contratos da Fase 1

- `GET /api/v1/health`: retorna a disponibilidade da API.
- `POST /api/v1/auth/registro`: normaliza e-mail, cria aluno e organização e retorna token e usuário sem hash.
- `POST /api/v1/auth/login`: autentica sem revelar se o e-mail existe e retorna token e usuário.
- `GET /api/v1/organizacoes/minha`: retorna apenas a organização do usuário autenticado.
- `PUT /api/v1/organizacoes/minha`: valida e atualiza apenas nome, setor e descrição da própria organização.
- Erros seguem `{ code, message, details? }`; autenticação ausente, inválida ou expirada retorna 401.

## Dados e exclusões

O schema conterá as treze entidades e enums do Apêndice B. Relações dependentes usam cascata quando não possuem sentido fora do agregado; a referência opcional de indicador para objetivo usa `SetNull`. Exclusão lógica não será antecipada na Fase 1.

O seed idempotente criará um professor, um aluno e o cenário TechNova Retail completo o suficiente para alimentar o painel real, sem implementar endpoints das fases 2 a 5. Credenciais serão fixas, exclusivas de desenvolvimento e documentadas.

## Interface

T01 terá o painel institucional, formulário acessível e mensagens por campo. Os controles de recuperação de senha e sessão persistente serão apresentados como indisponíveis, pois não pertencem ao escopo.

T02 terá menu lateral, cabeçalho, edição da organização e resumo real derivado da organização e de contagens retornadas pela API. Links de fases futuras permanecerão visualmente identificáveis e desabilitados, sem rotas vazias que aparentem funcionalidade.

## Testes e segurança

Vitest e Supertest cobrirão registro, login, hash, perfil público, criação transacional da organização, token ausente/inválido/expirado e acesso limitado à própria organização. Testes de serviço usarão repositórios em memória; testes HTTP exercitarão a aplicação real com dependências controladas. O front-end terá testes de login, estados de carregamento/erro e edição da organização.

O segredo JWT será obrigatório no startup, CORS aceitará apenas a origem configurada e nenhuma resposta incluirá hash, token interno, stack trace ou dado de outra organização.

## Critério de aceite

Com PostgreSQL disponível, uma pessoa consegue instalar, migrar, popular, iniciar API e SPA, entrar com o aluno de demonstração, visualizar e editar sua organização e observar 401/403 nos cenários previstos. `lint`, `typecheck`, `test` e `build` devem terminar com código zero.
