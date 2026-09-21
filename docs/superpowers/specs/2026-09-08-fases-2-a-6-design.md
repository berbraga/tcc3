# EduITSM — desenho das Fases 2 a 6

## Status

Proposta aprovada em conversa para detalhamento; implementação ainda não iniciada.

## Objetivo

Estender a fundação da Fase 1 até o fluxo pedagógico completo do EduITSM: análise do ambiente, direção estratégica, portfólio, alinhamento, simulação, avaliação, relatório e acompanhamento do professor. Cada fase será entregue como um incremento executável, com testes de domínio e HTTP, telas em português brasileiro e verificação completa antes de avançar.

## Princípios e limites

1. A Fase 1 permanece inalterada funcionalmente e seus documentos, protótipos e diagramas são preservados.
2. A organização autorizada é sempre derivada do usuário autenticado; nenhum identificador enviado pelo cliente substitui essa decisão.
3. Cada fase terá um commit integrável, migrações incrementais, seed idempotente quando necessário, testes positivos e negativos e atualização da rastreabilidade.
4. Nenhuma funcionalidade futura será habilitada antes de seus contratos, regras, telas e testes estarem prontos.
5. O motor de simulação não será misturado ao cálculo de indicadores: ambos terão interfaces e testes próprios.

## Roadmap funcional

### Fase 2 — direção estratégica

Entrega T03, T04 e T05: CRUD de análise SWOT; quatro Ps (Perspectiva, Posição, Plano e Padrão); objetivos estratégicos; versionamento de estratégia; cobertura e pendências. RN02 e RN03 serão regras de domínio explícitas. Estratégia com qualquer P vazio será marcada incompleta e impedirá exportação futura. Alterações persistidas criarão uma nova versão sem destruir o histórico.

### Fase 3 — portfólio e alinhamento

Entrega T06–T11: serviços, CAPEX/OPEX, demanda e capacidade, vínculos serviço–objetivo e indicadores. Serviços e objetivos usarão relação muitos-para-muitos com justificativa obrigatória. A API rejeitará contribuição acima de 100% com 422 e informará o saldo disponível. Serviços descontinuados não aceitarão medições nem entrarão nos cálculos; serviços em operação sem vínculo aparecerão como pendência.

### Fase 4 — simulação e avaliação

Entrega T12 e T13: cenários configuráveis, gerador pseudoaleatório determinístico por semente, geração em lote, medições e painel de indicadores. A mesma semente e parâmetros produzirão os mesmos registros. O cálculo tratará maior-melhor e menor-melhor, disponibilidade, tempo médio e tolerância definida nos testes. O motor será executável sem HTTP para permitir testes de desempenho e reprodutibilidade.

### Fase 5 — relatório e professor

Entrega T14, T14b e T15: relatório consolidado da estratégia, exportação, acompanhamento de ambientes pelo professor e fluxo completo do estudo de caso. Exportação será recusada enquanto qualquer P estiver vazio. O professor terá leitura de ambientes de alunos e receberá 403 para qualquer escrita ou acesso fora do escopo autorizado.

### Fase 6 — robustez e implantação

Completar TS01–TS15, compatibilidade com navegadores atuais, acessibilidade sem dependência exclusiva de cor, limites de desempenho, build de produção, documentação operacional, configuração de deploy e ensaio completo do estudo de caso.

## Arquitetura proposta

O monorepo mantém três fronteiras:

- `packages/shared`: contratos Zod, tipos públicos e enums compartilhados.
- `apps/api`: rotas finas, casos de uso/serviços de domínio, repositórios Prisma, motor de simulação separado e adaptadores de relatório.
- `apps/web`: páginas por tarefa, componentes de formulário/tabela/estado, cliente Axios e queries/mutações TanStack Query.

Cada módulo da API terá rotas, serviço, repositório (quando necessário), schemas e testes próximos. O domínio não dependerá de Express ou React. A autorização será aplicada antes da leitura/escrita e filtrará sempre por `usuarioId`/organização derivada do JWT.

## Contratos e fluxo de dados

As rotas previstas no prompt serão implementadas incrementalmente: análise, estratégia/versões, objetivos/cobertura, serviços/custos/demanda, vínculos, indicadores, cenários, painel, relatório e ambientes do professor. Schemas compartilhados validarão limites textuais, numéricos, enums, datas e paginação. Erros de domínio serão convertidos para 401/403/404/422 pelo middleware existente, sem vazamento de senha, token ou detalhes de outra organização.

## Testes e verificação

Antes de cada implementação será escrito o teste que expressa o comportamento. Serviços terão testes unitários positivos e negativos; endpoints críticos terão Supertest; telas terão testes de interação, carregamento, erro, vazio e sucesso. O motor terá testes de determinismo e benchmark para 10.000 registros. Cada fase termina somente com `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` e revisão de diff verdes.

## Skill reutilizável proposta

Criar `eduitsm-development` em `~/.agents/skills/eduitsm-development/` somente após o plano ser aprovado. Ela será curta e genérica o suficiente para futuras sessões do projeto, contendo gatilhos para trabalhar no EduITSM, invariantes de organização/autorização, sequência TDD por fase, comandos de verificação, regras de seed/test database e critérios de conclusão. A skill será criada com `superpowers:writing-skills` em ciclo RED–GREEN–REFACTOR, usando cenários de pressão antes do arquivo final; não duplicará o README nem incluirá fatos de uma única execução.

## Critérios de aceite global

- Todas as telas T03–T15 previstas no prompt têm rota, estado de carregamento/erro/vazio/sucesso e contrato real.
- RN01–RN11 e TS01–TS15 têm evidência automatizada correspondente.
- O estudo de caso TechNova Retail funciona do login ao painel/relatório sem intervenção técnica.
- Dados de uma organização nunca aparecem ou são alterados por outra.
- A execução local e o deploy documentado são reproduzíveis a partir de um checkout limpo.
