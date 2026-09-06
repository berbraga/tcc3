# EduITSM — Visão Geral do Projeto

**TCC:** Uma ferramenta educacional de ITSM para o ensino de gestão da estratégia de serviços de TI baseado na ITIL
**Autor:** Bernardo Sachet Braga · **Orientador:** Rafael Queiroz Gonçalves, Dr.
**Instituição:** UNIVALI — Escola Politécnica — Ciência da Computação
**Área:** Engenharia de Software · **Linha:** ITSM
**Status:** TCC2 concluído (fases de Análise e Design do ADDIE + especificação da ferramenta). TCC3 em execução no 2º semestre de 2026.

Documento de apoio gerado a partir da monografia entregue à banca. Serve como briefing consolidado do projeto para orientação, apresentação e como referência de desenvolvimento na fase do TCC3.

---

## 1. Em uma frase

O projeto entrega **duas coisas indissociáveis**: uma **unidade de aprendizagem de 4 horas-aula** sobre Gestão da Estratégia de Serviço de TI segundo a ITIL 4, construída pelo modelo de design instrucional **ADDIE**, e uma **ferramenta educacional web própria, o EduITSM**, que permite ao aluno praticar esses conceitos em um ambiente parecido com o de uma organização real. A unidade organiza pedagogicamente a prática; a ferramenta é o recurso onde a prática acontece.

---

## 2. O problema

O Gerenciamento de Serviços de TI (ITSM) é competência cada vez mais exigida pelo mercado, e a **ITIL** é o framework de referência mundial (mais de 3 milhões de certificações). Dentro dela, a **gestão da estratégia de serviço** — decidir quais serviços oferecer, para quem, com que recursos, a que custo e como isso gera valor para o negócio — é o elo entre a TI e os objetivos organizacionais.

**Mas esse conteúdo não é ensinado na graduação brasileira.** Um levantamento documental feito pelo autor nas matrizes curriculares e ementas públicas de **sete IES** (UNIVALI, USP, UFSC, IME, ITA, Estácio e UNISUL) mostrou que a gestão da estratégia de serviço segundo a ITIL **não tem disciplina exclusiva, módulo específico nem carga horária dedicada em nenhum dos cursos analisados**:

| Instituição | Situação encontrada |
|---|---|
| UNIVALI (CC, Eng. Comp.) | Sem menção a ITIL/ITSM |
| USP (SI/EACH) | ITIL apenas como "podendo incluir" em disciplina **optativa** de Governança de TI |
| USP (CC/Eng. Comp.), IME, ITA | Sem menção (ITA cobre CMMI e MPS.br, não ITIL) |
| UFSC | Optativa "TI e Governança" cita "frameworks" genericamente, sem nomear ITIL |
| UNISUL (CST Gestão da TI) | ITIL dividindo uma única disciplina com COBIT, LEAN, ISO 20000 e CMMI |
| Estácio | Sem menção |

O cenário se repete fora do Brasil: a adoção de frameworks de ITSM em IES europeias fica entre **5% e 20% para ITIL** e **menos de 1% para COBIT** (Yordanov, 2022). Enquanto isso, o mercado cobra: editais de 2025 do **TCU** e da **SEFAZ-RJ** exigem ITIL v4 no conteúdo programático de cargos de TI, e o acesso a esse conhecimento se dá quase só por **certificações pagas, fora da academia**.

Há, porém, precedentes de que isso é ensinável na graduação: a **Western Governors University (EUA)** tem disciplina obrigatória dedicada ao ITIL, e a **Brandenburg University of Applied Sciences (Alemanha)** ensina ITIL 4 inclusive com gamificação.

> **Problema de pesquisa:** o Gerenciamento de Serviços de TI, especialmente a gestão da estratégia de serviço, não tem sido apropriadamente ensinado nos cursos superiores de computação, de modo a não atender às necessidades do mercado.

---

## 3. Objetivos

**Geral:** desenvolver uma ferramenta educacional para apoiar o ensino de ITSM no que tange ao processo de gestão da estratégia em cursos superiores na área de TI.

**Específicos:**

1. Levantar trabalhos correlatos sobre ensino de ITSM em cursos superiores, com foco na gestão da estratégia de serviço.
2. Analisar o estado da prática do ensino de ITIL, via análise de grades curriculares e ementas de IES brasileiras.
3. Projetar a unidade de aprendizagem pelo modelo ADDIE (conteúdo, estratégias de ensino, recursos e avaliação).
4. Especificar a ferramenta educacional (RFs, RNFs, regras de negócio, casos de uso, classes, modelo de dados, arquitetura e protótipo).
5. Desenvolver a ferramenta como aplicação web e disponibilizá-la para uso em sala de aula.
6. Aplicar e avaliar a contribuição da ferramenta para o ensino, no nível de compreensão da Taxonomia de Bloom, em uma turma real.

**Metodologia:** pesquisa **aplicada**, **exploratória** e **qualitativa**. Procedimentos: revisão bibliográfica → trabalhos correlatos → análise documental de ementas → construção da unidade pelo **ADDIE** (Análise, Design, Desenvolvimento, Implementação, Avaliação).

---

## 4. Delimitação de escopo

- A ITIL 4 tem **34 práticas**; o trabalho cobre **apenas Gerenciamento da Estratégia (Strategy Management)**.
- Público-alvo: **alunos de graduação** (CC, SI, Eng. Comp., ADS, Gestão da TI) — não profissionais buscando certificação.
- A avaliação de ferramentas de mercado é feita **sob a ótica educacional**, não como comparativo técnico exaustivo.
- O EduITSM é **recurso didático**, não produto de produção: não contempla incidentes, problemas, mudanças, configuração (CMDB), fluxos de aprovação nem integrações externas.
- A aplicação da unidade é uma **primeira iteração** de validação; aplicação em larga escala fica para trabalhos futuros.

---

## 5. Base conceitual essencial

**ITIL v3 → ITIL 4.** Na v3, a Estratégia de Serviço era a **primeira fase** de um ciclo de vida linear (portfólio, financeiro, demanda, relacionamento) e só depois vinham desenho, transição, operação e melhoria contínua. Na **v4 (2019)**, essa estrutura linear deu lugar ao **Service Value System (SVS)**: a estratégia deixa de ser fase isolada e passa a permear continuamente as práticas — Gerenciamento da Estratégia, de Portfólio, de Relacionamento e Financeiro de Serviços.

**Os 4 Ps da estratégia** (elemento conceitual central do trabalho):

| P | O que registra |
|---|---|
| **Perspectiva** | A visão e o propósito: quem a organização quer ser |
| **Posição** | A diferenciação competitiva escolhida |
| **Plano** | Como a visão vira ação — prazos, investimento, fases |
| **Padrão** | A consistência das decisões ao longo do tempo |

**Design Instrucional e ADDIE.** O DI é a ação intencional de planejar, desenvolver e aplicar situações didáticas (Filatro, 2008). O **ADDIE** estrutura esse processo em cinco fases. As competências da unidade foram redigidas com base na **Taxonomia de Bloom**, progredindo por Compreensão → Análise → Criação, de modo que a avaliação consiga verificar cada nível separadamente.

---

## 6. Por que uma ferramenta própria

Foram avaliadas quatro ferramentas de ITSM de mercado — **Jira Service Management, ServiceNow, Freshservice e GLPI** — escolhidas por três critérios: presença recorrente na literatura correlata, relevância de mercado (Gartner MQ 2025 para o ServiceNow, Forrester Wave 2025 para o JSM) e aderência aos requisitos funcionais da prática.

**Resultado da avaliação:** nenhuma atende integral e nativamente aos sete requisitos. O ponto crítico é o **RF05 — registro dos 4 Ps**: nenhuma das quatro oferece campo dedicado para o elemento conceitual central da prática. ServiceNow cobre seis dos sete (falta o RF05); JSM e Freshservice exigem customização para RF02/RF04 e RF05; GLPI não atende nativamente os dois mais centrais (RF04 e RF05).

**Três limitações pedagógicas adicionais** selaram a decisão:

1. **Excesso de funcionalidades** — ferramentas que cobrem 34 práticas expõem o aluno a um volume incompatível com 4 horas de aula.
2. **Barreira de acesso** — versões completas são pagas; as gratuitas limitam usuários e recursos, inviabilizando uma turma inteira.
3. **Ausência de dados de operação** — sem histórico de chamados, SLA e satisfação, o RF07 (cômputo de indicadores) não pode ser exercitado, e alimentar isso manualmente consumiria o tempo de aula destinado à análise estratégica.

Daí o **EduITSM**: escopo deliberadamente restrito, exatamente os requisitos necessários, e um **motor de simulação** que resolve o problema dos dados operacionais.

---

## 7. A unidade de aprendizagem

**Tema:** Gestão da Estratégia de Serviço de TI segundo o ITIL 4 · **Carga horária:** 4 horas-aula · **Modalidade:** presencial ou remota · **Pré-requisitos:** noções básicas de TI e organização empresarial (aplicável a partir da metade do curso).
**Disciplinas hospedeiras:** Gestão de TI, Governança de TI, Engenharia de Software, Administração de SI — **sem exigir reestruturação curricular**.

### Conteúdo programático

| Bloco | Conteúdo | Duração |
|---|---|---|
| 1 | Introdução à Estratégia de Serviço na ITIL 4: SVS, princípios orientadores, papel da estratégia na cadeia de valor | 45 min |
| 2 | Gerenciamento da Estratégia: propósito, conceitos e atividades; avaliação de ambiente interno/externo; direção estratégica de TI; geração de valor | 60 min |
| 3 | A prática em contextos organizacionais; alinhamento TI × negócio; avaliação e revisão contínua. **Demonstração do EduITSM** | 60 min |
| 4 | **Atividade prática:** estudo de caso integrado — analisar um cenário e propor decisões estratégicas usando a ferramenta | 75 min |

### Competências (Taxonomia de Bloom)

- **Compreender** o papel da gestão da estratégia dentro do SVS da ITIL 4.
- **Explicar** propósito, conceitos e atividades da prática.
- **Analisar** um cenário organizacional e identificar como a prática se aplica.
- **Propor** decisões estratégicas sobre serviços de TI.

### Estratégias de ensino

Aulas expositivas dialogadas (Blocos 1–3), atividades em grupo de 4–5 alunos (fim dos Blocos 2 e 3), demonstração da ferramenta pelo professor (Bloco 2) e **estudo de caso integrado** com apresentação dos grupos (Bloco 4).

### Avaliação

- **Formativa:** observação da participação nas atividades em grupo e na apresentação do estudo de caso.
- **Somativa/percepção:** questionário final com parte objetiva (compreensão dos conceitos) e parte aberta (relevância, clareza, qualidade dos materiais, sugestões) — insumo da fase de Avaliação do ADDIE.
- No TCC3: **pré-teste e pós-teste** com o mesmo instrumento, para medir ganho de aprendizagem.

### Cenário-fio-condutor: TechNova Retail

Todo o material usa o mesmo caso fictício — e-commerce varejista perdendo vendas institucionais por não ter portal B2B com aprovação de crédito automatizada. O **Portal de Vendas Corporativas (B2B)** é o serviço modelado ponta a ponta: 4 Ps preenchidos, objetivo estratégico ("expandir atuação corporativa e aumentar receita bruta em 20%"), demanda esperada (500 clientes, 10.000 transações/mês), CAPEX de R$ 150 mil, OPEX de R$ 15 mil/mês, indicadores de SLA (meta 99,9%) e de vendas faturadas (meta R$ 2 milhões em 6 meses). O mesmo cenário aparece no Quadro 13, no protótipo de interface e no estudo de caso do Bloco 4.

---

## 8. A ferramenta EduITSM

### 8.1 Visão geral

Aplicação **web, acessada por navegador, sem instalação local**. Dois perfis:

- **Aluno** — possui sua própria **organização fictícia**, um ambiente de trabalho isolado onde registra a análise de ambiente, formula a estratégia, cadastra o portfólio, vincula serviços a objetivos, define indicadores e consulta resultados.
- **Professor** — mesmas permissões no próprio ambiente (usado na demonstração do Bloco 2) e, adicionalmente, **acesso somente leitura** aos ambientes dos alunos para acompanhar e avaliar o Bloco 4.

O que viabiliza tudo é o **motor de simulação**: em vez de o aluno digitar dados de operação, a ferramenta gera registros operacionais fictícios (chamados, tempo de atendimento, cumprimento de SLA, notas de satisfação) a partir de um **cenário configurável com semente**. Os indicadores definidos pelo aluno são calculados sobre esses registros, o que permite à aula avançar rapidamente da formulação da estratégia para a **avaliação** — que é onde o ciclo contínuo da ITIL 4 se manifesta.

**Fora de escopo, intencionalmente:** incidentes, problemas, mudanças, configuração, CMDB, fluxos de aprovação e integrações externas. Cada tela corresponde a uma atividade da prática de Gerenciamento da Estratégia.

### 8.2 Requisitos funcionais

**Núcleo — derivados da prática (RF01–RF07):**

| Código | Requisito | Prática relacionada |
|---|---|---|
| RF01 | Cadastrar portfólio de serviços | Gerenciamento de Portfólio |
| RF02 | Registrar custos e orçamento (CAPEX/OPEX) | Gerenciamento Financeiro |
| RF03 | Registrar demanda e capacidade | Gerenciamento de Demanda |
| **RF04** | **Vincular serviço a objetivo estratégico do negócio** | Gerenciamento da Estratégia |
| **RF05** | **Registrar os 4 Ps (Perspectiva, Posição, Plano, Padrão)** | Gerenciamento da Estratégia |
| RF06 | Definir indicadores de desempenho por serviço | Gerenciamento da Estratégia |
| RF07 | Computar indicadores a partir de dados operacionais | Gerenciamento da Estratégia |

> **RF04 é o requisito central do trabalho** — é ele que conecta a ferramenta ao tema. RF01–RF03 alimentam a decisão estratégica; RF05 torna os conceitos visíveis; RF06 e RF07 fecham o ciclo com medição e melhoria contínua.

**Complementares — viabilizam o uso em turma (RF08–RF13):**

| Código | Requisito |
|---|---|
| RF08 | Autenticar usuários e distinguir perfis Aluno/Professor |
| RF09 | Manter ambiente de trabalho isolado (organização fictícia por usuário) |
| RF10 | Registrar a análise de ambiente (forças, fraquezas, oportunidades, ameaças) |
| **RF11** | **Gerar dados operacionais simulados** a partir de cenário configurável |
| RF12 | Acompanhar os ambientes dos alunos (professor, somente leitura) |
| RF13 | Exportar relatório da estratégia (4 Ps + portfólio + vínculos + indicadores) |

> **RF11 é o que viabiliza o RF07.** Sem origem de dados operacionais, o cômputo automático não pode ser demonstrado — foi exatamente essa ausência que inviabilizou as ferramentas comerciais numa aula de 4 horas.

### 8.3 Requisitos não funcionais

| Código | Categoria | Requisito |
|---|---|---|
| RNF01 | Usabilidade | Vocabulário da ITIL 4; qualquer tarefa alcançável em **no máximo 3 níveis de navegação** |
| RNF02 | Desempenho | Cadastro/consulta em até **2 s**; geração de **10.000 registros em até 10 s** |
| RNF03 | Compatibilidade | Chrome, Edge e Firefox atuais, sem instalação local |
| RNF04 | Portabilidade | Navegador em desktop/notebook, layout a partir de **1024 px** |
| RNF05 | Segurança | Senhas com **hash bcrypt**; autenticação por **JWT** com expiração |
| RNF06 | Isolamento de dados | Aluno não acessa ambiente de outro aluno; leitura ampliada só para Professor |
| RNF07 | Disponibilidade | Hospedagem em nuvem, disponível durante toda a janela de aplicação |
| RNF08 | Manutenibilidade | Git, código em camadas, **testes automatizados** nas rotinas de cálculo |
| RNF09 | Idioma | Português brasileiro, com o termo original em inglês entre parênteses |
| RNF10 | Capacidade | Ao menos **40 usuários simultâneos** (tamanho de turma) |
| RNF11 | Rastreabilidade | Histórico de **versões da estratégia**, para demonstrar a evolução em aula |

### 8.4 Regras de negócio

As RNs têm papel **pedagógico além do técnico** — elas obrigam o aluno a praticar o conceito correto.

| Código | Regra |
|---|---|
| RN01 | Cada usuário possui exatamente uma organização ativa |
| **RN02** | A estratégia só é **completa** com os **4 Ps preenchidos** (bloqueia a exportação) |
| RN03 | Toda alteração na estratégia gera **nova versão**, preservando as anteriores |
| RN04 | Serviço só recebe indicadores após estar cadastrado no portfólio |
| RN05 | Relação N:N entre serviço e objetivo; **todo vínculo exige justificativa de valor** |
| RN06 | A soma das contribuições dos serviços de um mesmo objetivo **não pode exceder 100%** |
| RN07 | Serviços **Descontinuados** não recebem medições nem entram no cálculo |
| RN08 | Todo indicador exige **meta** e **sentido** (maior-melhor / menor-melhor) |
| RN09 | Dados operacionais vêm só do motor de simulação, com **semente** → resultados **reprodutíveis** entre grupos |
| **RN10** | Serviço **sem vínculo estratégico é sinalizado como pendência** — pela ITIL 4, todo serviço deve demonstrar valor |
| RN11 | Professor tem acesso **somente leitura** aos ambientes dos alunos |

### 8.5 Casos de uso e rastreabilidade

Quatorze casos de uso, com **generalização de atores**: o ator `Usuário` concentra os casos comuns, e `Aluno` e `Professor` herdam. O único exclusivo é o acompanhamento dos ambientes (Professor).

| RF | Caso de uso | Entidade principal | Tela |
|---|---|---|---|
| RF01 | UC06 — Manter portfólio de serviços de TI | `servico` | T06 — Portfólio de serviços |
| RF02 | UC07 — Registrar custos e orçamento | `custo_servico` | T08 — Custos e orçamento |
| RF03 | UC08 — Registrar demanda e capacidade | `demanda_capacidade` | T09 — Demanda e capacidade |
| RF04 | UC09 — Vincular serviço a objetivo estratégico | `vinculo_estrategico` | T10 — Vínculo estratégico |
| RF05 | UC04 — Definir estratégia de serviço (4 Ps) | `estrategia_servico` | T04 — Estratégia (4 Ps) |
| RF06 | UC10 — Definir indicadores de desempenho | `indicador` | T11 — Indicadores do serviço |
| RF07 | UC12 — Consultar painel de indicadores | `medicao` | T13 — Painel de indicadores |
| RF08 | UC01 — Autenticar-se no sistema | `usuario` | T01 — Login |
| RF09 | UC02 — Manter organização | `organizacao` | T02 — Painel inicial |
| RF10 | UC03 — Registrar análise de ambiente | `analise_ambiente` | T03 — Análise de ambiente |
| RF11 | UC11 — Gerar dados operacionais simulados | `registro_operacional`, `cenario_simulacao` | T12 — Cenário de simulação |
| RF12 | UC14 — Acompanhar ambientes dos alunos | `organizacao` | T15 — Acompanhamento de alunos |
| RF13 | UC13 — Exportar relatório da estratégia | `estrategia_servico` | T14 — Relatório da estratégia |

### 8.6 Ciclo contínuo da estratégia (fluxo de uso)

O diagrama de atividade **não tem encerramento linear** — é um ciclo, refletindo a mudança conceitual da v3 para a v4:

1. **Analisar o ambiente** — forças, fraquezas, oportunidades e ameaças (UC03).
2. **Definir a direção estratégica** — registrar os 4 Ps e cadastrar os objetivos estratégicos (UC04, UC05).
3. **Desenhar o serviço** — criar o serviço, inserir no portfólio, associar custos, demanda e público-alvo (UC06–UC08).
4. **Operar o serviço** — representado na ferramenta pela geração dos registros operacionais (UC11).
5. **Medir e avaliar** — apurar indicadores sobre os registros e analisar o valor gerado (UC10, UC12).
6. **Decidir melhoria** — metas atingidas → melhoria contínua e novo ciclo; metas não atingidas → volta imediata à análise de ambiente para redefinir a rota.

Esse fluxo é também a **ordem das telas** do protótipo: o aluno percorre a ferramenta na mesma sequência em que percorre o ciclo estratégico.

### 8.7 Modelagem de dados

Treze classes de domínio, organizadas em torno de `Organizacao` (o ambiente de trabalho de cada usuário). **Três decisões de modelagem** são deliberadas:

1. **`EstrategiaServico` como entidade própria**, com os 4 Ps e um atributo de versão — é ela que materializa o RF05, o requisito que nenhuma ferramenta comercial atende.
2. **`VinculoEstrategico` como classe associativa** entre `Servico` e `ObjetivoEstrategico`, carregando a **justificativa de valor** e o **percentual de contribuição** — sem ela o RF04 perderia justamente a informação que demonstra a geração de valor.
3. **Separação entre `RegistroOperacional` e `Medicao`** — o primeiro guarda o dado bruto gerado pela simulação, o segundo o valor já calculado de um indicador num período; distingue com clareza **dado de origem** e **resultado do cômputo** (RF07).

**Dicionário de dados (13 tabelas, PostgreSQL, notação pé-de-galinha):**

| Tabela | Finalidade | Principais atributos |
|---|---|---|
| `usuario` | Usuários e perfil de acesso | id, nome, email, senha_hash, perfil, criado_em |
| `organizacao` | Ambiente de trabalho fictício de cada usuário | id, usuario_id, nome, setor, descricao, criada_em |
| `analise_ambiente` | Itens da avaliação de ambiente interno/externo | id, organizacao_id, tipo, categoria, descricao, impacto |
| `estrategia_servico` | Os 4 Ps e o controle de versões | id, organizacao_id, perspectiva, posicao, plano, padrao, versao, atualizada_em |
| `objetivo_estrategico` | Objetivos estratégicos do negócio | id, organizacao_id, codigo, descricao, prazo, status |
| `servico` | Portfólio de serviços de TI | id, organizacao_id, nome, descricao, publico_alvo, status, criado_em |
| `custo_servico` | Investimento inicial e custo operacional | id, servico_id, tipo, valor_previsto, valor_realizado, periodo |
| `demanda_capacidade` | Demanda prevista e capacidade instalada | id, servico_id, periodo, demanda_prevista, capacidade_instalada, unidade |
| `vinculo_estrategico` | Liga serviço e objetivo, com justificativa de valor | id, servico_id, objetivo_id, justificativa_valor, contribuicao |
| `indicador` | Indicadores por serviço e sua meta | id, servico_id, objetivo_id, nome, tipo, unidade, meta, sentido |
| `medicao` | Valor apurado por período de referência | id, indicador_id, periodo_ref, valor, origem |
| `cenario_simulacao` | Parametriza a geração de dados fictícios | id, organizacao_id, semente, periodo_inicio, periodo_fim, volume_registros, perfil |
| `registro_operacional` | Registros de operação gerados pela simulação | id, servico_id, cenario_id, data_abertura, data_fechamento, tempo_atendimento_min, sla_cumprido, nota_satisfacao |

O **isolamento do RNF06 é garantido estruturalmente**: toda consulta parte de `organizacao`, que pertence a um único `usuario`.

### 8.8 Arquitetura e stack

**Três camadas:** SPA no navegador → servidor Node.js expondo API REST (regras de negócio, autenticação, motor de simulação, cálculo de indicadores) → PostgreSQL.
**Implantação em três nós:** computador do usuário (navegador) · servidor de aplicação em nuvem (Node.js, HTTPS/443) · servidor de banco em nuvem (PostgreSQL, TCP/5432 cifrado).

A **separação entre motor de simulação e módulo de cálculo de indicadores** é intencional: permite testar o cálculo independentemente da geração (RNF08) e reproduz na arquitetura a mesma distinção conceitual entre *dado de operação* e *indicador estratégico* que a aula ensina.

| Camada / Finalidade | Tecnologia | Justificativa |
|---|---|---|
| Interface | React + TypeScript | Amplamente adotada; tipagem estática reduz erros |
| Navegação | React Router | Telas do fluxo estratégico em rotas independentes (RNF01) |
| Comunicação | Axios + TanStack Query | Padroniza chamadas e estado das requisições |
| Servidor | Node.js + Express | Mesma linguagem do front; tipos compartilhados |
| Autenticação | JWT + bcrypt | Atende ao RNF05 |
| Acesso a dados | Prisma (ORM) | Tipos a partir do esquema + migrações (RNF08) |
| Banco | PostgreSQL | Relacional, gratuito, consolidado |
| Testes | Vitest | Cobre cálculo de indicadores e geração simulada (RNF08) |
| Versionamento/hospedagem | Git + nuvem | Atende RNF07 e RNF08 |

**API REST** (`/api/v1/...`): rotas de autenticação (`/auth/registro`, `/auth/login`), organização (`/organizacoes/minha`), análise de ambiente, estratégia (`/estrategia`, com versionamento), objetivos, serviços, custos, demanda, vínculos, indicadores, cenários de simulação e relatório. Todas, exceto autenticação, exigem JWT válido e operam **exclusivamente sobre a organização do usuário autenticado** (RNF06). Detalhamento completo no Apêndice A da monografia.

### 8.9 Protótipo de interface

**Quinze telas**, agrupadas em três blocos de menu — **Estratégia, Portfólio e Avaliação** — reproduzindo o ciclo do diagrama de atividade. Quatro telas materializam os requisitos centrais:

- **T04 — Estratégia (4 Ps)** [RF05]: quatro campos, cada um com indicação do significado conceitual ao lado do rótulo, para que a própria interface reforce o conteúdo. O rodapé mostra a versão vigente e quantos objetivos estão alinhados.
- **T06 — Portfólio de serviços** [RF01–RF03]: a **coluna de alinhamento** é o elemento pedagógico — serviços sem vínculo aparecem como **pendência** (RN10).
- **T10 — Vínculo estratégico** [RF04]: exige justificativa de valor e percentual de contribuição, e mostra como a cobertura do objetivo muda. É aqui que o aluno é **obrigado a formular por que um serviço de TI existe do ponto de vista do negócio**.
- **T13 — Painel de indicadores** [RF06, RF07]: apuração automática sobre os registros simulados, com destaque para os que não atingiram a meta e um botão que conduz de volta à revisão da estratégia — **fechando o ciclo contínuo** na própria navegação.

### 8.10 Plano de testes

Quatro níveis: **unitário** (cálculo e regras), **integração** (API e isolamento), **desempenho** (RNF02) e **aceitação** (percurso completo do estudo de caso). Quinze casos, TS01–TS15.

A prioridade recai sobre o **cálculo dos indicadores** e a **reprodutibilidade do motor de simulação (TS04 / RN09)** — o motivo é pedagógico antes de técnico: se dois grupos gerarem cenários com a mesma semente e obtiverem resultados diferentes, a discussão em sala perde o referencial comum e o Bloco 4 fica comprometido.

Destaques: TS05 (soma de contribuições > 100% é recusada), TS06 (4 Ps incompletos bloqueiam a exportação), TS08 (API responde 422 informando a contribuição disponível), TS09 (403 em acesso cruzado entre organizações), TS11 (Professor não altera ambiente de aluno), TS12 (10.000 registros em ≤ 10 s), **TS15 (ensaio da aula na véspera, de ponta a ponta, sem intervenção técnica** — integra o plano de contingência do risco de indisponibilidade).

---

## 9. Entregáveis do trabalho

| Entregável | Formato |
|---|---|
| Plano de ensino da unidade | PDF |
| Slides da aula (Blocos 1–3) | PPTX/PDF |
| Texto de apoio | PDF |
| Roteiro das atividades em grupo | PDF |
| Estudo de caso integrado (Bloco 4) | PDF |
| Questionário de avaliação (pré e pós-teste) | Forms |
| Guia do professor | PDF |
| **Ferramenta EduITSM implantada** (13 RFs, contas da turma) | Aplicação web (URL) |
| **Código-fonte** (schema, testes, instruções) | Repositório Git |
| Manual de uso da ferramenta | PDF |

---

## 10. Situação e próximas etapas (TCC3)

**Concluído no TCC2:** fundamentação teórica, trabalhos correlatos (10 estudos — nenhum reúne simultaneamente foco na gestão da estratégia **e** aplicação em cursos superiores de computação), análise do estado da prática nas 7 IES, fases de **Análise** e **Design** do ADDIE, e a **especificação completa da ferramenta**.

**A executar no 2º semestre de 2026:**

| Fase ADDIE | Período | Atividades |
|---|---|---|
| **Desenvolvimento** | jul–ago/2026 | Produzir todos os materiais didáticos; **implementar o EduITSM** (interface, API, banco, motor de simulação, testes automatizados); redigir manual e guia do professor |
| Testes e implantação | set/2026 | Validação funcional, correção de defeitos, deploy em nuvem, criação das contas da turma |
| **Implementação** | set–out/2026 | Contato com professores de Eng. de Software / desenvolvimento; **pré-teste**; aplicação em turma real; observação; **pós-teste** com perguntas abertas |
| **Avaliação** | out–nov/2026 | Comparar pré e pós-teste (ganho de aprendizagem no nível de Compreensão da Taxonomia de Bloom); analisar respostas abertas; propor ajustes |
| Redação final | nov–dez/2026 | Capítulos de Resultados, Discussão e Conclusão; revisão ABNT |

**Riscos e atenções para o TCC3:**

- **Disponibilidade da ferramenta no dia da aula** — mitigada pelo teste de aceitação TS15 executado como ensaio na véspera.
- **Acesso a turma real** — depende do contato com professores; é o gargalo do cronograma de setembro.
- **Infraestrutura da instituição** — laboratório com navegador e internet para até 40 alunos simultâneos (RNF10).
- **Contas pré-criadas com ambiente inicializado** para cada aluno, para não gastar tempo de aula com cadastro.

---

## 11. Diagramas disponíveis

Os artefatos de modelagem estão na pasta `diagramas/`:

| Arquivo | Conteúdo |
|---|---|
| `im02_casos_de_uso.png` | Diagrama de casos de uso (14 UCs, generalização de atores) |
| `im03_atividade.png` | Ciclo contínuo da estratégia de serviço |
| `im04_classes.png` | Diagrama de classes (13 classes de domínio) |
| `im05_mer.png` | Modelo entidade-relacionamento (13 tabelas) |
| `im05_seq_uc09.png` | Sequência — UC09 Vincular serviço a objetivo (validação da RN06) |
| `im06_arquitetura.png` | Arquitetura em três camadas |
| `im06_seq_uc11.png` | Sequência — UC11 Gerar dados operacionais simulados |
| `im07_navegacao.png` | Mapa de navegação das 15 telas |
| `im08_tela_estrategia_4ps.png` | Tela T04 — Estratégia (4 Ps) |
| `im09_implantacao.png` | Diagrama de implantação (3 nós) |
| `im09_tela_portfolio.png` | Tela T06 — Portfólio de serviços |
| `im10_tela_vinculo.png` | Tela T10 — Vínculo estratégico |
| `im11_tela_painel.png` | Tela T13 — Painel de indicadores |

---

## 12. O argumento do trabalho, em quatro passos

1. **Existe uma lacuna comprovada** — a gestão da estratégia de serviço segundo a ITIL não é ensinada em nenhuma das 7 IES brasileiras analisadas, enquanto o mercado a exige em editais e processos seletivos.
2. **A lacuna é preenchível sem reforma curricular** — uma unidade de 4 horas cabe dentro de disciplinas já existentes, e há precedentes internacionais (WGU, Brandenburg).
3. **Ensinar o conceito exige praticá-lo, e nenhuma ferramenta de mercado permite isso em 4 horas** — nenhuma das quatro avaliadas registra os 4 Ps nativamente, todas trazem excesso de funcionalidades, barreiras de licenciamento e ausência de dados de operação.
4. **Daí o EduITSM** — escopo restrito a uma prática, cada tela correspondendo a uma atividade da prática, e um motor de simulação que entrega os dados operacionais que faltavam, permitindo ao aluno percorrer o ciclo estratégico inteiro — formular, alinhar, medir e revisar — dentro do tempo de uma aula.

---

*Documento gerado a partir de `TCC_2_BernardoBraga_banca.docx` (versão da banca, junho/2026).*
