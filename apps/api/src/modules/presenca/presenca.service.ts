import type { PresencaInput } from '@eduitsm/shared';

export interface PresencaRepository {
  registrar(usuarioId: string, input: PresencaInput): Promise<void>;
}

export class PresencaService {
  constructor(private repository: PresencaRepository) {}
  async registrar(usuarioId: string, input: PresencaInput) {
    await this.repository.registrar(usuarioId, input);
  }
}
