# Decisões técnicas

## Fase 1 — 7 de setembro de 2026

1. **npm workspaces:** usa o gerenciador já disponível e evita ferramenta adicional.
2. **Node.js 22 como versão-alvo:** segue o diagrama de implantação; versões superiores podem ser usadas no desenvolvimento se os testes passarem.
3. **PostgreSQL 16 no Docker Compose:** corresponde ao diagrama e evita diferenças de dialeto nos testes de integração.
4. **JWT no armazenamento de sessão do navegador:** reduz persistência indevida; “manter conectado” e recuperação de senha ficam fora da Fase 1.
5. **Cadastro público apenas de aluno:** professor é criado pelo seed, conforme a regra de segurança do prompt.
6. **Organização 1:1 com usuário:** prevalecem RN01, o modelo relacional e a restrição única do Apêndice B sobre a multiplicidade divergente do diagrama de classes.
7. **Exclusão em cascata para agregados:** itens sem existência autônoma são removidos com seu proprietário; `Indicador.objetivoId` usa `SetNull`. Exclusão lógica não é necessária nesta fase.
8. **IDs UUID:** evitam IDs sequenciais expostos sem alterar as relações formais; autorização continua independente da imprevisibilidade do identificador.
9. **RN01 em duas camadas:** `usuarioId @unique` impede múltiplas organizações; cadastro transacional e seed reparador garantem a criação da organização. O PostgreSQL não expressa a participação total inversa somente com chave estrangeira.
10. **Pacote compartilhado compilado:** API e SPA consomem `@eduitsm/shared` por `dist`, permitindo executar o build da API no Node.js 22 sem carregar TypeScript-fonte.
11. **Benchmark isolado e local:** `npm run benchmark` aceita somente `BENCHMARK_DATABASE_URL` com `schema=verify` ou banco `_verify`, mede Express/JWT/Prisma/PostgreSQL por TCP local e remove apenas seus 41 usuários com prefixo exclusivo. O resultado não é tratado como validação de nuvem, disponibilidade ou carga externa.
12. **Implantação preparada, não publicada:** Docker, CORS de origem explícita, migrações versionadas, shutdown e Tailscale estão documentados no README. Nenhum deploy externo, domínio HTTPS, monitoramento de disponibilidade ou validação em nuvem foi executado nesta entrega.
13. **Semântica conservadora de indicadores:** slaCumprido calcula cumprimento de SLA, não disponibilidade temporal; TS01 fica bloqueado até existir dado de uptime/downtime e fórmula aprovada. CUSTO e RECEITA não recebem valor calculado enquanto a fonte não definir entradas e fórmula. Essa decisão preserva os dados existentes sem inventar resultado pedagógico.
