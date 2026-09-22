import {
  PerfilUsuario,
  PrismaClient,
  SentidoMeta,
  StatusObjetivo,
  StatusServico,
  TipoCusto,
  TipoIndicador
} from '@prisma/client';

type GerarHash = (senha: string, custo: number) => Promise<string>;

const ids = {
  professor: '00000000-0000-4000-8000-000000000001', aluno: '00000000-0000-4000-8000-000000000002',
  orgProfessor: '00000000-0000-4000-8000-000000000011', orgAluno: '00000000-0000-4000-8000-000000000012',
  objetivo1: '00000000-0000-4000-8000-000000000021', objetivo2: '00000000-0000-4000-8000-000000000022', objetivo3: '00000000-0000-4000-8000-000000000023',
  portal: '00000000-0000-4000-8000-000000000031', ecommerce: '00000000-0000-4000-8000-000000000032', central: '00000000-0000-4000-8000-000000000033', estoque: '00000000-0000-4000-8000-000000000034', legado: '00000000-0000-4000-8000-000000000035'
} as const;

export async function popularDadosDemonstracao(db: PrismaClient, gerarHash: GerarHash): Promise<void> {
  const senhaHash = await gerarHash('EduITSM@2026', 12);
  const professor = await db.usuario.upsert({ where: { email: 'professor@eduitsm.local' }, update: { nome: 'Rafael Professor', senhaHash, perfil: PerfilUsuario.PROFESSOR }, create: { id: ids.professor, nome: 'Rafael Professor', email: 'professor@eduitsm.local', senhaHash, perfil: PerfilUsuario.PROFESSOR } });
  await db.organizacao.upsert({ where: { usuarioId: professor.id }, update: { nome: 'Ambiente do Professor', setor: 'Educação', descricao: 'Ambiente de demonstração do professor.' }, create: { id: ids.orgProfessor, usuarioId: professor.id, nome: 'Ambiente do Professor', setor: 'Educação', descricao: 'Ambiente de demonstração do professor.' } });

  const aluno = await db.usuario.upsert({ where: { email: 'aluno@eduitsm.local' }, update: { nome: 'Bernardo Aluno', senhaHash, perfil: PerfilUsuario.ALUNO }, create: { id: ids.aluno, nome: 'Bernardo Aluno', email: 'aluno@eduitsm.local', senhaHash, perfil: PerfilUsuario.ALUNO } });
  const orgAluno = await db.organizacao.upsert({ where: { usuarioId: aluno.id }, update: { nome: 'TechNova Retail', setor: 'Varejo eletrônico', descricao: 'E-commerce varejista que perde vendas institucionais por não oferecer um portal B2B com aprovação de crédito automatizada.' }, create: { id: ids.orgAluno, usuarioId: aluno.id, nome: 'TechNova Retail', setor: 'Varejo eletrônico', descricao: 'E-commerce varejista que perde vendas institucionais por não oferecer um portal B2B com aprovação de crédito automatizada.' } });

  const estrategia = {
    perspectiva: 'Tornar-se referência em vendas B2B automatizadas no varejo eletrônico.',
    posicao: 'Posicionar-se pela autonomia e agilidade na jornada de compra corporativa, com aprovações B2B automatizadas.',
    plano: 'Lançar o Portal de Vendas Corporativas em até seis meses, com CAPEX planejado de R$ 150.000,00.',
    padrao: 'No histórico fictício, este é o segundo projeto consecutivo de automação concluído em menos de um ano.'
  };
  await db.estrategiaServico.upsert({ where: { organizacaoId_versao: { organizacaoId: orgAluno.id, versao: 1 } }, update: estrategia, create: { organizacaoId: orgAluno.id, versao: 1, ...estrategia } });
  const objetivo1 = await db.objetivoEstrategico.upsert({ where: { organizacaoId_codigo: { organizacaoId: orgAluno.id, codigo: 'OE-01' } }, update: { descricao: 'Ampliar a atuação no mercado corporativo e aumentar a receita em 20% no próximo ano fiscal.', status: StatusObjetivo.ATIVO }, create: { id: ids.objetivo1, organizacaoId: orgAluno.id, codigo: 'OE-01', descricao: 'Ampliar a atuação no mercado corporativo e aumentar a receita em 20% no próximo ano fiscal.', status: StatusObjetivo.ATIVO } });
  await db.objetivoEstrategico.upsert({ where: { organizacaoId_codigo: { organizacaoId: orgAluno.id, codigo: 'OE-02' } }, update: { descricao: 'Ampliar a participação no varejo digital para 12% do mercado regional', status: StatusObjetivo.ATIVO }, create: { id: ids.objetivo2, organizacaoId: orgAluno.id, codigo: 'OE-02', descricao: 'Ampliar a participação no varejo digital para 12% do mercado regional', status: StatusObjetivo.ATIVO } });
  await db.objetivoEstrategico.upsert({ where: { organizacaoId_codigo: { organizacaoId: orgAluno.id, codigo: 'OE-03' } }, update: { descricao: 'Reduzir em 8% o custo operacional da operação logística', status: StatusObjetivo.ATIVO }, create: { id: ids.objetivo3, organizacaoId: orgAluno.id, codigo: 'OE-03', descricao: 'Reduzir em 8% o custo operacional da operação logística', status: StatusObjetivo.ATIVO } });

  const portal = await db.servico.upsert({ where: { id: ids.portal }, update: { organizacaoId: orgAluno.id, nome: 'Portal de Vendas Corporativas (B2B)', descricao: 'Serviço fictício para compras corporativas com aprovação automatizada de crédito.', publicoAlvo: '500 clientes corporativos', status: StatusServico.EM_DESENHO }, create: { id: ids.portal, organizacaoId: orgAluno.id, nome: 'Portal de Vendas Corporativas (B2B)', descricao: 'Serviço fictício para compras corporativas com aprovação automatizada de crédito.', publicoAlvo: '500 clientes corporativos', status: StatusServico.EM_DESENHO } });
  for (const [id, nome, publicoAlvo, status] of [[ids.ecommerce, 'E-commerce B2C', 'Consumidor final', StatusServico.EM_OPERACAO], [ids.central, 'Central de Atendimento ao Cliente', 'Clientes B2C e B2B', StatusServico.EM_OPERACAO], [ids.estoque, 'Gestão de Estoque Integrada', 'Áreas internas', StatusServico.EM_OPERACAO], [ids.legado, 'Portal de Autoatendimento (legado)', 'Consumidor final', StatusServico.DESCONTINUADO]] as const) {
    await db.servico.upsert({ where: { id }, update: { organizacaoId: orgAluno.id, nome, publicoAlvo, status }, create: { id, organizacaoId: orgAluno.id, nome, publicoAlvo, status } });
  }

  await db.custoServico.upsert({ where: { id: '00000000-0000-4000-8000-000000000051' }, update: { servicoId: portal.id, tipo: TipoCusto.CAPEX, valorPrevisto: 150000, valorRealizado: null, periodo: '2026-01' }, create: { id: '00000000-0000-4000-8000-000000000051', servicoId: portal.id, tipo: TipoCusto.CAPEX, valorPrevisto: 150000, valorRealizado: null, periodo: '2026-01' } });
  await db.custoServico.upsert({ where: { id: '00000000-0000-4000-8000-000000000052' }, update: { servicoId: portal.id, tipo: TipoCusto.OPEX, valorPrevisto: 15000, valorRealizado: null, periodo: '2026-01' }, create: { id: '00000000-0000-4000-8000-000000000052', servicoId: portal.id, tipo: TipoCusto.OPEX, valorPrevisto: 15000, valorRealizado: null, periodo: '2026-01' } });
  await db.demandaCapacidade.upsert({ where: { id: '00000000-0000-4000-8000-000000000061' }, update: { servicoId: portal.id, periodo: '2026-06', demandaPrevista: 500, capacidadeInstalada: 600, unidade: 'clientes (1º semestre)' }, create: { id: '00000000-0000-4000-8000-000000000061', servicoId: portal.id, periodo: '2026-06', demandaPrevista: 500, capacidadeInstalada: 600, unidade: 'clientes (1º semestre)' } });
  await db.demandaCapacidade.upsert({ where: { id: '00000000-0000-4000-8000-000000000062' }, update: { servicoId: portal.id, periodo: '2026-01', demandaPrevista: 10000, capacidadeInstalada: 11500, unidade: 'transações/mês' }, create: { id: '00000000-0000-4000-8000-000000000062', servicoId: portal.id, periodo: '2026-01', demandaPrevista: 10000, capacidadeInstalada: 11500, unidade: 'transações/mês' } });
  await db.indicador.upsert({ where: { id: '00000000-0000-4000-8000-000000000071' }, update: { servicoId: portal.id, objetivoId: objetivo1.id, nome: 'Cumprimento de SLA', tipo: TipoIndicador.SLA, unidade: '%', meta: 99.9, sentido: SentidoMeta.MAIOR_MELHOR }, create: { id: '00000000-0000-4000-8000-000000000071', servicoId: portal.id, objetivoId: objetivo1.id, nome: 'Cumprimento de SLA', tipo: TipoIndicador.SLA, unidade: '%', meta: 99.9, sentido: SentidoMeta.MAIOR_MELHOR } });
  await db.indicador.upsert({ where: { id: '00000000-0000-4000-8000-000000000072' }, update: { servicoId: portal.id, objetivoId: objetivo1.id, nome: 'Vendas faturadas', tipo: TipoIndicador.RECEITA, unidade: 'R$/6 meses', meta: 2000000, sentido: SentidoMeta.MAIOR_MELHOR }, create: { id: '00000000-0000-4000-8000-000000000072', servicoId: portal.id, objetivoId: objetivo1.id, nome: 'Vendas faturadas', tipo: TipoIndicador.RECEITA, unidade: 'R$/6 meses', meta: 2000000, sentido: SentidoMeta.MAIOR_MELHOR } });
  const indicadorTempo = await db.indicador.upsert({ where: { id: '00000000-0000-4000-8000-000000000073' }, update: { servicoId: portal.id, objetivoId: objetivo1.id, nome: 'Tempo médio de atendimento', tipo: TipoIndicador.TEMPO_ATENDIMENTO, unidade: 'minutos', meta: 15, sentido: SentidoMeta.MENOR_MELHOR }, create: { id: '00000000-0000-4000-8000-000000000073', servicoId: portal.id, objetivoId: objetivo1.id, nome: 'Tempo médio de atendimento', tipo: TipoIndicador.TEMPO_ATENDIMENTO, unidade: 'minutos', meta: 15, sentido: SentidoMeta.MENOR_MELHOR } });
  await db.vinculoEstrategico.upsert({ where: { servicoId_objetivoId: { servicoId: portal.id, objetivoId: objetivo1.id } }, update: { indicadorId: indicadorTempo.id, justificativaValor: 'O portal reduz etapas manuais para viabilizar vendas corporativas; o tempo médio de atendimento acompanha a qualidade operacional do serviço.', contribuicao: 35 }, create: { servicoId: portal.id, objetivoId: objetivo1.id, indicadorId: indicadorTempo.id, justificativaValor: 'O portal reduz etapas manuais para viabilizar vendas corporativas; o tempo médio de atendimento acompanha a qualidade operacional do serviço.', contribuicao: 35 } });
}
