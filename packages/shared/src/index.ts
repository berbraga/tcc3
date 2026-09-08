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
}).strict();

const pEstrategia = z.string().trim().max(4000).nullable();
export const estrategiaSchema = z.object({
  perspectiva: pEstrategia,
  posicao: pEstrategia,
  plano: pEstrategia,
  padrao: pEstrategia
}).strict();

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

const periodoMensalSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
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

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AtualizarOrganizacaoInput = z.infer<typeof atualizarOrganizacaoSchema>;
export type AnaliseAmbienteInput = z.infer<typeof analiseAmbienteSchema>;
export type EstrategiaInput = z.infer<typeof estrategiaSchema>;
export type ObjetivoInput = z.infer<typeof objetivoSchema>;
export type ServicoInput = z.infer<typeof servicoSchema>;
export type CustoServicoInput = z.infer<typeof custoServicoSchema>;
export type DemandaCapacidadeInput = z.infer<typeof demandaCapacidadeSchema>;

export type Perfil = 'ALUNO' | 'PROFESSOR';
export interface UsuarioPublico { id: string; nome: string; email: string; perfil: Perfil }
export interface OrganizacaoPublica { id: string; nome: string; setor: string | null; descricao: string | null; criadaEm: string }
export interface AuthResponse { token: string; usuario: UsuarioPublico }
export interface ApiError { code: string; message: string; details?: unknown }
