import { PrismaClient, PerfilUsuario, StatusServico, StatusObjetivo, TipoCusto, TipoIndicador, SentidoMeta, PerfilCenario } from '@prisma/client';
import { hash } from 'bcryptjs';
import { validarAmbienteSeedDemo } from '../src/config/seed-demo.js';

const db = new PrismaClient();
const ids = {
  professor: '00000000-0000-4000-8000-000000000001', aluno: '00000000-0000-4000-8000-000000000002',
  orgProfessor: '00000000-0000-4000-8000-000000000011', orgAluno: '00000000-0000-4000-8000-000000000012',
  objetivo1: '00000000-0000-4000-8000-000000000021', objetivo2: '00000000-0000-4000-8000-000000000022', objetivo3: '00000000-0000-4000-8000-000000000023',
  portal: '00000000-0000-4000-8000-000000000031', ecommerce: '00000000-0000-4000-8000-000000000032', central: '00000000-0000-4000-8000-000000000033', estoque: '00000000-0000-4000-8000-000000000034', legado: '00000000-0000-4000-8000-000000000035',
  cenario: '00000000-0000-4000-8000-000000000041'
};

async function main() {
  validarAmbienteSeedDemo(process.env);
  const senhaHash = await hash('EduITSM@2026', 12);
  const professor = await db.usuario.upsert({ where: { email: 'professor@eduitsm.local' }, update: { nome: 'Rafael Professor', senhaHash, perfil: PerfilUsuario.PROFESSOR }, create: { id: ids.professor, nome: 'Rafael Professor', email: 'professor@eduitsm.local', senhaHash, perfil: PerfilUsuario.PROFESSOR } });
  await db.organizacao.upsert({ where: { usuarioId: professor.id }, update: { nome: 'Ambiente do Professor', setor: 'Educação', descricao: 'Ambiente de demonstração do professor.' }, create: { id: ids.orgProfessor, usuarioId: professor.id, nome: 'Ambiente do Professor', setor: 'Educação', descricao: 'Ambiente de demonstração do professor.' } });
  const aluno = await db.usuario.upsert({ where: { email: 'aluno@eduitsm.local' }, update: { nome: 'Bernardo Aluno', senhaHash, perfil: PerfilUsuario.ALUNO }, create: { id: ids.aluno, nome: 'Bernardo Aluno', email: 'aluno@eduitsm.local', senhaHash, perfil: PerfilUsuario.ALUNO } });
  const orgAluno = await db.organizacao.upsert({ where: { usuarioId: aluno.id }, update: { nome: 'TechNova Retail', setor: 'Varejo eletrônico', descricao: 'E-commerce varejista que perde vendas institucionais por não oferecer um portal B2B com aprovação de crédito automatizada.' }, create: { id: ids.orgAluno, usuarioId: aluno.id, nome: 'TechNova Retail', setor: 'Varejo eletrônico', descricao: 'E-commerce varejista que perde vendas institucionais por não oferecer um portal B2B com aprovação de crédito automatizada.' } });

  await db.estrategiaServico.upsert({ where: { organizacaoId_versao: { organizacaoId: ids.orgAluno, versao: 1 } }, update: {}, create: { organizacaoId: ids.orgAluno, versao: 1, perspectiva: 'Tornar-se referência em vendas B2B automatizadas no varejo eletrônico.', posicao: 'Diferenciar-se pela aprovação automatizada e imediata de crédito B2B.', plano: 'Lançar o Portal de Vendas Corporativas em seis meses com CAPEX de R$ 150.000,00.', padrao: 'Priorizar automação como resposta estratégica recorrente.' } });
  const objetivos = [
    [ids.objetivo1, 'OE-01', 'Expandir a atuação no mercado corporativo e aumentar a receita bruta em 20%'],
    [ids.objetivo2, 'OE-02', 'Ampliar a participação no varejo digital para 12% do mercado regional'],
    [ids.objetivo3, 'OE-03', 'Reduzir em 8% o custo operacional da operação logística']
  ] as const;
  for (const [id, codigo, descricao] of objetivos) await db.objetivoEstrategico.upsert({ where: { id }, update: { descricao }, create: { id, organizacaoId: ids.orgAluno, codigo, descricao, status: StatusObjetivo.ATIVO } });

  const servicos = [
    [ids.portal, 'Portal de Vendas Corporativas (B2B)', '500 clientes corporativos', StatusServico.EM_DESENHO],
    [ids.ecommerce, 'E-commerce B2C', 'Consumidor final', StatusServico.EM_OPERACAO],
    [ids.central, 'Central de Atendimento ao Cliente', 'Clientes B2C e B2B', StatusServico.EM_OPERACAO],
    [ids.estoque, 'Gestão de Estoque Integrada', 'Áreas internas', StatusServico.EM_OPERACAO],
    [ids.legado, 'Portal de Autoatendimento (legado)', 'Consumidor final', StatusServico.DESCONTINUADO]
  ] as const;
  for (const [id, nome, publicoAlvo, status] of servicos) await db.servico.upsert({ where: { id }, update: { nome, publicoAlvo, status }, create: { id, organizacaoId: ids.orgAluno, nome, publicoAlvo, status } });

  await db.custoServico.upsert({ where: { id: '00000000-0000-4000-8000-000000000051' }, update: {}, create: { id: '00000000-0000-4000-8000-000000000051', servicoId: ids.portal, tipo: TipoCusto.CAPEX, valorPrevisto: 150000, periodo: 'jan-jun/26' } });
  await db.custoServico.upsert({ where: { id: '00000000-0000-4000-8000-000000000052' }, update: {}, create: { id: '00000000-0000-4000-8000-000000000052', servicoId: ids.portal, tipo: TipoCusto.OPEX, valorPrevisto: 15000, periodo: 'mensal' } });
  await db.demandaCapacidade.upsert({ where: { id: '00000000-0000-4000-8000-000000000061' }, update: {}, create: { id: '00000000-0000-4000-8000-000000000061', servicoId: ids.portal, periodo: 'jan/2026', demandaPrevista: 10000, capacidadeInstalada: 11500, unidade: 'transações/mês' } });
  await db.vinculoEstrategico.upsert({ where: { servicoId_objetivoId: { servicoId: ids.portal, objetivoId: ids.objetivo1 } }, update: {}, create: { servicoId: ids.portal, objetivoId: ids.objetivo1, justificativaValor: 'Automatizar crédito e faturamento B2B para viabilizar vendas corporativas.', contribuicao: 35 } });
  await db.indicador.upsert({ where: { id: '00000000-0000-4000-8000-000000000071' }, update: {}, create: { id: '00000000-0000-4000-8000-000000000071', servicoId: ids.portal, objetivoId: ids.objetivo1, nome: 'Disponibilidade (SLA)', tipo: TipoIndicador.SLA, unidade: '%', meta: 99.9, sentido: SentidoMeta.MAIOR_MELHOR } });
  await db.indicador.upsert({ where: { id: '00000000-0000-4000-8000-000000000072' }, update: {}, create: { id: '00000000-0000-4000-8000-000000000072', servicoId: ids.portal, objetivoId: ids.objetivo1, nome: 'Vendas faturadas', tipo: TipoIndicador.RECEITA, unidade: 'R$/6 meses', meta: 2000000, sentido: SentidoMeta.MAIOR_MELHOR } });
  await db.cenarioSimulacao.upsert({ where: { id: ids.cenario }, update: {}, create: { id: ids.cenario, organizacaoId: ids.orgAluno, semente: 20260912, periodoInicio: new Date('2026-01-01T00:00:00Z'), periodoFim: new Date('2026-06-30T00:00:00Z'), volumeRegistros: 10000, perfil: PerfilCenario.REALISTA } });

  void orgAluno;
}

main().then(() => console.log('Seed EduITSM concluído.')).finally(() => db.$disconnect());
