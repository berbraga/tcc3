# Evidência local de desempenho — 21/09/2026

## Método reproduzível

```bash
BENCHMARK_DATABASE_URL='postgresql://eduitsm:eduitsm_dev@localhost:5432/eduitsm?schema=verify' npm run benchmark
```

O comando recusa URL sem `schema=verify` ou banco com sufixo `_verify` antes de migrar ou gravar. Ele aplica somente migrações versionadas ao schema descartável, cria 40 alunos/organizações/serviços com prefixo exclusivo `benchmark-carga-`, abre a API Express em TCP local (`127.0.0.1` e porta efêmera), faz 40 `GET /api/v1/servicos` simultâneos com JWTs distintos e remove somente esses usuários no `finally`.

Para a simulação, mede separadamente geração pura, `calcularMedicoes` e a transação Prisma que cria cenário, 10.000 registros e três medições. Não usa seed de demonstração nem dados de usuário.

## Resultado observado

| Operação | Volume | Resultado |
|---|---:|---:|
| Geração determinística | 10.000 registros | 4,48 ms; limite TS12 de 10.000 ms atendido |
| Cálculo de indicadores | 3 indicadores sobre 10.000 registros | 6,29 ms |
| Persistência PostgreSQL | cenário + 10.000 registros + 3 medições | 1.035,64 ms |
| Consulta HTTP TCP concorrente | 40 usuários, uma consulta por usuário | 0 erros; p50 76,04 ms; p95 107,96 ms; máximo 109,39 ms; total 135,12 ms |

Ambiente: Node.js `v24.11.0`, Linux `6.8.0-139-generic`, Intel Core i5-8265U (8 núcleos lógicos), 23,36 GiB RAM, PostgreSQL 16 em Docker local. O script falha se a geração exceder 10 s, se houver erro HTTP ou se p95 exceder 2 s.

Após a execução, a consulta de verificação no schema `verify` encontrou `0` usuários com o prefixo `benchmark-carga-`.

## Limites da evidência

- Esta é uma medição local de uma única máquina; não comprova disponibilidade, escalabilidade horizontal, latência de rede externa ou nuvem.
- A carga mede a rota real `GET /api/v1/servicos`, Express, JWT, Prisma e PostgreSQL por TCP local. Não é teste de navegador, nem mede todas as rotas da aplicação.
- Firefox e Google Chrome foram exercitados na Task 6; Edge não está instalado neste host. A validação manual de teclado/foco em 1024 px e 1440 px continua pendente; `axe` em JSDOM não mede contraste de cor.
