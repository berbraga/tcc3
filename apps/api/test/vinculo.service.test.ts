import { describe, expect, it } from 'vitest';
import { vinculoEstrategicoSchema, type VinculoEstrategicoInput } from '@eduitsm/shared';
import {
  VinculoService,
  type ServicoParaVinculo,
  type VinculoRepository,
  type VinculoResultado
} from '../src/modules/vinculos/vinculo.service.js';

class RepositorioEmMemoria implements VinculoRepository {
  organizacoes: Record<string, string> = { u1: 'org1', u2: 'org2' };
  servicos: ServicoParaVinculo[] = [
    { id: 's1', organizacaoId: 'org1', nome: 'Portal', status: 'EM_OPERACAO' },
    { id: 's2', organizacaoId: 'org1', nome: 'ERP', status: 'EM_OPERACAO' },
    { id: 's3', organizacaoId: 'org1', nome: 'Catálogo futuro', status: 'PROPOSTO' },
    { id: 's4', organizacaoId: 'org1', nome: 'Legado', status: 'DESCONTINUADO' },
    { id: 's5', organizacaoId: 'org2', nome: 'Externo', status: 'EM_OPERACAO' }
  ];
  objetivos = [{ id: 'o1', organizacaoId: 'org1' }, { id: 'o2', organizacaoId: 'org1' }, { id: 'o3', organizacaoId: 'org2' }];
  indicadores = [
    { id: 'i1', organizacaoId: 'org1', servicoId: 's1', objetivoId: 'o1', nome: 'Tempo médio', tipo: 'TEMPO_ATENDIMENTO', unidade: 'min' },
    { id: 'i2', organizacaoId: 'org1', servicoId: 's2', objetivoId: 'o1', nome: 'Outro serviço', tipo: 'SLA', unidade: '%' },
    { id: 'i3', organizacaoId: 'org2', servicoId: 's5', objetivoId: 'o3', nome: 'Externo', tipo: 'SLA', unidade: '%' }
  ];
  vinculos: VinculoResultado[] = [];

  async buscarOrganizacaoId(usuarioId: string) { return this.organizacoes[usuarioId] ?? null; }
  async buscarServico(organizacaoId: string, id: string) { return this.servicos.find((item) => item.id === id && item.organizacaoId === organizacaoId) ?? null; }
  async objetivoExiste(organizacaoId: string, id: string) { return this.objetivos.some((item) => item.id === id && item.organizacaoId === organizacaoId); }
  async buscarIndicador(organizacaoId: string, id: string) { return this.indicadores.find((item) => item.id === id && item.organizacaoId === organizacaoId) ?? null; }
  async listar(organizacaoId: string) { return this.vinculos.filter((item) => this.servicos.some((servico) => servico.id === item.servicoId && servico.organizacaoId === organizacaoId)); }
  async criar(_organizacaoId: string, input: VinculoEstrategicoInput) {
    if (this.vinculos.some((item) => item.servicoId === input.servicoId && item.objetivoId === input.objetivoId)) throw Object.assign(new Error('duplicado'), { code: 'P2002' });
    const vinculo = { id: `v${this.vinculos.length + 1}`, ...input };
    this.vinculos.push(vinculo);
    return vinculo;
  }
  async criarComLimite(organizacaoId: string, input: VinculoEstrategicoInput) {
    const total = this.vinculos.filter((item) => item.objetivoId === input.objetivoId && this.servicos.some((servico) => servico.id === item.servicoId && servico.organizacaoId === organizacaoId)).reduce((soma, item) => soma + item.contribuicao, 0);
    const saldoDisponivel = 100 - total;
    return input.contribuicao > saldoDisponivel ? { saldoDisponivel } : this.criar(organizacaoId, input);
  }
  async remover(organizacaoId: string, id: string) {
    const index = this.vinculos.findIndex((item) => item.id === id && this.servicos.some((servico) => servico.id === item.servicoId && servico.organizacaoId === organizacaoId));
    if (index < 0) return false;
    this.vinculos.splice(index, 1);
    return true;
  }
  async listarPendencias(organizacaoId: string) {
    return this.servicos.filter((servico) => servico.organizacaoId === organizacaoId && !this.vinculos.some((vinculo) => vinculo.servicoId === servico.id));
  }
}

const vinculo: VinculoEstrategicoInput = { servicoId: 's1', objetivoId: 'o1', justificativaValor: 'Aumenta a receita digital.', contribuicao: 60 };

describe('Vínculos estratégicos', () => {
  it('TS05 — recusa contribuição acima de 100% e aceita exatamente 100%', () => {
    const contrato = { ...vinculo, servicoId: '00000000-0000-4000-8000-000000000001', objetivoId: '00000000-0000-4000-8000-000000000002' };
    expect(vinculoEstrategicoSchema.safeParse({ ...contrato, justificativaValor: '   ' }).success).toBe(false);
    expect(vinculoEstrategicoSchema.safeParse({ ...contrato, contribuicao: 0 }).success).toBe(false);
    expect(vinculoEstrategicoSchema.safeParse({ ...contrato, contribuicao: 100 }).success).toBe(true);
    expect(vinculoEstrategicoSchema.safeParse({ ...contrato, contribuicao: 101 }).success).toBe(false);
    expect(vinculoEstrategicoSchema.safeParse({ ...contrato, organizacaoId: 'org2' }).success).toBe(false);
  });

  it('retorna 404 para serviço ou objetivo fora da organização autorizada', async () => {
    const service = new VinculoService(new RepositorioEmMemoria());
    await expect(service.criar('u1', { ...vinculo, servicoId: 's5' })).rejects.toMatchObject({ status: 404, code: 'SERVICO_NAO_ENCONTRADO' });
    await expect(service.criar('u1', { ...vinculo, objetivoId: 'o3' })).rejects.toMatchObject({ status: 404, code: 'OBJETIVO_NAO_ENCONTRADO' });
  });

  it('mantém vínculos legados sem indicador e rejeita indicador cruzado ou incompatível', async () => {
    const service = new VinculoService(new RepositorioEmMemoria());
    await expect(service.criar('u1', vinculo)).resolves.toMatchObject({ servicoId: 's1', objetivoId: 'o1' });
    await expect(service.criar('u1', { ...vinculo, objetivoId: 'o2', indicadorId: 'i1' })).rejects.toMatchObject({
      status: 422, code: 'INDICADOR_OBJETIVO_INCOMPATIVEL'
    });
    await expect(service.criar('u1', { ...vinculo, objetivoId: 'o2', indicadorId: 'i2' })).rejects.toMatchObject({
      status: 422, code: 'INDICADOR_SERVICO_INCOMPATIVEL'
    });
    await expect(service.criar('u1', { ...vinculo, objetivoId: 'o2', indicadorId: 'i3' })).rejects.toMatchObject({
      status: 404, code: 'INDICADOR_NAO_ENCONTRADO'
    });
  });

  it('permite muitos para muitos e rejeita total acima de 100 informando saldo', async () => {
    const repository = new RepositorioEmMemoria();
    const service = new VinculoService(repository);
    await service.criar('u1', vinculo);
    await service.criar('u1', { ...vinculo, objetivoId: 'o2', contribuicao: 100 });
    await service.criar('u1', { ...vinculo, servicoId: 's2', contribuicao: 40 });

    await expect(service.criar('u1', { ...vinculo, servicoId: 's3', contribuicao: 1 })).rejects.toMatchObject({
      status: 422,
      code: 'CONTRIBUICAO_EXCEDE_LIMITE',
      message: expect.stringContaining('0'),
      details: { saldoDisponivel: 0 }
    });
    await expect(service.listar('u1')).resolves.toHaveLength(3);
  });

  it('RN10 — lista todo serviço sem vínculo e protege exclusão por organização', async () => {
    const repository = new RepositorioEmMemoria();
    const service = new VinculoService(repository);
    const criado = await service.criar('u1', vinculo);

    await expect(service.listarPendencias('u1')).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 's2', status: 'EM_OPERACAO' }),
      expect.objectContaining({ id: 's3', status: 'PROPOSTO' }),
      expect.objectContaining({ id: 's4', status: 'DESCONTINUADO' })
    ]));
    await expect(service.remover('u2', criado.id)).rejects.toMatchObject({ status: 404, code: 'VINCULO_NAO_ENCONTRADO' });
    await expect(service.remover('u1', criado.id)).resolves.toBeUndefined();
  });
});
