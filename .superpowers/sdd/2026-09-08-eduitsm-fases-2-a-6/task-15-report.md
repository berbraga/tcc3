# Task 15 — relatório de criação e verificação de `eduitsm-development`

Data da execução: 2026-09-07 (America/Sao_Paulo)

## Resultado e escopo

- Skill instalada em `/home/bernardo/.agents/skills/eduitsm-development/SKILL.md`.
- Cenários e validador mantidos temporariamente em `/tmp/eduitsm-skill-test.MNKZ2z/`.
- Symlink não rastreado `node_modules` removido do worktree; o alvo compartilhado não foi alterado.
- Nenhuma funcionalidade ou arquivo de runtime do EduITSM foi alterado.
- A Task 1 não foi iniciada; este checkpoint encerra somente a Task 15.

## Fonte dos invariantes

A skill foi derivada do spec `docs/superpowers/specs/2026-09-08-fases-2-a-6-design.md`, do plano `docs/superpowers/plans/2026-09-08-eduitsm-fases-2-a-6.md` e das decisões/rastreabilidade existentes. Ela contém:

1. isolamento por worktree e preservação de mudanças alheias;
2. TDD RED–GREEN–REFACTOR, com testes positivos e negativos;
3. aluno limitado à organização derivada do `sub`; professor autorizado no servidor, somente leitura e sem escrita;
4. seed idempotente, limitado a desenvolvimento/teste e sem credenciais reais;
5. gates completos, revisão de diff e checkpoint antes da próxima fase.

Também preserva as fronteiras do motor determinístico, a separação do cálculo de indicadores, a interface em português brasileiro e a proibição de vazamento de senha, token ou dados de outra organização.

## Teste comportamental independente

Quatro cenários combinaram pressão de tempo, autoridade, custo afundado e cansaço contra isolamento, TDD/autorização, seed seguro e gates. Cada amostra foi um processo novo `codex exec --ephemeral`, modelo `gpt-6-astra`, sandbox read-only, sem regras do repositório e com resposta validada por JSON Schema.

No controle RED, a skill foi movida temporariamente para fora de `~/.agents/skills/`; após as quatro execuções ela foi restaurada no mesmo caminho. No GREEN, o conteúdo exato do `SKILL.md` foi fornecido integralmente como instrução vinculante a cada contexto. Isso controla a variável sob teste sem depender de recarregamento automático do catálogo.

Comando de pontuação reproduzível:

```bash
node /tmp/eduitsm-skill-test.MNKZ2z/score-behavior.mjs
```

### RED observado — sem a skill

| Cenário | Sessão | Escolha e justificativa observada | Falha observada |
|---|---|---|---|
| Isolamento | `01a07ec2-932c-7eb2-9bb4-c300ba1ce357` | B; “O worktree isolado permite iniciar [...] preservando as mudanças” | omitiu `git worktree list` |
| TDD/autorização | `01a07ec3-b01c-7543-a988-d136dd61f79e` | C; “JWT validado autentica [...] não autoriza a organização enviada” | omitiu o contrato explícito 403/404 |
| Seed | `01a07ec3-e5a0-7ee0-9bf2-2cc3a1412ba0` | C; “O banco compartilhado não está identificado como desenvolvimento/teste” | passou o contrato completo |
| Gates | `01a07ec4-2342-7fb2-b6bc-c618915ab456` | C; “O teste focado não valida o diff grande” | omitiu `git diff --check`, `git status --short` e rastreabilidade |

Resultado automatizado após leitura manual das respostas: 1/4 contratos completos. Todas as escolhas foram seguras; o RED foi de omissão operacional em três cenários. Não houve racionalização explícita a favor de A/B para fabricar ou registrar.

Respostas brutas: `/tmp/eduitsm-skill-test.MNKZ2z/red-{1,2,3,4}.json`.

### GREEN observado — com a skill

| Cenário | Sessão | Escolha | Evidência acrescentada |
|---|---|---|---|
| Isolamento | `01a07ec8-f419-7a62-9c5e-63b404fdb98d` | B | `git worktree list`, branch e `git status --short` |
| TDD/autorização | `01a07ec9-2e6c-7052-aef6-208624e8e35d` | C | positivo/negativo, 403/404, `sub` e filtro |
| Seed | `01a07ec9-6b8e-7be2-b57f-5c7878ecebe5` | C | alvo descartável, idempotência e duas execuções |
| Gates | `01a07ec9-ac11-71e2-95cd-b0fccea2e3d6` | C | seis comandos exatos, diff e rastreabilidade |

Resultado: 4/4 contratos completos. Respostas brutas: `/tmp/eduitsm-skill-test.MNKZ2z/verified-green-{1,2,3,4}.json`.

## REFACTOR — autorização do professor

O review identificou conflito entre “organização exclusivamente do `sub`” e RN11. Um teste estrutural novo falhou em 15/16 antes da edição. A skill agora distingue:

- aluno: somente a própria organização, derivada do `sub`;
- professor: perfil e vínculo autorizados no servidor, alvo da rota apenas como seletor, leitura somente e nenhuma escrita.

O cenário comportamental do professor já escolheu C antes da mudança (`01a07ec5-1a6f-7f73-bd91-f9a3c7f3e8c0`), portanto não é alegado como RED comportamental. Após a redação explícita, nova sessão escolheu C e citou autorização server-side, read-only, bloqueio de escrita e 403/404 (`01a07ec9-dfbd-7bc2-9ed3-804828ed2749`).

No fix round 2, o sinal genérico “Organização recebida do cliente” foi substituído por “ID organizacional como autoridade; PROFESSOR autorizado: seleção-alvo em consulta read-only/server-side”. Assim, o aluno continua limitado ao `sub`, enquanto o identificador da rota do professor é apenas seletor após autorização no servidor.

Validação final:

```bash
node /tmp/eduitsm-skill-test.MNKZ2z/validate-eduitsm-skill.mjs \
  /home/bernardo/.agents/skills/eduitsm-development/SKILL.md \
  /tmp/eduitsm-skill-test.MNKZ2z/pressure-scenarios.md --self-test
wc -w /home/bernardo/.agents/skills/eduitsm-development/SKILL.md
```

Resultado: 17/17 contratos, 4/4 cenários presentes, 7/7 mutações detectadas e 500 palavras. Frontmatter e referências explícitas às skills TDD/verificação passaram.

## Gates do repositório

Executado do topo do worktree:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm audit --omit=dev --offline
git diff --check
git status --short
```

Após remover o symlink, a primeira tentativa de lint falhou com exit 127 porque `eslint` vinha somente do alvo compartilhado. `npm ci` instalou dependências próprias no worktree. A primeira rodada completa então expôs Prisma Client ainda não gerado: typecheck 2, test 1 e build 2; `npm run db:generate` corrigiu apenas o artefato gerado, sem editar fontes.

Resultado fresco após a correção:

- lint 0;
- typecheck 0;
- testes 0, com 19/19 casos (14 API e 5 web);
- build 0;
- audit offline 0, `found 0 vulnerabilities` para dependências de produção;
- `git diff --check` 0;
- `git status --short` 0, listando apenas este relatório modificado antes do commit.

`node_modules` agora é um diretório local gerado e ignorado, não um symlink nem item não rastreado.

## Instalação, ativação e segurança

`~/.agents/skills/` é o diretório compartilhado reconhecido pelo runtime Codex para skills pessoais. O arquivo está instalado no local correto e não contém senha, token, URL de banco ou segredo específico do runtime.

Os testes comportamentais não usaram subagentes do orquestrador: usaram processos Codex efêmeros e independentes, sem acesso de escrita. O GREEN recebeu o corpo exato da skill para isolar seu efeito; não comprova descoberta automática pelo catálogo.

## Checkpoint

Decisão de escopo: parar após o commit da Task 15. A skill externa não pertence ao repositório do EduITSM; este relatório é a evidência versionada, enquanto os cenários/validador permanecem temporários e a skill permanece no diretório pessoal solicitado.
