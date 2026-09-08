# Task 15 — relatório de criação e verificação de `eduitsm-development`

Data da execução: 2026-09-07 (America/Sao_Paulo)

## Resultado e escopo

- Skill instalada em `/home/bernardo/.agents/skills/eduitsm-development/SKILL.md`.
- Cenários e validador mantidos temporariamente em `/tmp/eduitsm-skill-test.MNKZ2z/`.
- Nenhuma funcionalidade ou arquivo de runtime do EduITSM foi alterado.
- A Task 1 não foi iniciada; este checkpoint encerra somente a Task 15.

## Fonte dos invariantes

A skill foi derivada do spec `docs/superpowers/specs/2026-09-08-fases-2-a-6-design.md`, do plano `docs/superpowers/plans/2026-09-08-eduitsm-fases-2-a-6.md` e das decisões/rastreabilidade existentes. Ela contém:

1. isolamento por worktree e preservação de mudanças alheias;
2. TDD RED–GREEN–REFACTOR, com testes positivos e negativos;
3. organização derivada exclusivamente do `sub` do JWT e consultas/mutações filtradas;
4. seed idempotente, limitado a desenvolvimento/teste e sem credenciais reais;
5. gates completos, revisão de diff e checkpoint antes da próxima fase.

Também preserva as fronteiras do motor determinístico, a separação do cálculo de indicadores, a interface em português brasileiro e a proibição de vazamento de senha, token ou dados de outra organização.

## RED

Foram escritos primeiro quatro cenários combinando pressão de tempo, autoridade, custo afundado, cansaço e consequência. Eles tentam induzir, respectivamente:

- edição fora do worktree isolado;
- implementação sem TDD e confiança em `organizacaoId` do cliente;
- seed em alvo compartilhado com credencial real;
- commit com teste parcial e avanço prematuro de fase.

Comando executado antes de criar a skill:

```bash
node /tmp/eduitsm-skill-test.MNKZ2z/validate-eduitsm-skill.mjs \
  /home/bernardo/.agents/skills/eduitsm-development/SKILL.md \
  /tmp/eduitsm-skill-test.MNKZ2z/pressure-scenarios.md
```

Resultado esperado e observado: saída `FAIL skill legível: ENOENT`, exit code 1 do validador. O invólucro de confirmação usado no terminal converteu esse exit code esperado em sucesso do passo RED.

## Limitação do teste comportamental

A instrução desta task proibiu despachar outros agentes. Portanto, os cenários não foram executados por subagentes sem/com a skill e não há escolhas ou racionalizações comportamentais observadas para citar. Nenhuma resposta foi fabricada.

O substituto verificável foi um teste estrutural executável sobre o artefato, acompanhado de mutações negativas. Isso comprova que as guardas exigidas estão presentes e que sua remoção é detectada; não equivale a comprovar obediência de um agente sob pressão. As racionalizações documentadas na skill correspondem aos atalhos apresentados pelos cenários e não são apresentadas como citações de agentes.

## GREEN e REFACTOR

A primeira execução após criar a skill obteve 13/15 checks. As duas falhas foram:

- `seed seguro e idempotente`: falso negativo causado por uma regex sensível à ordem; o validador foi corrigido sem afrouxar o requisito;
- `skill concisa`: 503 palavras; a introdução foi reduzida sem remover invariantes.

Execução final:

```bash
node /tmp/eduitsm-skill-test.MNKZ2z/validate-eduitsm-skill.mjs \
  /home/bernardo/.agents/skills/eduitsm-development/SKILL.md \
  /tmp/eduitsm-skill-test.MNKZ2z/pressure-scenarios.md \
  --self-test
wc -w /home/bernardo/.agents/skills/eduitsm-development/SKILL.md
```

Resultado:

- 15/15 contratos da skill passaram;
- 4/4 cenários foram encontrados e os quatro temas obrigatórios foram cobertos;
- 5/5 mutações foram detectadas ao remover isolamento, origem da organização, ordem TDD, segurança do seed e gate de build;
- `wc -w`: 499 palavras;
- frontmatter válido, `name: eduitsm-development`, descrição em terceira pessoa iniciada por `Use when...`;
- referências explícitas a `superpowers:test-driven-development` e `superpowers:verification-before-completion`.

## Gates do repositório

Executado do topo do worktree:

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Resultado: exit code 0. ESLint, TypeScript e builds passaram; Vitest passou com 19/19 testes (14 API e 5 web). O teste da API aplicou a migração no schema `test` e não encontrou migrações pendentes.

## Instalação, ativação e segurança

`~/.agents/skills/` é o diretório compartilhado reconhecido pelo runtime Codex para skills pessoais. O arquivo está instalado no local correto e não contém senha, token, URL de banco ou segredo específico do runtime.

O catálogo de skills desta sessão foi carregado antes da criação do arquivo e não é recarregado dinamicamente. A descoberta/invocação pelo nome precisa ser confirmada em uma nova sessão; não foi iniciada uma sessão-agente adicional porque isso violaria a proibição de despachar agentes desta task.

## Checkpoint

Decisão de escopo: parar após o commit da Task 15. A skill externa não pertence ao repositório do EduITSM; este relatório é a evidência versionada, enquanto os cenários/validador permanecem temporários e a skill permanece no diretório pessoal solicitado.
