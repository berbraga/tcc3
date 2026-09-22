# Ajustes documentais propostos — TCC3

Este arquivo registra somente divergências acadêmicas encontradas ao alinhar o
software. Ele não altera a monografia nem afirma validação pedagógica.

| Seção/Quadro | Problema observado | Redação proposta | Impacto no código |
|---|---|---|---|
| 4.3.5.5 e TS01 | A expressão “disponibilidade (SLA)” convive com o campo `slaCumprido`, que mede cumprimento de atendimento e não tempo de atividade. | “O EduITSM calcula cumprimento de SLA como percentual de registros elegíveis com `slaCumprido=true`. Disponibilidade temporal requer intervalos observados de indisponibilidade e fórmula própria.” | Painel e relatório usam “Cumprimento de SLA”; TS01 permanece bloqueado para uptime. |
| Quadro 13 e 4.3.5.5 | Uptime, faturamento e crescimento são fontes do cenário empresarial fictício, mas não há campos/fórmulas para medi-los no EduITSM. | “CUSTO e RECEITA só são calculados quando houver fonte financeira, período, denominador e fórmula formalizados. Metas e contribuições estratégicas não são faturamento.” | Sem medição fabricada de receita; custo previsto/realizado continua lançamento financeiro, não indicador apurado. |
| Quadro 27 / cadastro | O quadro menciona perfil no cadastro, enquanto cadastro público com perfil Professor permitiria elevação de privilégio. | “O cadastro público cria exclusivamente Aluno e sua organização. Professor é provisionado por seed ou processo controlado.” | `POST /auth/registro` ignora elevação de perfil; conta local de professor está documentada. |
| UC09 / T10 | O seletor de indicador do vínculo exige evidência persistente, mas a associação não constava no modelo inicial. | “Vínculo estratégico pode referenciar um indicador opcional; novos vínculos exigem indicador do mesmo serviço e objetivo quando o indicador tiver objetivo.” | Migração incremental nullable `VinculoEstrategico.indicadorId`; vínculos legados ficam nulos sem associação automática. |
| Estado da implementação | Texto histórico descreve somente a fundação/Fase 1 e pode ser lido como estado atual. | “Atualizar o estado para listar módulos efetivamente implementados, comandos executados e pendências de evidência externa, sem alegar aplicação com alunos.” | `docs/alinhamento-tcc.md` e `docs/rastreabilidade.md` distinguem implementado, validado e pendente. |

## Decisões que dependem de revisão acadêmica

1. Para liberar TS01 como disponibilidade temporal, definir eventos de
   indisponibilidade, período observado, timezone, denominador e arredondamento.
2. Para calcular RECEITA, definir origem, período, unidade, dados ausentes e
   fórmula. Não usar R$ 2 milhões, 20%, 35% ou volume de atendimentos como
   substitutos.
