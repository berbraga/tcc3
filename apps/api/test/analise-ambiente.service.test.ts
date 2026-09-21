import { describe, expect, it } from 'vitest';
import { analiseAmbienteSchema } from '@eduitsm/shared';
import {
  AnaliseAmbienteService,
  type AnaliseAmbienteRepository,
  type AnaliseAmbienteResultado
} from '../src/modules/analises-ambiente/analise-ambiente.service.js';

const organizacoes = { u1: 'org1', u2: 'org2' } as const;

function repository(): AnaliseAmbienteRepository & { itens: AnaliseAmbienteResultado[] } {
  return {
    itens: [],
    async buscarOrganizacaoId(usuarioId) {
      return organizacoes[usuarioId as keyof typeof organizacoes] ?? null;
    },
    async listar(organizacaoId) {
      return this.itens.filter((item) => item.organizacaoId === organizacaoId);
    },
    async criar(organizacaoId, input) {
      const item = { id: `a${this.itens.length + 1}`, organizacaoId, ...input, impacto: input.impacto ?? null };
      this.itens.push(item);
      return item;
    },
    async atualizar(organizacaoId, id, input) {
      const index = this.itens.findIndex((item) => item.id === id && item.organizacaoId === organizacaoId);
      if (index < 0) return null;
      const item = { ...this.itens[index], ...input, impacto: input.impacto ?? null } as AnaliseAmbienteResultado;
      this.itens[index] = item;
      return item;
    },
    async remover(organizacaoId, id) {
      const index = this.itens.findIndex((item) => item.id === id && item.organizacaoId === organizacaoId);
      if (index < 0) return false;
      this.itens.splice(index, 1);
      return true;
    }
  };
}

describe('AnaliseAmbienteService', () => {
  it('executa CRUD somente na organização derivada do usuário autenticado', async () => {
    const repo = repository();
    const service = new AnaliseAmbienteService(repo);

    const criada = await service.criar('u1', {
      tipo: 'INTERNO', categoria: 'FORCA', descricao: 'Equipe experiente', impacto: 'ALTO'
    });
    expect(criada).toEqual({
      id: 'a1', organizacaoId: 'org1', tipo: 'INTERNO', categoria: 'FORCA',
      descricao: 'Equipe experiente', impacto: 'ALTO'
    });
    await expect(service.listar('u1')).resolves.toEqual([criada]);

    const atualizada = await service.atualizar('u1', criada.id, {
      tipo: 'INTERNO', categoria: 'FRAQUEZA', descricao: 'Equipe reduzida', impacto: 'MEDIO'
    });
    expect(atualizada).toMatchObject({ id: criada.id, organizacaoId: 'org1', categoria: 'FRAQUEZA' });

    await expect(service.remover('u1', criada.id)).resolves.toBeUndefined();
    await expect(service.listar('u1')).resolves.toEqual([]);
  });

  it.each(['atualizar', 'remover'] as const)('retorna 404 ao tentar %s ID de outra organização', async (acao) => {
    const repo = repository();
    const service = new AnaliseAmbienteService(repo);
    const itemDeOutraOrganizacao = await service.criar('u2', {
      tipo: 'EXTERNO', categoria: 'AMEACA', descricao: 'Concorrência', impacto: null
    });

    const operacao = acao === 'atualizar'
      ? service.atualizar('u1', itemDeOutraOrganizacao.id, {
          tipo: 'EXTERNO', categoria: 'OPORTUNIDADE', descricao: 'Mercado novo', impacto: 'ALTO'
        })
      : service.remover('u1', itemDeOutraOrganizacao.id);

    await expect(operacao).rejects.toMatchObject({ status: 404, code: 'ANALISE_NAO_ENCONTRADA' });
    expect(repo.itens).toEqual([itemDeOutraOrganizacao]);
  });

  it('rejeita descrição vazia no contrato compartilhado', () => {
    const result = analiseAmbienteSchema.safeParse({
      tipo: 'INTERNO', categoria: 'FORCA', descricao: '   ', impacto: 'BAIXO'
    });
    expect(result.success).toBe(false);
  });

  it.each([
    ['INTERNO', 'OPORTUNIDADE'],
    ['INTERNO', 'AMEACA'],
    ['EXTERNO', 'FORCA'],
    ['EXTERNO', 'FRAQUEZA']
  ] as const)('rejeita SWOT %s com categoria %s incoerente', (tipo, categoria) => {
    const result = analiseAmbienteSchema.safeParse({
      tipo, categoria, descricao: 'Item estrategicamente inválido', impacto: 'MEDIO'
    });

    expect(result.success).toBe(false);
  });
});
