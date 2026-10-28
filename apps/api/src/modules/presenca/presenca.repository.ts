import type { PrismaClient } from '@prisma/client';
import type { PresencaRepository } from './presenca.service.js';

export class PrismaPresencaRepository implements PresencaRepository {
  constructor(private db: PrismaClient) {}
  async registrar(usuarioId: string, input: { pagina: string; missao?: number | null; acao?: string | null }) {
    await this.db.presencaUsuario.upsert({
      where: { usuarioId },
      create: { usuarioId, paginaAtual: input.pagina, missaoAtual: input.missao ?? null, ultimaAcao: input.acao ?? null },
      update: { paginaAtual: input.pagina, missaoAtual: input.missao ?? null, ultimaAcao: input.acao ?? null, ultimaAtividade: new Date() }
    });
  }
}
