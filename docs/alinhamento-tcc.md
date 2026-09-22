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
| Exemplos, vínculo e PDF | c08089c, 06991ba, 85711a8, 23dc028, 6383b15 | indicador persistido no vínculo, TechNova com 35/70/65 e fixture de média 16, PDF paginado e legível |

## Decisões que limitam alegações

1. slaCumprido só permite **cumprimento de SLA**, não disponibilidade/uptime. TS01 está bloqueado até existir dado e fórmula temporal.
2. CUSTO e RECEITA não têm fonte/fórmula no TCC3. Permanecem sem cálculo e sem resultados fabricados.
3. O professor usa seu JWT para leitura de alunos; escrita no alvo é 403 e rotas normais preservam edição própria.
4. Teste, E2E e benchmark exigem URL descartável validada antes de Prisma, migração, seed ou cleanup.
5. Vínculo legado preserva `indicadorId = null`; novos vínculos exigem indicador coerente. A associação não é inferida durante a migração.
6. A prévia HTML é complementar; o arquivo principal é `relatorio-estrategia.pdf`, validado por parser com texto extraível, acentos e páginas.

## Verificação da etapa exemplos, PDF e vínculo

Os comandos abaixo foram executados no topo de `feat/tcc3-exemplos-pdf-vinculo` em 22/09/2026. A jornada E2E executou quatro testes reais: TS14 e TS15 em Firefox e Google Chrome. TS15 criou indicadores antes dos vínculos, confirmou 35%, recebeu 422/saldo de 65% para 70%, aceitou 65% e baixou `relatorio-estrategia.pdf`.

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

Executar o roteiro TechNova em um ambiente de demonstração, instalar Microsoft Edge para TS14 e realizar a inspeção manual de acessibilidade em 1024 e 1440 px; registrar somente evidências observadas.
