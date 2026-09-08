# Rastreabilidade da Fase 1

| Item | Implementação | Evidência automatizada |
|---|---|---|
| RF08 — autenticar e distinguir perfis | `modules/auth`, middleware JWT e T01 | `auth.service.test.ts`, `api.test.ts`, `integration.test.ts`, `pages.test.tsx` |
| RF09 — organização isolada por usuário | `modules/organizacoes`, repositório Prisma e T02 | `api.test.ts`, `integration.test.ts`, `pages.test.tsx` |
| RN01 — exatamente uma organização ativa | cadastro transacional, seed reparador e `usuarioId @unique` | teste positivo/negativo de registro e integração real |
| TS09 — acesso cruzado | organização derivada do `sub` do JWT e serviço de propriedade reutilizável | teste de integração real com resposta 403 em `integration.test.ts` |
| TS10 — token ausente, inválido ou expirado | middleware de autenticação e `jsonwebtoken.verify` | casos parametrizados e teste real de expiração |
| T01 — login | `pages/login-page.tsx` | submissão, persistência de sessão e erro visível |
| T02 — painel inicial | `pages/painel-page.tsx` e `components/layout.tsx` | carregamento, erro, vazio, edição e confirmação de sucesso |

As demais regras e testes permanecem associados às fases indicadas em `PROMPT_INICIAL_EDUITSM.md`; não há implementação vazia que seja contabilizada como entregue.
