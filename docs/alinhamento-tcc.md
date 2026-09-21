# Alinhamento TCC3–código

## Fonte, escopo e estado

- Fonte prioritária: TCC_3_BernardoBraga_final_sem_revisoes.docx, recuperado apenas para leitura do commit histórico local 4d2fc17, pois não está neste checkout.
- Referências auxiliares consultadas: EduITSM_Visao_Geral_do_Projeto.md, telas/, diagramas_uml/ e diagramas/. Nenhum desses artefatos foi alterado.
- Escopo entregue: fundação e Fases 2–6 previstas no TCC3, sem helpdesk, incidentes, CMDB, cobrança, turmas ou integrações externas.
- Matriz completa: docs/rastreabilidade.md. Validado é evidência executada; pendente e bloqueado não são contados como requisito concluído.

## Incrementos concluídos

| Etapa | Commits | Resultado verificável |
|---|---|---|
| Fundação | 0cb6922, f10b56d, 58d6be8, 3276e21 | ambiente raiz, proteção pré-Prisma, seed idempotente, login/sessão/401/saída reativos |
| Estratégia e portfólio | a713894, bdf377f, 7d73505 | SWOT, quatro Ps, objetivos, serviços, custos, demanda, vínculos e indicadores isolados |
| Simulação e painel | 7d2a68f, 2dab209 | cenário determinístico, medições por cenário e painel com metadados |
| Relatório e professor | 22cf7a3, 653bb3e | relatório HTML com 422 e supervisão somente leitura do aluno |
| Jornada e operação | f4ec4b6, e6dfdfe | TS14/TS15 Firefox/Chrome; benchmark; Compose, CORS, Tailscale e container |

## Decisões que limitam alegações

1. slaCumprido só permite **cumprimento de SLA**, não disponibilidade/uptime. TS01 está bloqueado até existir dado e fórmula temporal.
2. CUSTO e RECEITA não têm fonte/fórmula no TCC3. Permanecem sem cálculo e sem resultados fabricados.
3. O professor usa seu JWT para leitura de alunos; escrita no alvo é 403 e rotas normais preservam edição própria.
4. Teste, E2E e benchmark exigem URL descartável validada antes de Prisma, migração, seed ou cleanup.

## Verificação final

Comandos executados no topo de feat/tcc3-alignment em 21/09/2026: lint e typecheck sem erros; npm test com 129 testes de API e 57 da web aprovados; build aprovado; npm run test:e2e com 4 testes aprovados em 26,5 s; npm audit offline com 0 vulnerabilidades.

    npm run lint
    npm run typecheck
    npm test
    npm run build
    npm run test:e2e
    npm audit --omit=dev --offline
    git diff --check
    git status --short

## Pendências explícitas

- Microsoft Edge não está instalado; TS14/RNF03 continuam pendentes.
- Inspeção humana de teclado, foco, contraste e layout em 1024/1440 px continua pendente; axe em JSDOM não mede contraste.
- RNF07 exige nuvem e disponibilidade durante a aula; nenhuma implantação externa foi autorizada ou executada.
- TS01 exige disponibilidade/uptime. Proposta: armazenar início/fim de indisponibilidade por serviço e calcular (tempo do período - indisponibilidade) / tempo do período × 100, sem reutilizar slaCumprido.

## Próxima ação de retomada

Instalar Microsoft Edge e executar npm run test:e2e -- --project=edge; depois realizar o roteiro manual de acessibilidade em 1024 e 1440 px e registrar somente evidências observadas.
