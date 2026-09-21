# Especificação de alinhamento entre EduITSM e TCC

Data: 21 de setembro de 2026.

Esta especificação orienta a implementação do produto descrito no TCC atual, a partir do código existente. A criação deste arquivo não executa a implementação. Quando solicitada sua execução, a missão inclui corrigir a fundação e concluir as funcionalidades previstas, com evidências verificáveis.

## 1. Objetivo e limites

Entregar o percurso educacional completo: acessar uma organização fictícia, analisar seu ambiente, definir os quatro Ps, estabelecer objetivos, manter serviços, justificar seus vínculos com o negócio, definir indicadores, simular dados, avaliar resultados, revisar a estratégia e exportar o relatório. O professor deve acompanhar os ambientes dos alunos em modo somente leitura e continuar operando seu próprio ambiente de demonstração.

Preserve React, TypeScript, Express, Prisma, PostgreSQL, npm workspaces, Axios, TanStack Query, Zod e a separação entre interface, domínio e persistência. Preserve as alterações preexistentes do usuário. Corrija a implementação atual em incrementos; não reinicie o projeto nem troque a stack.

Não inclua helpdesk, incidentes, mudanças, CMDB, cobrança, integrações externas ou outras práticas fora do recorte. Não implemente plataforma de questionários ou gestão de turmas sem requisito correspondente. A aplicação educacional e seus resultados empíricos permanecem trabalho da pesquisa: não gere resultados de alunos nem alegue eficácia pedagógica com base em testes de software.

## 2. Fontes e precedência

Leia as instruções aplicáveis ao repositório, inclusive `AGENTS.md` quando existir e `/home/bernardo/.codex/RTK.md` quando disponível. Em seguida, use estas referências:

| Prioridade | Fonte | Uso |
|---|---|---|
| 1 | `TCC_3_BernardoBraga_final_sem_revisoes.docx` | Requisitos e regras atuais: seções 4.3.5.3, 4.4.2–4.4.4, 4.4.6, 4.4.13–4.4.17 |
| 2 | Esta especificação | Escopo de execução, correções conhecidas, critérios de verificação e tratamento de lacunas |
| 3 | `EduITSM_Visao_Geral_do_Projeto.md` | Contexto e resumo complementar; conferir divergências com o DOCX |
| 4 | `telas/`, `diagramas_uml/`, `diagramas/` | Referências visuais e de modelagem; identificar as correspondentes às figuras do TCC atual |
| 5 | `docs/superpowers/specs/2026-09-08-fases-2-a-6-design.md`, `docs/superpowers/plans/2026-09-08-eduitsm-fases-2-a-6.md`, `docs/decisoes-tecnicas.md`, `PROMPT_INICIAL_EDUITSM.md` | Planejamento anterior a reconciliar com o estado real |

Instruções atuais do usuário e regras de sistema do ambiente prevalecem sobre esta hierarquia documental. O código é evidência do estado implementado, não autorização para reduzir um requisito.

O prompt antigo referencia `TCC_2_BernardoBraga_banca.docx`, ausente nesta pasta, e manda encerrar na Fase 1. Essas orientações estão superadas para esta execução: use o DOCX de TCC3 existente e avance pelo escopo completo. Não crie skills globais nem altere configurações pessoais porque um plano anterior as propôs.

A seção 4.4.15 registra o estágio histórico, enquanto as demais seções especificam o produto pretendido. Não transforme esse registro histórico em limite de implementação. Extraia os quadros e inspecione as figuras relevantes; não se baseie apenas no nome do arquivo ou no resumo.

Não modifique a monografia, seus comentários, diagramas ou protótipos. Atualize a documentação operacional do software somente conforme o comportamento implementado. Nunca altere a descrição do requisito para esconder uma funcionalidade faltante.

### Divergências e decisões

Crie `docs/alinhamento-tcc.md` como registro curto: RF/RN/RNF/TS, seção de origem, estado atual, lacuna, decisão, evidência e pendência. Resolva detalhes técnicos reversíveis usando a arquitetura existente e registre a decisão. Quando houver contradição de negócio que a precedência não resolva, faça uma pergunta objetiva com o trecho conflitante e o impacto; continue o trabalho independente dessa resposta.

Não invente fórmulas financeiras, restrições pedagógicas ou permissões para contornar uma lacuna. A validação de uma escolha de negócio é diferente de pedir autorização para cada arquivo ou fase.

## 3. Diagnóstico inicial a revalidar

Na análise de 21/09/2026, existem autenticação, organização e T01/T02, treze modelos Prisma, migração e seed. Os módulos pedagógicos ainda não possuem seu fluxo implementado. Build, lint, typecheck e os 19 testes existentes passaram com PostgreSQL temporário. Isso é uma referência inicial, não um resultado a reutilizar sem executar verificações no estado atual.

Foram encontrados login sem navegação reativa, ausência de recuperação de sessão expirada, carregamento inconsistente do `.env` da raiz e validação do destino do banco de testes posterior à migração. O seed cria um cenário com volume 10.000, mas não gera os registros nem as medições. Verifique cada ponto antes de corrigir, pois o código pode ter mudado.

## 4. Etapa inicial de estabilização da Fase 1

| Problema | Implementação esperada | Aceite observável |
|---|---|---|
| Login → painel | Autenticação em estado/contexto reativo, compartilhado pelas rotas e pelo cliente da API | Login válido abre o painel sem reload; refresh da página mantém sessão válida |
| Expiração e saída | Tratamento central de 401; limpeza de sessão e cache de dados; ação Sair; evitar loops de redirecionamento | Sessão expirada retorna ao login; novo login funciona; trocar usuário não exibe dados em cache do anterior |
| Ambiente | Estratégia explícita para API, Prisma e Vite; scripts e exemplos coerentes | Instalação limpa seguindo exclusivamente o README inicia o sistema e aplica migração/seed; apenas variáveis públicas chegam ao frontend |
| Banco de testes | Validar o destino antes de conectar, migrar, popular ou limpar dados; banco/schema isolado | URL insegura é recusada antes de executar Prisma ou qualquer escrita |
| Seed e testes | Usar IDs efetivamente retornados pelos upserts; manter demonstração idempotente; testar a aplicação composta | Reexecutar seed não duplica dados; contas preexistentes não quebram relações; testes cobrem login completo, isolamento de dois alunos e rollback do cadastro |

Use bancos descartáveis que pertençam à verificação. Não execute testes destrutivos sobre o banco de desenvolvimento do usuário ou dados reais. Não faça reset, limpeza de volumes, migração destrutiva ou reescrita do histórico Git sem confirmação explícita. Prefira migrações incrementais e compatíveis.

## 5. Funcionalidades obrigatórias e sequência

Mantenha a numeração das fases existentes. Cada fase deve entregar contratos, regra de domínio, persistência, API, interface e evidência, na medida aplicável ao recurso.

| Fase | Escopo | Requisitos e telas | Condição para concluir |
|---|---|---|---|
| Estabilização | Acesso, configuração, organização e testes confiáveis | RF08/RF09; RN01; T01/T02 | Cumprir a seção 4 desta spec |
| 2 — direção estratégica | Análise SWOT, quatro Ps, histórico e objetivos estratégicos | RF05/RF10; RN02/RN03; T03–T05 | Editar, persistir e consultar dados reais; versões anteriores preservadas |
| 3 — portfólio e alinhamento | Serviços, custos CAPEX/OPEX, demanda/capacidade, vínculos, cobertura e indicadores | RF01–RF04/RF06; RN04–RN08/RN10; T06–T11 | Aluno justifica o serviço, vê contribuição e pendências e define indicadores válidos |
| 4 — simulação e avaliação | Cenários, registros determinísticos, apuração de medições e painel | RF07/RF11; RN07–RN09; T12/T13 | Gerar e persistir dados reais de simulação; painel calculado a partir deles |
| 5 — relatório e professor | Relatório consolidado exportável; consulta dos ambientes de alunos | RF12/RF13; RN02/RN11; T14/T14b/T15 | Exportação válida, bloqueio de estratégia incompleta e leitura efetiva pelo professor |
| 6 — verificação integral | Desempenho, capacidade, navegadores, acessibilidade, empacotamento e operação | RNF01–RNF11; TS01–TS15 | Jornada completa verificada e limites externos explicitamente registrados |

Não habilite menus que levam a telas vazias ou a operações simuladas quando o contrato real deveria existir. Os estados vazios devem orientar a próxima ação disponível. O painel deve sugerir somente ações que o usuário consegue executar.

### Invariantes do domínio

| Regra | Comportamento obrigatório |
|---|---|
| RN01 | Cada usuário tem uma organização; cadastro transacional garante sua criação |
| RN02/RN03 | Quatro Ps não vazios após trim; versão nova para alteração efetiva; histórico imutável; exportação bloqueada se incompleta |
| RN04/RN05 | Indicador exige serviço existente e autorizado; vínculo serviço–objetivo exige justificativa e pertence à mesma organização |
| RN06 | Soma por objetivo não excede 100%, inclusive em requisições concorrentes; violação retorna 422 com saldo disponível; usar aritmética adequada |
| RN07 | Serviço descontinuado não recebe medições novas nem participa dos cálculos atuais; decidir e documentar a apresentação do histórico sem apagar evidências |
| RN08 | Meta e sentido obrigatórios; comparar corretamente acima, igual e abaixo da meta; dados ausentes não equivalem a meta cumprida |
| RN09 | Dados operacionais vêm do motor, com semente e parâmetros controlados; nenhuma geração manual disfarçada de simulação |
| RN10 | Sinalizar serviços sem vínculo estratégico conforme o Quadro 16 atual, que não restringe a regra a serviços em operação |
| RN11 | Professor consulta alunos sem poder modificar seus dados; conserva permissão de operar sua própria organização |

A RN10 do DOCX é mais abrangente que parte do planejamento antigo. Aplique o texto atual e registre a reconciliação. Mudanças de status, exclusões e relacionamento entre entidades devem preservar as invariantes; ocultar um botão não substitui autorização no servidor.

## 6. Contratos, autorização e banco

Parta dos endpoints da seção 4.4.16 e dos contratos compartilhados existentes. Documente DTOs, validações, filtros, paginação quando necessária e erros antes de implementar cada recurso. Complete operações indispensáveis ao caso de uso mesmo quando o quadro de endpoints apenas as resumir; registre extensões pequenas e consistentes.

Para aluno, derive a organização do usuário autenticado. Para recursos indiretos, confirme a propriedade por toda a relação: custo → serviço → organização, medição → indicador → serviço → organização, e assim por diante. IDs recebidos por URL, corpo ou filtro são entradas não confiáveis.

O professor precisa de rotas de leitura com organização-alvo explícita e autorização de perfil. Uma lista de nomes de alunos não satisfaz RF12: deve ser possível examinar estratégia, portfólio, vínculos e resultados. Essa exceção de leitura não deve permitir impersonação, troca do token ou escrita nos endpoints comuns. O documento prevê leitura de todos os alunos; não invente um sistema de turmas ou de associação professor–aluno.

Retorne 401 para credenciais de sessão ausentes/inválidas/expiradas; 403 para acesso cruzado proibido e escrita em ambiente de aluno pelo professor; 404 para recurso inexistente no escopo; 422 para regra de domínio violada. Preserve o contrato de erro existente. Cadastro público não concede perfil PROFESSOR. Senhas e tokens não aparecem em relatórios ou respostas de domínio.

Use transações/restrições apropriadas para concorrência de versões e contribuições; validar uma soma fora da transação não garante RN06. Preserve os treze modelos como base e justifique qualquer ajuste necessário com migração incremental. Não apague dados para fazer testes ou migrações passarem.

## 7. Simulação e significado dos indicadores

Separe três responsabilidades: gerar registros de operação, persistir uma execução e calcular indicadores. O gerador deve executar sem Express ou banco; os testes de integração verificam a persistência e o isolamento.

Antes de implementar, registre parâmetros completos, serviços elegíveis, distribuição de volume, intervalos de datas, tratamento de fuso horário, perfil do cenário, algoritmo e versão do gerador, ordenação estável e comportamento de uma repetição da mesma solicitação. Evite duplicar medições silenciosamente ao repetir a operação.

O UC11 exige pelo menos um serviço em operação e ao menos um indicador definido; o fluxo gera registros para serviços em operação. Valide esses pré-requisitos no servidor e não inclua serviços `PROPOSTO`, `EM_DESENHO` ou `DESCONTINUADO` na geração. O seed mantém o Portal B2B em desenho: o roteiro TechNova deve mostrar sua transição para operação antes de simulá-lo, em vez de relaxar a regra.

O modelo atual de `Medicao` é único por indicador/período e não referencia cenário. Defina como duas simulações no mesmo período permanecem identificáveis e como o painel seleciona os resultados. Uma eventual extensão de chave/relação precisa de migração incremental e decisão rastreável; não sobrescreva nem misture resultados de cenários silenciosamente. Se a escolha afetar a preservação histórica sem orientação suficiente das fontes, apresente a decisão necessária ao usuário e continue o gerador e os cálculos independentes.

Reprodutibilidade compara o conteúdo operacional canônico para entradas equivalentes, inclusive entre organizações. UUIDs de persistência, IDs de organização e timestamps de auditoria não são resultados pedagógicos; não os use como fonte aleatória nem como motivo para diferenças de indicadores. Teste separadamente a identidade no banco e a igualdade do conteúdo gerado. Não use `Math.random()` ou relógio corrente sem controle.

### Definições que exigem rastreabilidade

| Indicador/condição | Definição a demonstrar |
|---|---|
| Cumprimento de SLA | Percentual derivado dos registros elegíveis e de `slaCumprido`; explicitar denominador e período. O rótulo de disponibilidade presente no documento não autoriza alegar medição temporal de uptime sem dados de tempo de indisponibilidade |
| Tempo de atendimento | Média dos tempos válidos no período e unidade explícita; não produzir `NaN` nem média artificial quando não há dados |
| Satisfação | Agregação das notas válidas, escala e tratamento de ausências documentados |
| Custo e receita | Identificar origem dos valores, período e fórmula. `RegistroOperacional` não contém faturamento; meta, CAPEX/OPEX previsto e número de chamados não são receita realizada |
| Ausência de dados | Mostrar estado sem medição; não converter ausência em zero, sucesso ou meta alcançada |

O enum atual inclui `CUSTO` e `RECEITA`, e o exemplo TechNova prevê vendas faturadas. Examine se as fontes definem como calcular esses valores. Se não definirem, apresente a lacuna e uma proposta concreta de dados/fórmula para decisão do usuário, enquanto implementa os indicadores já especificados. Não preencha gráficos com valores inventados nem declare esses tipos concluídos por existirem no enum. A presença de `MANUAL` no enum de origem também não cria requisito de entrada manual de operação.

Trate também a diferença entre cumprimento de SLA e disponibilidade como decisão de negócio. Pode implementar o percentual de cumprimento com nome e fórmula corretos; não o declare medição de disponibilidade nem marque TS01 como satisfeito sem resolver explicitamente a definição exigida pelo documento, incluindo dados e fórmula. Apresente uma proposta concreta ao usuário quando as fontes não resolverem essa distinção; os demais cálculos podem continuar.

Garanta registros coerentes: fechamento posterior à abertura quando informado, tempos e notas válidos, limites de volume e datas, somente serviços autorizados e elegíveis. Registros incompletos precisam de tratamento explícito nas fórmulas, sem completar valores fictícios apenas para permitir o cálculo.

## 8. Interface, relatório e demonstração

Use os protótipos como referência visual do mesmo produto e mantenha a interface em português brasileiro. Não exponha IDs de RF/RN, detalhes de banco ou jargão de implementação em fluxos do aluno sem utilidade pedagógica. Mantenha rótulos, ajuda contextual dos quatro Ps, mensagens de validação e estados acessíveis, sem depender só de cor.

Verifique desktop em 1440 × 900 e largura mínima de 1024 px. Tarefas devem ser alcançáveis em até três níveis de navegação. Formulários e diálogos precisam funcionar por teclado, com foco e erros compreensíveis.

O relatório reúne quatro Ps, versão, portfólio, vínculos e indicadores com período e origem dos dados. Entregue uma exportação efetiva, em formato coerente com o protótipo e documentado, não apenas um JSON de API. A escolha entre PDF e HTML imprimível pode ser técnica se a fonte não fixar o formato; confirme que o usuário consegue obter o arquivo/saída. A validação da estratégia completa acontece também no servidor. Professor consulta/exporta somente no escopo autorizado e não altera a origem.

Prepare TechNova Retail com aluno e professor, os serviços/objetivos previstos e uma forma reproduzível de executar a simulação. Demonstre a diferença entre dados iniciais do seed e resultados gerados pelo motor. O fluxo deve poder ser percorrido sem editar o banco manualmente.

## 9. Evidências e critérios de aceitação

Amplie `docs/rastreabilidade.md` com uma linha por RF, RN, RNF e TS aplicável: fonte, código, teste/cenário, comando e estado. Use estados explícitos: pendente, modelado, implementado, validado ou bloqueado com motivo. Cada afirmação de validação precisa de execução ou evidência correspondente; revisão estática é identificada como tal.

| Grupo | Verificação mínima |
|---|---|
| TS01–TS04 | Fórmulas com resultados conhecidos, tolerância de 0,01 ponto percentual para SLA, sentidos de meta e determinismo |
| TS05–TS08 | Contribuições acima/exatamente 100%, concorrência, quatro Ps incompletos, exclusão de descontinuados e 422 com saldo |
| TS09–TS11 | Dois alunos reais no banco; acesso cruzado negado por HTTP; 401 em sessão inválida/expirada; professor lê aluno, falha ao escrever e opera seu próprio ambiente |
| TS12/TS13 e RNF10 | Benchmark de 10.000 registros em até 10 segundos e cadastros/consultas em até 2 segundos; carga representativa com ao menos 40 usuários simultâneos; registrar hardware, volume, operações, erros e distribuição dos tempos |
| TS14/TS15 | Jornada completa com API/banco reais em Chrome, Edge e Firefox disponíveis, informando versões; comparar com protótipos e percorrer TechNova do login à revisão/exportação |

No benchmark, diferencie geração pura, persistência, cálculo e tempo total observável. Não meça apenas uma função vazia nem apresente somente uma média que esconda violações. Trate navegadores indisponíveis como verificação pendente; Chromium sozinho não comprova execução nos três navegadores nomeados.

Os testes de regressão devem reproduzir os defeitos antes da correção quando viável. Priorize testes de comportamento e resultados conhecidos, sem espelhar a implementação. Inclua falha intermediária no cadastro para verificar rollback e proteção do comando de teste antes de qualquer escrita.

Ao terminar cada incremento relevante, execute os checks afetados. Ao concluir cada fase, execute `npm run lint`, `npm run typecheck`, `npm test` e `npm run build` com ambiente de teste seguro, além da jornada pertinente. Quando RTK for aplicável, use o prefixo indicado nas instruções locais. Não repita verificações caras sem mudança ou motivo; não declare executado o que apenas deixou preparado.

## 10. Operação, progresso e conclusão

Prepare execução local reproduzível, build de produção, configuração de implantação e instruções de migração/seed. Não publique em nuvem, contrate serviços ou altere um ambiente externo sem autorização correspondente. Antes de pedir essa autorização, deixe o resultado local e a proposta de implantação concretos e revisáveis. RNF07 só estará validado quando a hospedagem e a janela de disponibilidade tiverem evidência; configuração pronta não comprova disponibilidade.

Quando esta spec for executada, comece por inspecionar o estado atual e registrar um checklist curto. Implemente a estabilização e prossiga pelas Fases 2–6 em incrementos. Não encerre com um plano nem volte a perguntar se deve iniciar cada fase já autorizada. Delegue subtarefas independentes quando isso reduzir tempo ou melhorar a revisão.

Atualize o progresso em `docs/alinhamento-tcc.md` para permitir retomada: última fase validada, arquivos relevantes, comandos/resultados e próximo passo. Se uma decisão externa impedir um item, continue os demais e mantenha o bloqueio visível. Não marque o projeto completo enquanto requisitos ou verificações obrigatórias permanecerem pendentes.

A entrega deve mostrar o que o aluno/professor consegue fazer, quais critérios foram verificados e quais dependem de decisão ou ambiente externo. Use atualizações curtas, com etapa atual e ação seguinte. Não substitua evidência técnica por quantidade de arquivos, tabelas, testes ou linhas escritas.

### Definição de pronto

O alinhamento funcional estará concluído quando RF01–RF13 e RN01–RN11 estiverem implementados e validados, o cenário completo funcionar com persistência real e a matriz refletir corretamente os requisitos não funcionais. O alinhamento integral só poderá ser declarado quando também existirem as evidências exigidas de desempenho, capacidade, navegadores e implantação. Qualquer exceção deve ser explícita, sem transformar um bloqueio em conclusão.
