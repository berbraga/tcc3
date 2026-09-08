export interface AmbienteProfessorResumo {
  id: string;
  aluno: { nome: string };
  organizacao: { nome: string; setor: string | null };
  progresso: { psCompletos: number; servicos: number; vinculos: number; indicadores: number; cenarioGerado: boolean };
}

export interface ProfessorRepository {
  listarAmbientes(pagina: number, limite: number): Promise<{ items: AmbienteProfessorResumo[]; total: number }>;
}

export class ProfessorService {
  constructor(private repository: ProfessorRepository) {}

  async listarAmbientes({ pagina, limite }: { pagina: number; limite: number }) {
    const resultado = await this.repository.listarAmbientes(pagina, limite);
    return { ...resultado, pagina, limite };
  }
}
