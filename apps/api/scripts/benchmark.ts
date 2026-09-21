import { execFileSync } from 'node:child_process';
import { cpus, hostname, platform, release, totalmem } from 'node:os';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import type { CenarioInput } from '@eduitsm/shared';
import { criarApp } from '../src/app.js';
import { avaliarCarga, resolverUrlBancoDeBenchmark, resumirAmostras, USUARIOS_CONCORRENTES } from '../src/benchmark/load-benchmark.js';
import type { Dependencias } from '../src/dependencies.js';
import { JwtTokenService } from '../src/infra/token.js';
import { PrismaCenarioRepository } from '../src/modules/simulacao/cenario.repository.js';
import { calcularMedicoes } from '../src/modules/simulacao/calculo.js';
import { gerarRegistros } from '../src/modules/simulacao/gerador.js';
import { PrismaServicoRepository } from '../src/modules/servicos/servico.repository.js';
import { ServicoService } from '../src/modules/servicos/servico.service.js';

const DIRETORIO_API = fileURLToPath(new URL('..', import.meta.url));
const PREFIXO_EMAIL = 'benchmark-carga-';
const SEGREDO = 'segredo-local-de-benchmark-com-mais-de-32-caracteres';

interface UsuarioDeCarga { id: string; token: string; }

interface RelatorioBenchmark {
  executadoEm: string;
  ambiente: { node: string; plataforma: string; kernel: string; hostname: string; cpu: string; nucleosLogicos: number; memoriaGiB: number };
  banco: { alvo: 'verify'; usuariosConcorrentes: number; registrosSimulados: number };
  geracao: { ms: number; registros: number; limiteMs: number; aprovada: boolean };
  calculo: { ms: number; medicoes: number };
  persistencia: { ms: number; registros: number; medicoes: number };
  http: ReturnType<typeof resumirAmostras> & { totalMs: number; aprovada: boolean; motivo: string | null };
}

async function executar() {
  const databaseUrl = resolverUrlBancoDeBenchmark(process.env);
  process.env.DATABASE_URL = databaseUrl;
  aplicarMigracoes(databaseUrl);

  const db = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await limparDadosDoBenchmark(db);
    const dados = await prepararDados(db);
    const relatorio = await medir(db, dados);
    console.log(JSON.stringify(relatorio, null, 2));

    if (!relatorio.geracao.aprovada) throw new Error(`Geração de 10.000 registros excedeu ${relatorio.geracao.limiteMs} ms.`);
    if (!relatorio.http.aprovada) throw new Error(`Carga HTTP reprovada: ${relatorio.http.motivo}`);
  } finally {
    try {
      await limparDadosDoBenchmark(db);
    } finally {
      await db.$disconnect();
    }
  }
}

function aplicarMigracoes(databaseUrl: string) {
  execFileSync('npx', ['prisma', 'migrate', 'deploy', '--schema', 'prisma/schema.prisma'], {
    cwd: DIRETORIO_API,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit'
  });
}

async function prepararDados(db: PrismaClient) {
  const usuarios = await Promise.all(Array.from({ length: USUARIOS_CONCORRENTES }, async (_, indice) => {
    const usuario = await db.usuario.create({ data: {
      nome: `Usuário de carga ${indice + 1}`,
      email: `${PREFIXO_EMAIL}${indice + 1}@eduitsm.local`,
      senhaHash: 'não-utilizada-pelo-benchmark',
      perfil: 'ALUNO',
      organizacao: { create: { nome: `Organização de carga ${indice + 1}` } }
    }, include: { organizacao: true } });
    await db.servico.create({ data: { organizacaoId: usuario.organizacao!.id, nome: `Serviço de carga ${indice + 1}`, status: 'EM_OPERACAO' } });
    return usuario;
  }));
  const usuarioCenario = await db.usuario.create({ data: {
    nome: 'Usuário do cenário de benchmark',
    email: `${PREFIXO_EMAIL}cenario@eduitsm.local`,
    senhaHash: 'não-utilizada-pelo-benchmark',
    perfil: 'ALUNO',
    organizacao: { create: { nome: 'Organização do cenário de benchmark' } }
  }, include: { organizacao: true } });
  const servico = await db.servico.create({ data: { organizacaoId: usuarioCenario.organizacao!.id, nome: 'Serviço para 10 mil registros', status: 'EM_OPERACAO' } });
  const indicadores = await db.indicador.createManyAndReturn({ data: [
    { servicoId: servico.id, nome: 'Cumprimento de SLA', tipo: 'SLA', unidade: '%', meta: 90, sentido: 'MAIOR_MELHOR' },
    { servicoId: servico.id, nome: 'Satisfação', tipo: 'SATISFACAO', unidade: 'nota', meta: 4, sentido: 'MAIOR_MELHOR' },
    { servicoId: servico.id, nome: 'Tempo de atendimento', tipo: 'TEMPO_ATENDIMENTO', unidade: 'min', meta: 180, sentido: 'MENOR_MELHOR' }
  ] });
  const tokens = new JwtTokenService(SEGREDO, '1h');
  return {
    usuarios: usuarios.map((usuario): UsuarioDeCarga => ({ id: usuario.id, token: tokens.assinar({ sub: usuario.id, perfil: 'ALUNO' }) })),
    organizacaoId: usuarioCenario.organizacao!.id,
    servicoId: servico.id,
    indicadores: indicadores.map((indicador) => ({ id: indicador.id, servicoId: indicador.servicoId, tipo: indicador.tipo }))
  };
}

async function medir(db: PrismaClient, dados: Awaited<ReturnType<typeof prepararDados>>): Promise<RelatorioBenchmark> {
  const inicioGeracao = performance.now();
  const registros = gerarRegistros({
    seed: 20260921,
    volume: 10_000,
    periodoInicio: new Date('2026-01-01T00:00:00.000Z'),
    periodoFim: new Date('2026-12-31T23:59:59.999Z'),
    servicoIds: [dados.servicoId],
    perfil: 'REALISTA'
  });
  const geracaoMs = performance.now() - inicioGeracao;

  const inicioCalculo = performance.now();
  const medicoes = calcularMedicoes([{ id: dados.servicoId, status: 'EM_OPERACAO' }], dados.indicadores, registros);
  const calculoMs = performance.now() - inicioCalculo;

  const input: CenarioInput = { semente: 20260921, periodoInicio: '2026-01-01', periodoFim: '2026-12-31', volumeRegistros: 10_000, perfil: 'REALISTA', servicoIds: [dados.servicoId] };
  const inicioPersistencia = performance.now();
  const persistido = await new PrismaCenarioRepository(db).persistir(dados.organizacaoId, input, 'benchmark-carga-20260921', [dados.servicoId], registros, medicoes);
  const persistenciaMs = performance.now() - inicioPersistencia;

  const servidor = await iniciarServidor(criarAppDeCarga(db, new JwtTokenService(SEGREDO, '1h')));
  let respostas: { ms: number; status: number; quantidade: number }[];
  let totalHttpMs: number;
  try {
    const inicioHttp = performance.now();
    respostas = await Promise.all(dados.usuarios.map(async (usuario) => {
      const inicio = performance.now();
      const resposta = await fetch(`${servidor.url}/api/v1/servicos`, { headers: { authorization: `Bearer ${usuario.token}` } });
      const corpo: unknown = await resposta.json();
      return { ms: performance.now() - inicio, status: resposta.status, quantidade: Array.isArray(corpo) ? corpo.length : 0 };
    }));
    totalHttpMs = performance.now() - inicioHttp;
  } finally {
    await servidor.fechar();
  }
  const resumo = resumirAmostras(respostas.map((resposta) => resposta.ms), respostas.filter((resposta) => resposta.status !== 200 || resposta.quantidade !== 1).length);
  const carga = avaliarCarga(resumo);

  return {
    executadoEm: new Date().toISOString(),
    ambiente: dadosDoAmbiente(),
    banco: { alvo: 'verify', usuariosConcorrentes: USUARIOS_CONCORRENTES, registrosSimulados: registros.length },
    geracao: { ms: arredondar(geracaoMs), registros: registros.length, limiteMs: 10_000, aprovada: geracaoMs <= 10_000 },
    calculo: { ms: arredondar(calculoMs), medicoes: medicoes.length },
    persistencia: { ms: arredondar(persistenciaMs), registros: persistido.registrosGerados, medicoes: persistido.medicoesGeradas },
    http: { ...arredondarResumo(resumo), totalMs: arredondar(totalHttpMs), aprovada: carga.aprovada, motivo: carga.motivo }
  };
}

async function iniciarServidor(app: ReturnType<typeof criarApp>) {
  const servidor = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
    const iniciado = app.listen(0, '127.0.0.1', () => resolve(iniciado));
  });
  const endereco = servidor.address();
  if (!endereco || typeof endereco === 'string') throw new Error('Não foi possível obter a porta do benchmark HTTP.');
  return {
    url: `http://127.0.0.1:${endereco.port}`,
    fechar: () => new Promise<void>((resolve, reject) => servidor.close((erro) => erro ? reject(erro) : resolve()))
  };
}

function criarAppDeCarga(db: PrismaClient, tokens: JwtTokenService) {
  const deps = {
    authService: { registrar: async () => { throw new Error('fora do escopo'); }, login: async () => { throw new Error('fora do escopo'); } },
    tokenService: tokens,
    organizacaoService: { obterMinha: async () => { throw new Error('fora do escopo'); }, atualizarMinha: async () => { throw new Error('fora do escopo'); }, verificarAcesso: async () => { throw new Error('fora do escopo'); } },
    analiseAmbienteService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); } },
    estrategiaService: { obterAtual: async () => null, salvarNovaVersao: async () => { throw new Error('fora do escopo'); }, listarVersoes: async () => [] },
    objetivoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, obterCobertura: async () => { throw new Error('fora do escopo'); }, obterResumoCobertura: async () => ({ objetivosAlinhados: 0 }) },
    servicoService: new ServicoService(new PrismaServicoRepository(db)),
    vinculoService: { listar: async () => [], criar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); }, listarPendencias: async () => [] },
    indicadorService: { listarPorServico: async () => [], criar: async () => { throw new Error('fora do escopo'); }, atualizar: async () => { throw new Error('fora do escopo'); }, remover: async () => { throw new Error('fora do escopo'); } },
    cenarioService: { criar: async () => { throw new Error('fora do escopo'); }, obterPainel: async () => [] },
    relatorioEstrategiaService: { obter: async () => { throw new Error('fora do escopo'); }, exportar: async () => { throw new Error('fora do escopo'); } }
  } satisfies Dependencias;
  return criarApp(deps, 'http://localhost:5173');
}

async function limparDadosDoBenchmark(db: PrismaClient) {
  await db.usuario.deleteMany({ where: { email: { startsWith: PREFIXO_EMAIL, endsWith: '@eduitsm.local' } } });
}

function dadosDoAmbiente() {
  const cpu = cpus();
  return {
    node: process.version,
    plataforma: platform(),
    kernel: release(),
    hostname: hostname(),
    cpu: cpu[0]?.model ?? 'não identificado',
    nucleosLogicos: cpu.length,
    memoriaGiB: arredondar(totalmem() / 1024 ** 3)
  };
}

function arredondarResumo(resumo: ReturnType<typeof resumirAmostras>) {
  return Object.fromEntries(Object.entries(resumo).map(([chave, valor]) => [chave, typeof valor === 'number' && chave !== 'amostras' && chave !== 'erros' ? arredondar(valor) : valor])) as ReturnType<typeof resumirAmostras>;
}

function arredondar(valor: number) { return Math.round((valor + Number.EPSILON) * 100) / 100; }

executar().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exitCode = 1;
});
