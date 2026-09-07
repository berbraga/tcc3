# Prompt inicial para desenvolvimento do EduITSM

Você é um engenheiro de software sênior responsável por iniciar e conduzir o desenvolvimento do **EduITSM**, uma ferramenta educacional web para o ensino da prática de **Gerenciamento da Estratégia (Strategy Management) da ITIL 4** em cursos superiores de tecnologia da informação.

Trabalhe diretamente neste repositório. Antes de alterar qualquer arquivo, examine todo o material de referência disponível e produza um diagnóstico curto do estado atual. Em seguida, implemente a fundação do projeto e o primeiro fluxo vertical funcional conforme este prompt. Tome decisões técnicas razoáveis quando algo secundário não estiver especificado, registre essas decisões e não invente requisitos de negócio.

## 1. Fontes de verdade

Leia antes de programar:

1. `EduITSM_Visao_Geral_do_Projeto.md`, que consolida objetivo, escopo, requisitos, regras, arquitetura, dados, testes e contexto pedagógico.
2. `TCC_2_BernardoBraga_banca.docx`, especialmente o Capítulo 4 e os Apêndices A e B.
3. Todos os arquivos em `telas/`, que são a referência visual e funcional das quinze telas.
4. Todos os arquivos em `diagramas/`, principalmente casos de uso, atividade, classes, MER, arquitetura, implantação, navegação e sequências de UC09 e UC11.

Em caso de divergência, siga esta ordem de prioridade:

1. Regras de negócio e requisitos formalizados na monografia.
2. `EduITSM_Visao_Geral_do_Projeto.md`.
3. Comportamento representado nas telas e diagramas.
4. Decisões técnicas deste prompt.

Não modifique os documentos, diagramas ou protótipos de referência.

## 2. Missão do produto

O EduITSM deve permitir que um aluno percorra, em uma aula de quatro horas, o ciclo estratégico completo de um serviço de TI:

1. analisar o ambiente;
2. definir a direção estratégica;
3. desenhar os serviços;
4. representar a operação por simulação;
5. medir e avaliar resultados;
6. revisar a estratégia e iniciar um novo ciclo.

A ferramenta é um recurso didático, e não uma plataforma ITSM de produção. O foco é tornar visível a relação entre serviço de TI, objetivo de negócio, geração de valor, indicadores e melhoria contínua.

O requisito central é o **RF04**, que vincula um serviço a um objetivo estratégico com justificativa de valor e percentual de contribuição. O **RF05**, registro dos 4 Ps, materializa a estratégia. O **RF11**, motor de simulação reprodutível, fornece os dados que tornam possível o cálculo de indicadores do **RF07**.

## 3. Escopo obrigatório

### 3.1 Requisitos funcionais

- RF01: cadastrar e manter o portfólio de serviços.
- RF02: registrar custos e orçamento, incluindo CAPEX e OPEX.
- RF03: registrar demanda prevista e capacidade instalada.
- RF04: vincular serviços a objetivos estratégicos do negócio.
- RF05: registrar Perspectiva, Posição, Plano e Padrão.
- RF06: definir indicadores de desempenho por serviço.
- RF07: calcular indicadores a partir de dados operacionais simulados.
- RF08: autenticar usuários e distinguir os perfis Aluno e Professor.
- RF09: manter uma organização fictícia isolada por usuário.
- RF10: registrar forças, fraquezas, oportunidades e ameaças.
- RF11: gerar dados operacionais a partir de cenário configurável e semente.
- RF12: permitir ao professor acompanhar os ambientes dos alunos em modo somente leitura.
- RF13: exportar relatório consolidado da estratégia.

### 3.2 Regras de negócio obrigatórias

- RN01: cada usuário possui exatamente uma organização ativa.
- RN02: uma estratégia só é completa quando os quatro Ps estão preenchidos; estratégia incompleta bloqueia a exportação.
- RN03: salvar uma alteração na estratégia cria uma nova versão e preserva as anteriores.
- RN04: somente serviço já cadastrado no portfólio pode receber indicadores.
- RN05: serviços e objetivos possuem relação muitos para muitos; cada vínculo exige justificativa de valor.
- RN06: a soma das contribuições dos serviços para o mesmo objetivo não pode ultrapassar 100%. Em violação, a API deve responder com HTTP 422 e informar quanto ainda está disponível.
- RN07: serviços com status Descontinuado não recebem medições e não participam de cálculos.
- RN08: todo indicador exige uma meta e um sentido, `MAIOR_MELHOR` ou `MENOR_MELHOR`.
- RN09: registros operacionais são produzidos exclusivamente pelo motor de simulação. A mesma semente e os mesmos parâmetros devem produzir exatamente os mesmos registros.
- RN10: serviço em operação sem vínculo estratégico deve aparecer como pendência de alinhamento.
- RN11: o professor pode consultar ambientes de alunos, mas não alterá-los.

### 3.3 Requisitos não funcionais

- Interface em português brasileiro, apresentando o termo original em inglês quando ele tiver valor didático.
- Qualquer tarefa deve estar acessível em no máximo três níveis de navegação.
- Cadastros e consultas devem responder em até dois segundos em condições normais.
- A geração de 10.000 registros deve terminar em até dez segundos.
- Suporte às versões atuais de Chrome, Edge e Firefox.
- Layout desktop/notebook funcional a partir de 1024 px.
- Senhas protegidas com bcrypt e autenticação JWT com expiração.
- Isolamento rigoroso entre organizações; nunca confiar em `organizacaoId` enviado pelo cliente para autorizar acesso.
- Arquitetura em camadas, código versionado e testes automatizados, sobretudo para cálculos e simulação.
- Capacidade mínima planejada para quarenta usuários simultâneos.
- Histórico consultável das versões da estratégia.

### 3.4 Fora de escopo

Não implemente incidentes, problemas, mudanças, CMDB, catálogo corporativo completo, fluxos de aprovação, integrações externas, marketplace, cobrança, multi-organização por usuário ou qualquer uma das outras práticas da ITIL 4. Não transforme o sistema em uma ferramenta ITSM genérica.

## 4. Stack e arquitetura

Use a stack prevista no documento:

- Front-end: React e TypeScript.
- Rotas: React Router.
- Requisições e cache: Axios e TanStack Query.
- Back-end: Node.js, TypeScript e Express.
- Persistência: PostgreSQL e Prisma ORM.
- Autenticação: JWT e bcrypt.
- Testes: Vitest; use Supertest nos testes HTTP se necessário.
- API REST sob o prefixo `/api/v1`.

Estruture o repositório como monorepo TypeScript, preferencialmente com workspaces:

```text
apps/
  web/                 SPA React
  api/                 API Express
packages/
  shared/              tipos, contratos e validações compartilháveis
prisma/ ou apps/api/prisma/
docs/                  decisões técnicas e instruções
```

Se uma estrutura equivalente já existir, preserve-a. Configure scripts na raiz para desenvolvimento, build, lint, teste, migração e seed. Não introduza framework ou serviço externo que substitua a arquitetura especificada.

Adote separação clara no back-end:

```text
routes -> controllers -> services/use-cases -> repositories/Prisma
```

Mantenha o motor de simulação separado do módulo de cálculo de indicadores. Ambos devem ser funções determinísticas e testáveis sem servidor HTTP.

Utilize validação de entrada consistente. Padronize erros da API com, no mínimo, `code`, `message` e, quando aplicável, `details`. Nunca exponha hash de senha, token interno, stack trace ou dados de outra organização.

## 5. Modelo de domínio

Implemente as treze entidades previstas no documento, respeitando suas relações e o isolamento por organização:

1. `Usuario`: id, nome, email único, senhaHash, perfil, criadoEm.
2. `Organizacao`: id, usuarioId único, nome, setor, descricao, criadaEm.
3. `AnaliseAmbiente`: id, organizacaoId, tipo, categoria, descricao, impacto.
4. `EstrategiaServico`: id, organizacaoId, perspectiva, posicao, plano, padrao, versao, atualizadaEm.
5. `ObjetivoEstrategico`: id, organizacaoId, codigo, descricao, prazo, status.
6. `Servico`: id, organizacaoId, nome, descricao, publicoAlvo, status, criadoEm.
7. `CustoServico`: id, servicoId, tipo, valorPrevisto, valorRealizado, periodo.
8. `DemandaCapacidade`: id, servicoId, periodo, demandaPrevista, capacidadeInstalada, unidade.
9. `VinculoEstrategico`: id, servicoId, objetivoId, justificativaValor, contribuicao.
10. `Indicador`: id, servicoId, objetivoId opcional quando o serviço ainda não estiver vinculado, nome, tipo, unidade, meta, sentido.
11. `Medicao`: id, indicadorId, periodoRef, valor, origem.
12. `CenarioSimulacao`: id, organizacaoId, semente, periodoInicio, periodoFim, volumeRegistros, perfil.
13. `RegistroOperacional`: id, servicoId, cenarioId, dataAbertura, dataFechamento, tempoAtendimentoMin, slaCumprido, notaSatisfacao.

Use enums coerentes para perfil, tipo de análise, status de serviço, tipo de custo, tipo e sentido de indicador e perfil de simulação. Use `Decimal` para valores financeiros, metas e percentuais que não devem sofrer erro de ponto flutuante. Defina chaves estrangeiras, índices e restrições de unicidade adequados. Decida conscientemente entre exclusão restrita, cascata ou lógica e documente a escolha.

Todas as consultas a entidades indiretas, como custos, vínculos, indicadores, medições e registros, devem comprovar por relacionamento que o recurso pertence à organização autorizada.

## 6. Contrato inicial da API

Implemente ou deixe claramente preparado o seguinte contrato:

- `POST /api/v1/auth/registro`
- `POST /api/v1/auth/login`
- `GET|PUT /api/v1/organizacoes/minha`
- `GET|POST /api/v1/analises-ambiente`
- `PUT|DELETE /api/v1/analises-ambiente/:id`
- `GET|POST /api/v1/estrategia`
- `GET /api/v1/estrategia/versoes`
- `GET|POST /api/v1/objetivos`
- `GET /api/v1/objetivos/:id/cobertura`
- `GET|POST /api/v1/servicos`
- `PUT|DELETE /api/v1/servicos/:id`
- `GET|POST /api/v1/servicos/:id/custos`
- `GET|POST /api/v1/servicos/:id/demanda`
- `GET|POST /api/v1/vinculos`
- `DELETE /api/v1/vinculos/:id`
- `GET|POST /api/v1/servicos/:id/indicadores`
- `PUT|DELETE /api/v1/indicadores/:id`
- `POST /api/v1/cenarios`
- `GET /api/v1/indicadores/painel`
- `GET /api/v1/relatorios/estrategia`
- `GET /api/v1/professor/ambientes`

Todas as rotas, exceto autenticação, exigem JWT válido. Retorne 401 para ausência, invalidade ou expiração do token; 403 para tentativa de acesso a outra organização ou escrita do professor em ambiente de aluno; 404 para recurso inexistente dentro do escopo autorizado; 422 para regra de domínio violada.

## 7. Experiência do usuário

Use as imagens em `telas/` como referência de layout, hierarquia visual, nomenclatura, mensagens pedagógicas, estados, tabelas e navegação. Não precisa reproduzir pixels cegamente, mas a implementação deve ser reconhecível como o mesmo produto.

Diretrizes visuais observadas nos protótipos:

- interface clara, sóbria e acadêmica;
- fundo branco ou off-white, bordas cinza suaves e acento vinho;
- menu lateral agrupado em Estratégia, Portfólio e Avaliação;
- cabeçalho com organização ativa, usuário e perfil;
- títulos fortes, descrições didáticas curtas e etiquetas com RF/RN quando ajudarem na validação;
- estados de sucesso, atenção, pendência, abaixo da meta e crítico não devem depender somente de cor;
- formulários com rótulos explícitos, mensagens de erro junto ao campo e navegação por teclado;
- tabelas legíveis em 1024 px, com tratamento para vazio, carregamento e falha;
- interface em português brasileiro e acessível semanticamente.

O menu deve seguir o fluxo do protótipo:

- Estratégia: painel inicial, análise de ambiente, estratégia de serviço e objetivos estratégicos.
- Portfólio: serviços, vínculo estratégico e indicadores.
- Avaliação: cenário de simulação, painel de indicadores e relatório da estratégia.
- Professor: acompanhamento de alunos, visível apenas para esse perfil.

O painel inicial deve resumir o progresso no ciclo, exibir pendências e sugerir o próximo passo. Um serviço em operação sem vínculo deve conduzir o aluno à tela de vínculo. Indicador abaixo da meta deve conduzir à revisão da estratégia.

## 8. Cenário pedagógico e dados de demonstração

Crie um seed idempotente com ao menos um professor, um aluno e o cenário **TechNova Retail**. Não use senhas reais nem segredos no repositório; forneça credenciais locais de demonstração claramente marcadas para desenvolvimento.

O cenário principal deve incluir:

- organização: TechNova Retail, varejo eletrônico;
- problema: perda de vendas institucionais pela ausência de portal B2B com aprovação automatizada de crédito;
- objetivo OE-01: expandir a atuação no mercado corporativo e aumentar a receita bruta em 20%;
- serviço: Portal de Vendas Corporativas B2B;
- público: 500 clientes corporativos;
- demanda: 10.000 transações por mês;
- CAPEX: R$ 150.000,00;
- OPEX: R$ 15.000,00 por mês;
- SLA: meta de 99,9%;
- vendas faturadas: meta de R$ 2.000.000,00 em seis meses;
- período de exemplo: janeiro a junho de 2026;
- semente de exemplo: 20260912.

Inclua os quatro Ps de exemplo apresentados nas telas, objetivos, serviços adicionais, vínculos, indicadores e estados necessários para demonstrar pendências e regras. O seed deve permitir percorrer a interface sem montagem manual extensa.

## 9. Estratégia de implementação

Não tente entregar todas as telas em uma única alteração monolítica. Trabalhe em incrementos verificáveis e mantenha o projeto executável ao final de cada fase.

### Fase 0 — descoberta e decisões

1. Inspecione os documentos, protótipos e diagramas.
2. Verifique o conteúdo atual do repositório e preserve arquivos existentes.
3. Liste ambiguidades que afetem comportamento, mas faça suposições razoáveis para detalhes reversíveis.
4. Registre decisões técnicas essenciais em `docs/decisoes-tecnicas.md`.
5. Produza um plano curto com fases, dependências e critérios de aceite.

### Fase 1 — fundação executável

Esta é a entrega mínima obrigatória deste início de projeto:

1. monorepo e configurações TypeScript;
2. aplicações `web` e `api` iniciando em desenvolvimento;
3. variáveis de ambiente documentadas em `.env.example`, sem segredos;
4. PostgreSQL local via Docker Compose, se Docker for apropriado ao ambiente;
5. schema Prisma com as treze entidades, migração inicial e seed;
6. API com health check, tratamento de erro e validação;
7. registro, login, JWT, bcrypt e middleware de autenticação;
8. criação automática ou transacional da organização do usuário, garantindo RN01;
9. endpoint de leitura e edição da organização atual;
10. proteção básica por perfil e estrutura de autorização por organização;
11. SPA com rotas, layout autenticado, menu lateral e cabeçalho;
12. telas funcionais de login e painel inicial, aderentes a T01 e T02;
13. consumo real da API com Axios e TanStack Query;
14. testes de autenticação, expiração/invalidade de token e isolamento inicial;
15. instruções reproduzíveis para instalar, migrar, popular, testar e executar.

Não simule respostas da API no front-end quando o fluxo correspondente já fizer parte da Fase 1.

### Fase 2 — direção estratégica

Implemente análise SWOT, os quatro Ps com versionamento e objetivos estratégicos. Cubra RN02 e RN03 com testes. A interface deve corresponder a T03, T04 e T05.

### Fase 3 — portfólio e alinhamento

Implemente serviços, custos, demanda/capacidade, vínculos e indicadores. Cubra RN04, RN05, RN06, RN07, RN08 e RN10. A interface deve corresponder a T06, T07, T08, T09, T10 e T11.

### Fase 4 — simulação e avaliação

Implemente o gerador pseudoaleatório determinístico, geração eficiente em lote, cálculo de indicadores, medições e painel. Cubra RN09 e os testes TS01 a TS04, TS07 e TS12. A interface deve corresponder a T12 e T13.

### Fase 5 — relatório e professor

Implemente a exportação bloqueada quando a estratégia estiver incompleta, o relatório consolidado e a visão somente leitura do professor. Cubra RN02, RN11, TS06 e TS11. A interface deve corresponder a T14, T14b e T15.

### Fase 6 — robustez e implantação

Complete testes de integração, desempenho, compatibilidade, acessibilidade, build de produção, documentação e configuração de deploy. Prepare o ensaio TS15.

## 10. Testes e critérios técnicos

Comece a suíte já na Fase 1 e deixe a estrutura pronta para os quinze testes especificados na monografia:

- TS01: disponibilidade calculada com tolerância de 0,01 ponto percentual.
- TS02: tempo médio igual à média aritmética dos registros do período.
- TS03: avaliação correta de maior-melhor e menor-melhor acima, igual e abaixo da meta.
- TS04: mesma semente e cenário geram registros idênticos.
- TS05: contribuição acima de 100% é recusada; exatamente 100% é aceita.
- TS06: qualquer P vazio torna a estratégia incompleta e bloqueia exportação.
- TS07: serviço descontinuado não afeta medições.
- TS08: vínculo excedente responde 422 e informa contribuição disponível.
- TS09: acesso cruzado entre organizações responde 403 e não retorna dados.
- TS10: token ausente, inválido ou expirado responde 401.
- TS11: professor não altera ambiente de aluno e recebe 403.
- TS12: geração de 10.000 registros termina em até dez segundos.
- TS13: cadastros e consultas permanecem em até dois segundos.
- TS14: fluxo funciona em Chrome, Edge e Firefox atuais.
- TS15: estudo de caso completo funciona do login ao painel sem intervenção técnica.

Para cada regra de negócio implementada, escreva ao menos um teste positivo e um negativo. Teste o serviço/use case diretamente e, quando o comportamento for exposto por HTTP, adicione teste de integração. Não use apenas snapshots. Evite testes dependentes de relógio, ordem ou aleatoriedade não controlada.

Antes de declarar uma fase concluída, execute lint, checagem de tipos, testes e build. Se algo não puder ser executado no ambiente, explique exatamente o motivo e deixe o comando preparado.

## 11. Segurança e privacidade

- Faça hash da senha antes de persistir e nunca a retorne.
- Use segredo JWT apenas por variável de ambiente e valide sua presença no startup.
- Valide e normalize e-mail.
- Aplique limite e validação nos campos textuais e numéricos.
- Não aceite perfil Professor livremente em cadastro público de produção; para desenvolvimento, crie professor pelo seed ou por mecanismo administrativo documentado.
- Derive a organização autorizada do usuário autenticado.
- Proteja contra enumeração e vazamento por mensagens ou diferenças de consulta.
- Evite logging de senha, token ou conteúdo sensível.
- Configure CORS apenas para origens esperadas por ambiente.

## 12. Qualidade do código e documentação

- Ative modo estrito do TypeScript.
- Evite `any` sem justificativa.
- Centralize contratos, enums e validações compartilháveis sem acoplar o domínio ao framework web.
- Prefira funções pequenas e nomes em português ou inglês de forma consistente; não misture idiomas arbitrariamente no mesmo contexto.
- Comente apenas decisões ou regras não óbvias.
- Mantenha README com pré-requisitos, arquitetura, comandos, variáveis, migração, seed, testes e contas locais.
- Mantenha rastreabilidade entre RF, RN e testes em `docs/rastreabilidade.md`.
- Não adicione dependência sem propósito claro.

## 13. Forma de trabalho esperada

1. Comece apresentando o diagnóstico do repositório e o plano da Fase 1.
2. Implemente a Fase 1 de ponta a ponta, sem parar apenas na análise.
3. Preserve qualquer alteração existente que não seja sua.
4. Faça mudanças pequenas e coerentes.
5. Execute os comandos de verificação e corrija as falhas encontradas.
6. Compare visualmente T01 e T02 com a implementação em navegador desktop de 1440 × 900 e também valide a largura mínima de 1024 px.
7. Não afirme que algo funciona sem ter executado a verificação correspondente.
8. Ao encontrar uma ambiguidade de alto impacto e irreversível, pare e faça uma pergunta objetiva. Para decisões reversíveis, escolha a alternativa mais simples e registre-a.

## 14. Definição de pronto da Fase 1

A fundação inicial estará pronta quando uma pessoa, a partir de um clone limpo, conseguir:

1. instalar as dependências com o gerenciador escolhido;
2. subir o PostgreSQL local;
3. configurar o ambiente a partir de `.env.example`;
4. aplicar a migração e executar o seed;
5. iniciar API e SPA;
6. autenticar-se com a conta de aluno do seed;
7. visualizar e editar somente a própria organização;
8. acessar o painel inicial com dados reais da API;
9. tentar uma operação sem token e receber 401;
10. tentar acessar dados de outra organização e receber 403;
11. executar lint, typecheck, testes e build sem falhas.

A interface deve ter estados de carregamento, vazio, erro e sucesso; o README deve conter comandos exatos; nenhum segredo deve estar versionado; e as treze entidades devem estar representadas no schema mesmo que nem todas tenham interface na Fase 1.

## 15. Relatório final da execução

Ao concluir a Fase 1, responda de forma objetiva com:

1. o que foi implementado;
2. principais decisões e suposições;
3. arquivos e módulos centrais;
4. comandos executados e seus resultados;
5. cobertura dos critérios da definição de pronto;
6. limitações ou pendências reais;
7. próximo incremento recomendado, começando pela Fase 2.

Não marque como concluído requisito que tenha apenas estrutura vazia, mock ou comentário TODO. Diferencie explicitamente entre implementado, preparado e pendente.
