import { z } from 'zod';

const texto = (min: number, max: number) => z.string().trim().min(min).max(max);
export const uuidSchema = z.string().uuid();

export const registroSchema = z.object({
  nome: texto(2, 120),
  email: z.string().trim().email().max(160).transform((email) => email.toLowerCase()),
  senha: z.string().min(8).max(72),
  organizacao: z.object({ nome: texto(2, 120), setor: texto(2, 80).optional(), descricao: texto(1, 1000).optional() })
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email().max(160).transform((email) => email.toLowerCase()),
  senha: z.string().min(1).max(72)
}).strict();

export const atualizarOrganizacaoSchema = z.object({
  nome: texto(2, 120),
  setor: z.string().trim().max(80),
  descricao: z.string().trim().max(1000)
}).strict();

export const analiseAmbienteSchema = z.object({
  tipo: z.enum(['INTERNO', 'EXTERNO']),
  categoria: z.enum(['FORCA', 'FRAQUEZA', 'OPORTUNIDADE', 'AMEACA']),
  descricao: texto(1, 1000),
  impacto: z.enum(['BAIXO', 'MEDIO', 'ALTO']).nullable().optional()
}).strict().superRefine(({ tipo, categoria }, context) => {
  const categoriaInterna = categoria === 'FORCA' || categoria === 'FRAQUEZA';
  if ((tipo === 'INTERNO') !== categoriaInterna) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['categoria'],
      message: 'Itens internos devem ser força ou fraqueza; itens externos devem ser oportunidade ou ameaça.'
    });
  }
});

const pEstrategia = z.string().trim().max(4000).transform((value) => value || null).nullable();
export const estrategiaSchema = z.object({
  perspectiva: pEstrategia,
  posicao: pEstrategia,
  plano: pEstrategia,
  padrao: pEstrategia
}).strict();

export function normalizarEstrategia(value: z.infer<typeof estrategiaSchema>): z.infer<typeof estrategiaSchema> {
  return {
    perspectiva: value.perspectiva?.trim() || null,
    posicao: value.posicao?.trim() || null,
    plano: value.plano?.trim() || null,
    padrao: value.padrao?.trim() || null
  };
}

export function estrategiaCompleta(value: z.infer<typeof estrategiaSchema>): boolean {
  return Object.values(normalizarEstrategia(value))
    .every((item) => typeof item === 'string' && item.trim().length > 0);
}

export const relatorioEstrategiaExportacao = {
  nomeArquivo: 'relatorio-estrategia.pdf',
  contentType: 'application/pdf'
} as const;

export const objetivoSchema = z.object({
  codigo: texto(1, 20),
  descricao: texto(1, 1000),
  prazo: z.string().date().nullable().optional(),
  status: z.enum(['ATIVO', 'ATINGIDO', 'CANCELADO'])
}).strict();

export const servicoSchema = z.object({
  nome: texto(2, 120),
  descricao: z.string().trim().max(4000).nullable().optional(),
  publicoAlvo: z.string().trim().max(120).nullable().optional(),
  status: z.enum(['PROPOSTO', 'EM_DESENHO', 'EM_OPERACAO', 'DESCONTINUADO'])
}).strict();

export const periodoMensalSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const valorMonetarioSchema = z.number().finite().nonnegative().max(9_999_999_999.99).multipleOf(0.01);

export const custoServicoSchema = z.object({
  tipo: z.enum(['CAPEX', 'OPEX']),
  valorPrevisto: valorMonetarioSchema,
  valorRealizado: valorMonetarioSchema.nullable().optional(),
  periodo: periodoMensalSchema
}).strict();

export const demandaCapacidadeSchema = z.object({
  periodo: periodoMensalSchema,
  demandaPrevista: z.number().int().nonnegative().max(2_147_483_647),
  capacidadeInstalada: z.number().int().nonnegative().max(2_147_483_647),
  unidade: texto(1, 30)
}).strict();

export const vinculoEstrategicoSchema = z.object({
  servicoId: uuidSchema,
  objetivoId: uuidSchema,
  indicadorId: uuidSchema,
  justificativaValor: texto(1, 2000),
  contribuicao: z.number().finite().positive().max(100).multipleOf(0.01)
}).strict();

export const indicadorSchema = z.object({
  objetivoId: uuidSchema.nullable().optional(),
  nome: texto(2, 120),
  tipo: z.enum(['SLA', 'SATISFACAO', 'TEMPO_ATENDIMENTO', 'CUSTO', 'RECEITA']),
  unidade: texto(1, 20),
  meta: z.number().finite().min(-9_999_999_999.99).max(9_999_999_999.99).multipleOf(0.01),
  sentido: z.enum(['MAIOR_MELHOR', 'MENOR_MELHOR'])
}).strict();

export const cenarioSchema = z.object({
  semente: z.number().int().min(-2_147_483_648).max(2_147_483_647),
  periodoInicio: z.string().date(),
  periodoFim: z.string().date(),
  volumeRegistros: z.number().int().min(1).max(10_000),
  perfil: z.enum(['OTIMISTA', 'REALISTA', 'CRITICO']),
  servicoIds: z.array(uuidSchema).min(1).max(10_000).refine((ids) => new Set(ids).size === ids.length)
}).strict().refine(({ periodoInicio, periodoFim }) => periodoInicio <= periodoFim, { message: 'O período de simulação é inválido.', path: ['periodoFim'] });

export const painelIndicadoresQuerySchema = z.object({ periodo: periodoMensalSchema.optional(), cenarioId: uuidSchema.optional() }).strict();
export const paginacaoSchema = z.object({ pagina: z.coerce.number().int().min(1).default(1), limite: z.coerce.number().int().min(1).max(100).default(20) }).strict();

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AtualizarOrganizacaoInput = z.infer<typeof atualizarOrganizacaoSchema>;
export type AnaliseAmbienteInput = z.infer<typeof analiseAmbienteSchema>;
export type EstrategiaInput = z.infer<typeof estrategiaSchema>;
export type ObjetivoInput = z.infer<typeof objetivoSchema>;
export type ServicoInput = z.infer<typeof servicoSchema>;
export type CustoServicoInput = z.infer<typeof custoServicoSchema>;
export type DemandaCapacidadeInput = z.infer<typeof demandaCapacidadeSchema>;
export type VinculoEstrategicoInput = z.infer<typeof vinculoEstrategicoSchema>;
export type IndicadorInput = z.infer<typeof indicadorSchema>;
export type CenarioInput = z.infer<typeof cenarioSchema>;

export interface RelatorioEstrategia {
  organizacao: { nome: string; setor: string | null; descricao: string | null };
  /** Ausente apenas para manter compatibilidade com respostas de versões anteriores da API. */
  analises?: { tipo: string; categoria: string; descricao: string; impacto: string | null }[];
  estrategia: { versao: number; atualizadaEm: string; perspectiva: string; posicao: string; plano: string; padrao: string } | null;
  objetivos: { codigo: string; descricao: string; prazo: string | null; status: string }[];
  servicos: {
    nome: string; descricao: string | null; publicoAlvo: string | null; status: string;
    vinculos: { objetivoCodigo: string; justificativaValor: string; contribuicao: number; indicador: { nome: string; tipo: string; unidade: string } | null }[];
    indicadores: {
      nome: string; tipo: string; unidade: string; meta: number; sentido: string;
      medicoes: { periodo: string; valor: number; denominador: number; origem: string; cenario: { id: string; semente: number; perfil: string; geradorVersao: string } | null }[];
    }[];
  }[];
}

export type Perfil = 'ALUNO' | 'PROFESSOR';
export interface UsuarioPublico { id: string; nome: string; email: string; perfil: Perfil }
export interface OrganizacaoPublica { id: string; nome: string; setor: string | null; descricao: string | null; criadaEm: string }
export interface AuthResponse { token: string; usuario: UsuarioPublico }
export interface ApiError { code: string; message: string; details?: unknown }
