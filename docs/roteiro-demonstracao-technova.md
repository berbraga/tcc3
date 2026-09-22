# Roteiro de demonstração — TechNova Retail

Este roteiro usa a API, PostgreSQL e SPA reais. Nenhuma etapa exige edição
manual do banco. Os dados iniciais do seed são apenas contexto didático: não
incluem cenário executado, registros operacionais nem medições.

## Pré-condições

1. Na raiz, inicie PostgreSQL e aplique as migrações: `docker compose up -d` e `npm run db:deploy`.
2. Popule somente a demonstração local: `NODE_ENV=development EDUITSM_DEMO_SEED=true npm run db:seed`.
3. Inicie a API e a SPA com `npm run dev`, abra `http://localhost:5173` e entre como aluno:

| Perfil | E-mail | Senha |
|---|---|---|
| Aluno TechNova | `aluno@eduitsm.local` | `EduITSM@2026` |
| Professor | `professor@eduitsm.local` | `EduITSM@2026` |

O seed deixa o **Portal de Vendas Corporativas (B2B)** em **Em desenho**. Ele
tem CAPEX planejado de R$ 150.000 em `2026-01`, OPEX planejado de R$ 15.000 em
`2026-01`, 500 clientes no primeiro semestre (referência `2026-06`) e 10.000
transações por mês (referência `2026-01`). Esses números são planejados; não
representam gasto realizado, receita realizada ou resultado de simulação.

## Jornada do aluno

1. Em **T02 · Painel inicial**, confira a organização TechNova Retail e as pendências reais. Em **T03**, registre uma força, fraqueza, oportunidade e ameaça; uma força/fraqueza deve ser interna e oportunidade/ameaça externa.
2. Em **T04 · Estratégia (4 Ps)**, confira Perspectiva, Posição, Plano e Padrão. O padrão descreve o segundo projeto consecutivo de automação concluído em menos de um ano. Para demonstrar o bloqueio, apague temporariamente um P, salve e tente exportar o relatório: a API responde 422. Restaure o valor e salve; a versão anterior permanece no histórico.
3. Em **T05 · Objetivos estratégicos**, use `OE-01`: ampliar atuação corporativa e aumentar a receita em 20% no próximo ano fiscal. Essa é uma meta, não uma receita apurada.
4. Em **T06 · Serviços**, abra o Portal B2B. Em custos e demanda, confira os dois períodos/unidades sem somar CAPEX e OPEX, nem converter clientes em transações.
5. Em **T11 · Indicadores**, consulte o indicador já criado pelo seed para o Portal B2B: **Tempo médio de atendimento**, meta de 15 minutos e sentido **Menor é melhor**. Em **T10 · Vínculos**, consulte a tabela: o seed já registra o vínculo do Portal com `OE-01`, sua justificativa, esse indicador, contribuição de 35% e saldo disponível de 65%. Não recrie esse vínculo.

## Exercícios conferíveis

1. Crie outro serviço e, em **T11**, crie antes um indicador compatível com `OE-01` para esse segundo serviço. Em **T10**, use o formulário para vinculá-los com contribuição de 70%. A operação deve falhar com 422 e informar saldo de 65%, pois o total pretendido seria 105%. Os valores do formulário permanecem disponíveis para correção.
2. No mesmo formulário, corrija a contribuição do segundo serviço para 65%. A operação deve retornar 201 e ser exibida na tabela: 35% + 65% = 100%. Isso representa alocação de contribuição, não comprovação de aumento de receita.
3. Use a amostra didática independente `8, 12, 15, 20 e 25` minutos. A soma é 80 e a média aritmética é 16 minutos. Contra a meta de até 15 minutos, com sentido menor-melhor, o resultado é **abaixo da meta**. A amostra é explicativa e não cria uma medição no painel.
4. Em T06, altere o Portal B2B de **Em desenho** para **Em operação**. Em **T12 · Cenário de simulação**, selecione-o, informe período, semente, volume e perfil, e execute. Em **T13**, leia serviço, cenário, período, unidade, meta, sentido e situação antes de usar **Revisar estratégia**. A revisão cria uma nova versão e preserva a anterior; ela propõe investigação, não causalidade comercial.

## Relatório e professor

1. Em **T14 · Relatório da estratégia**, confira a prévia HTML com os quatro Ps, objetivos, portfólio, vínculos, indicador e a origem simulada de uma medição quando houver cenário. Exporte o PDF somente com os quatro Ps completos.
2. Saia e entre como professor. Em **T15 · Acompanhamento de alunos**, abra TechNova Retail. A consulta é somente leitura: estratégia, serviços, custos, demanda, vínculos, indicadores e resultados ficam visíveis; ações de escrita são recusadas pelo servidor. Retorne ao próprio ambiente pelo menu para continuar editando a demonstração do professor.

## Perguntas didáticas esperadas

1. **Por que o portal apoia o objetivo corporativo?** Porque reduz etapas manuais e sustenta a jornada de compra B2B; a justificativa e os 35% tornam essa hipótese explícita.
2. **Por que a meta de atendimento não foi atingida?** A média conhecida é 16 minutos, maior que a meta máxima de 15 minutos; é necessário investigar as causas operacionais.
3. **Por que 35% não comprova aumento de receita?** Percentual de contribuição é uma atribuição estratégica. Não é faturamento medido nem demonstra causalidade comercial.
