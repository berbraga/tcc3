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

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AtualizarOrganizacaoInput = z.infer<typeof atualizarOrganizacaoSchema>;
export type AnaliseAmbienteInput = z.infer<typeof analiseAmbienteSchema>;
export type EstrategiaInput = z.infer<typeof estrategiaSchema>;

export type Perfil = 'ALUNO' | 'PROFESSOR';
export interface UsuarioPublico { id: string; nome: string; email: string; perfil: Perfil }
export interface OrganizacaoPublica { id: string; nome: string; setor: string | null; descricao: string | null; criadaEm: string }
export interface AuthResponse { token: string; usuario: UsuarioPublico }
export interface ApiError { code: string; message: string; details?: unknown }
