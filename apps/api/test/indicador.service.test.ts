import { describe, expect, it } from 'vitest';
import { indicadorSchema, type IndicadorInput } from '@eduitsm/shared';
import {
  IndicadorService,
  type IndicadorRepository,
  type IndicadorResultado,
  type ServicoParaIndicador
} from '../src/modules/indicadores/indicador.service.js';

class RepositorioEmMemoria implements IndicadorRepository {
  organizacoes: Record<string, string> = { u1: 'org1', u2: 'org2' };
  servicos: ServicoParaIndicador[] = [
    { id: 's1', organizacaoId: 'org1', status: 'EM_OPERACAO' },
    { id: 's2', organizacaoId: 'org1', status: 'DESCONTINUADO' },
    { id: 's3', organizacaoId: 'org2', status: 'EM_OPERACAO' }
  ];
  objetivos = [{ id: 'o1', organizacaoId: 'org1' }, { id: 'o2', organizacaoId: 'org2' }];
  indicadores: IndicadorResultado[] = [];

  async buscarOrganizacaoId(usuarioId: string) { return this.organizacoes[usuarioId] ?? null; }
  async buscarServico(organizacaoId: string, id: string) { return this.servicos.find((item) => item.id === id && item.organizacaoId === organizacaoId) ?? null; }
  async objetivoExiste(organizacaoId: string, id: string) { return this.objetivos.some((item) => item.id === id && item.organizacaoId === organizacaoId); }
  async listarPorServico(organizacaoId: string, servicoId: string) {
    if (!await this.buscarServico(organizacaoId, servicoId)) return null;
    return this.indicadores.filter((item) => item.servicoId === servicoId);
  }
  async criar(_organizacaoId: string, servicoId: string, input: IndicadorInput) {
    const criado = { id: `i${this.indicadores.length + 1}`, servicoId, ...input, objetivoId: input.objetivoId ?? null };
    this.indicadores.push(criado);
    return criado;
  }
  async atualizar(organizacaoId: string, id: string, input: IndicadorInput) {
    const index = this.indicadores.findIndex((item) => item.id === id && this.servicos.some((servico) => servico.id === item.servicoId && servico.organizacaoId === organizacaoId));
    if (index < 0) return null;
    const atualizado = { ...this.indicadores[index]!, ...input, objetivoId: input.objetivoId ?? null };
    this.indicadores[index] = atualizado;
    return atualizado;
  }
  async remover(organizacaoId: string, id: string) {
    const index = this.indicadores.findIndex((item) => item.id === id && this.servicos.some((servico) => servico.id === item.servicoId && servico.organizacaoId === organizacaoId));
    if (index < 0) return false;
    this.indicadores.splice(index, 1);
    return true;
  }
}

const indicador: IndicadorInput = { objetivoId: 'o1', nome: 'Disponibilidade', tipo: 'SLA', unidade: '%', meta: 99.5, sentido: 'MAIOR_MELHOR' };

describe('Indicadores por serviço', () => {
  it('exige meta e aceita os dois sentidos definidos pela RN08', () => {
    const contrato = { ...indicador, objetivoId: '00000000-0000-4000-8000-000000000001' };
    const semMeta = { ...contrato } as Partial<typeof contrato>;
    delete semMeta.meta;
    expect(indicadorSchema.safeParse(semMeta).success).toBe(false);
    expect(indicadorSchema.safeParse(contrato).success).toBe(true);
    expect(indicadorSchema.safeParse({ ...contrato, sentido: 'MENOR_MELHOR' }).success).toBe(true);
    expect(indicadorSchema.safeParse({ ...contrato, sentido: 'NEUTRO' }).success).toBe(false);
  });

  it('retorna 404 para serviço não cadastrado ou objetivo de outra organização', async () => {
    const service = new IndicadorService(new RepositorioEmMemoria());
    await expect(service.criar('u1', 's3', indicador)).rejects.toMatchObject({ status: 404, code: 'SERVICO_NAO_ENCONTRADO' });
    await expect(service.criar('u1', 's1', { ...indicador, objetivoId: 'o2' })).rejects.toMatchObject({ status: 404, code: 'OBJETIVO_NAO_ENCONTRADO' });
  });

  it('rejeita novo indicador em serviço descontinuado e mantém leitura do histórico', async () => {
    const repository = new RepositorioEmMemoria();
    repository.indicadores.push({ id: 'i-legado', servicoId: 's2', ...indicador, objetivoId: null });
    const service = new IndicadorService(repository);

    await expect(service.criar('u1', 's2', indicador)).rejects.toMatchObject({ status: 422, code: 'SERVICO_DESCONTINUADO' });
    await expect(service.listarPorServico('u1', 's2')).resolves.toEqual([expect.objectContaining({ id: 'i-legado' })]);
  });

  it('cria, atualiza e exclui somente indicador autorizado', async () => {
    const repository = new RepositorioEmMemoria();
    const service = new IndicadorService(repository);
    const criado = await service.criar('u1', 's1', indicador);
    const atualizado = await service.atualizar('u1', criado.id, { ...indicador, meta: 30, sentido: 'MENOR_MELHOR' });
    expect(atualizado).toMatchObject({ meta: 30, sentido: 'MENOR_MELHOR' });

    await expect(service.remover('u2', criado.id)).rejects.toMatchObject({ status: 404, code: 'INDICADOR_NAO_ENCONTRADO' });
    await expect(service.remover('u1', criado.id)).resolves.toBeUndefined();
  });
});
