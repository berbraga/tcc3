# Rastreabilidade

| Item | Implementação | Evidência automatizada |
|---|---|---|
| RF08 — autenticar e distinguir perfis | `modules/auth`, middleware JWT e T01 | `auth.service.test.ts`, `api.test.ts`, `integration.test.ts`, `pages.test.tsx` |
| RF09 — organização isolada por usuário | `modules/organizacoes`, repositório Prisma e T02 | `api.test.ts`, `integration.test.ts`, `pages.test.tsx` |
| RN01 — exatamente uma organização ativa | cadastro transacional, seed reparador e `usuarioId @unique` | teste positivo/negativo de registro e integração real |
| TS09 — acesso cruzado | organização derivada do `sub` do JWT e serviço de propriedade reutilizável | teste de integração real com resposta 403 em `integration.test.ts` |
| TS10 — token ausente, inválido ou expirado | middleware de autenticação e `jsonwebtoken.verify` | casos parametrizados e teste real de expiração |
| T01 — login | `pages/login-page.tsx` | submissão, persistência de sessão e erro visível |
| T02 — painel inicial | `pages/painel-page.tsx` e `components/layout.tsx` | carregamento, erro, vazio, edição e confirmação de sucesso |
| RF12 / T15 — acompanhamento de alunos | `modules/professor`, `pages/ambientes-page.tsx` e menu condicionado por perfil | `professor.api.test.ts`, `report-pages.test.tsx` |
| RF13 / T14 / T14b — relatório e exportação | `modules/relatorios` e `pages/relatorio-page.tsx` | `relatorio.service.test.ts`, `relatorio.api.test.ts`, `report-pages.test.tsx` |
| RN11 / TS11 — professor somente leitura | autorização de perfil e bloqueio de métodos mutáveis no middleware | professor recebe 403 para escrita em `professor.api.test.ts` |

As demais regras e testes permanecem associados às fases indicadas em `PROMPT_INICIAL_EDUITSM.md`; não há implementação vazia que seja contabilizada como entregue.

## Matriz TS01–TS15

| Caso | Evidência nomeada | Situação neste checkout |
|---|---|---|
| TS01 | `indicadores.calculo.test.ts` — `TS01 — calcula disponibilidade com tolerância de 0,01 ponto percentual` | Automatizado |
| TS02 | `indicadores.calculo.test.ts` — `TS02 — calcula tempo médio pela média aritmética dos registros do período` | Automatizado |
| TS03 | `indicadores.calculo.test.ts` — parâmetros `TS03 — avalia ...` | Automatizado |
| TS04 | `simulacao.test.ts` — `TS04 — produz bytes idênticos...` | Automatizado |
| TS05 | `vinculo.service.test.ts` — `TS05 — recusa contribuição acima de 100% e aceita exatamente 100%` | Automatizado |
| TS06 | `relatorio.service.test.ts` — `TS06 — bloqueia exportação com 422...` | Automatizado |
| TS07 | `cenario.api.test.ts` — `TS07 — ignora o serviço descontinuado...` | Automatizado |
| TS08 | `alinhamento.api.test.ts` — `TS08 — responde 422 e informa a contribuição disponível...` | Integração HTTP |
| TS09 | `integration.test.ts` — `TS09 — bloqueia acesso entre organizações...` | Integração com PostgreSQL |
| TS10 | `integration.test.ts` — `TS10 — token ausente, inválido ou expirado responde 401` | Integração HTTP |
| TS11 | `professor.api.test.ts` — `TS11 — recusa escrita autenticada pelo professor com 403` | Integração HTTP |
| TS12 | `simulacao.performance.test.ts` — `TS12 — gera 10.000 registros em até dez segundos` | Medição monotônica, limite 10.000 ms |
| TS13 | `servico.api.test.ts` — `TS13 — cadastro e consulta HTTP permanecem em até dois segundos` | Medição monotônica, limite 2.000 ms por operação |
| TS14 | Runner E2E indisponível | Não aprovado: Chrome e Edge ausentes; Firefox 155.0.1 instalado, sem Playwright/WebDriver |
| TS15 | `pages.test.tsx` — `TS15 — executa o estudo de caso do login ao painel sem intervenção técnica` | Integração React |

## Acessibilidade e compatibilidade

- `apps/web/src/test/accessibility.test.tsx` executa axe no documento inicial e verifica rótulos de formulário, foco sequencial por teclado, cabeçalhos de tabela e mensagens com `role="alert"`; `color-contrast` não é avaliado em JSDOM.
- A checagem manual de teclado em um navegador real permanece pendente para a apresentação. O ambiente tinha `DISPLAY`, Firefox 155.0.1 e nenhum Chrome/Edge, mas não tinha Playwright, WebDriver ou outro runner para reproduzir o fluxo; não foi criado `tests/e2e/`.
