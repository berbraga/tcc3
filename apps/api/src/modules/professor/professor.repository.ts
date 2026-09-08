import type { PrismaClient } from '@prisma/client';
import type { ProfessorRepository } from './professor.service.js';

export class PrismaProfessorRepository implements ProfessorRepository {
  constructor(private db: PrismaClient) {}

  async listarAmbientes(pagina: number, limite: number) {
    const where = { usuario: { perfil: 'ALUNO' as const } };
    const [organizacoes, total] = await this.db.$transaction([
      this.db.organizacao.findMany({
        where,
        skip: (pagina - 1) * limite,
        take: limite,
        orderBy: [{ usuario: { nome: 'asc' } }, { id: 'asc' }],
        select: {
          id: true,
          nome: true,
          setor: true,
          usuario: { select: { nome: true } },
          estrategias: { orderBy: { versao: 'desc' }, take: 1, select: { perspectiva: true, posicao: true, plano: true, padrao: true } },
          servicos: { select: { _count: { select: { vinculos: true, indicadores: true } } } },
          _count: { select: { cenarios: true } }
        }
      }),
      this.db.organizacao.count({ where })
    ]);
    return {
      total,
      items: organizacoes.map((organizacao) => {
        const estrategia = organizacao.estrategias[0];
        return {
          id: organizacao.id,
          aluno: { nome: organizacao.usuario.nome },
          organizacao: { nome: organizacao.nome, setor: organizacao.setor },
          progresso: {
            psCompletos: estrategia ? [estrategia.perspectiva, estrategia.posicao, estrategia.plano, estrategia.padrao].filter((p) => Boolean(p?.trim())).length : 0,
            servicos: organizacao.servicos.length,
            vinculos: organizacao.servicos.reduce((total, servico) => total + servico._count.vinculos, 0),
            indicadores: organizacao.servicos.reduce((total, servico) => total + servico._count.indicadores, 0),
            cenarioGerado: organizacao._count.cenarios > 0
          }
        };
      })
    };
  }
}
