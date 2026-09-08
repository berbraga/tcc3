-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('ALUNO', 'PROFESSOR');

-- CreateEnum
CREATE TYPE "TipoAmbiente" AS ENUM ('INTERNO', 'EXTERNO');

-- CreateEnum
CREATE TYPE "CategoriaSwot" AS ENUM ('FORCA', 'FRAQUEZA', 'OPORTUNIDADE', 'AMEACA');

-- CreateEnum
CREATE TYPE "NivelImpacto" AS ENUM ('BAIXO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "StatusObjetivo" AS ENUM ('ATIVO', 'ATINGIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusServico" AS ENUM ('PROPOSTO', 'EM_DESENHO', 'EM_OPERACAO', 'DESCONTINUADO');

-- CreateEnum
CREATE TYPE "TipoCusto" AS ENUM ('CAPEX', 'OPEX');

-- CreateEnum
CREATE TYPE "TipoIndicador" AS ENUM ('SLA', 'SATISFACAO', 'TEMPO_ATENDIMENTO', 'CUSTO', 'RECEITA');

-- CreateEnum
CREATE TYPE "SentidoMeta" AS ENUM ('MAIOR_MELHOR', 'MENOR_MELHOR');

-- CreateEnum
CREATE TYPE "PerfilCenario" AS ENUM ('OTIMISTA', 'REALISTA', 'CRITICO');

-- CreateEnum
CREATE TYPE "OrigemMedicao" AS ENUM ('SIMULADO', 'MANUAL');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizacao" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "setor" VARCHAR(80),
    "descricao" TEXT,
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analise_ambiente" (
    "id" UUID NOT NULL,
    "organizacao_id" UUID NOT NULL,
    "tipo" "TipoAmbiente" NOT NULL,
    "categoria" "CategoriaSwot" NOT NULL,
    "descricao" TEXT NOT NULL,
    "impacto" "NivelImpacto",

    CONSTRAINT "analise_ambiente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estrategia_servico" (
    "id" UUID NOT NULL,
    "organizacao_id" UUID NOT NULL,
    "perspectiva" TEXT,
    "posicao" TEXT,
    "plano" TEXT,
    "padrao" TEXT,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "atualizada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estrategia_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "objetivo_estrategico" (
    "id" UUID NOT NULL,
    "organizacao_id" UUID NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "descricao" TEXT NOT NULL,
    "prazo" DATE,
    "status" "StatusObjetivo" NOT NULL DEFAULT 'ATIVO',

    CONSTRAINT "objetivo_estrategico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servico" (
    "id" UUID NOT NULL,
    "organizacao_id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "descricao" TEXT,
    "publico_alvo" VARCHAR(120),
    "status" "StatusServico" NOT NULL DEFAULT 'PROPOSTO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custo_servico" (
    "id" UUID NOT NULL,
    "servico_id" UUID NOT NULL,
    "tipo" "TipoCusto" NOT NULL,
    "valor_previsto" DECIMAL(12,2) NOT NULL,
    "valor_realizado" DECIMAL(12,2),
    "periodo" VARCHAR(10) NOT NULL,

    CONSTRAINT "custo_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demanda_capacidade" (
    "id" UUID NOT NULL,
    "servico_id" UUID NOT NULL,
    "periodo" VARCHAR(10) NOT NULL,
    "demanda_prevista" INTEGER NOT NULL,
    "capacidade_instalada" INTEGER NOT NULL,
    "unidade" VARCHAR(30) NOT NULL,

    CONSTRAINT "demanda_capacidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vinculo_estrategico" (
    "id" UUID NOT NULL,
    "servico_id" UUID NOT NULL,
    "objetivo_id" UUID NOT NULL,
    "justificativa_valor" TEXT NOT NULL,
    "contribuicao" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "vinculo_estrategico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicador" (
    "id" UUID NOT NULL,
    "servico_id" UUID NOT NULL,
    "objetivo_id" UUID,
    "nome" VARCHAR(120) NOT NULL,
    "tipo" "TipoIndicador" NOT NULL,
    "unidade" VARCHAR(20) NOT NULL,
    "meta" DECIMAL(12,2) NOT NULL,
    "sentido" "SentidoMeta" NOT NULL,

    CONSTRAINT "indicador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicao" (
    "id" UUID NOT NULL,
    "indicador_id" UUID NOT NULL,
    "periodo_ref" DATE NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "origem" "OrigemMedicao" NOT NULL DEFAULT 'SIMULADO',

    CONSTRAINT "medicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cenario_simulacao" (
    "id" UUID NOT NULL,
    "organizacao_id" UUID NOT NULL,
    "semente" INTEGER NOT NULL,
    "periodo_inicio" DATE NOT NULL,
    "periodo_fim" DATE NOT NULL,
    "volume_registros" INTEGER NOT NULL,
    "perfil" "PerfilCenario" NOT NULL,

    CONSTRAINT "cenario_simulacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_operacional" (
    "id" UUID NOT NULL,
    "servico_id" UUID NOT NULL,
    "cenario_id" UUID NOT NULL,
    "data_abertura" TIMESTAMP(3) NOT NULL,
    "data_fechamento" TIMESTAMP(3),
    "tempo_atendimento_min" INTEGER,
    "sla_cumprido" BOOLEAN NOT NULL,
    "nota_satisfacao" INTEGER,

    CONSTRAINT "registro_operacional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizacao_usuario_id_key" ON "organizacao"("usuario_id");

-- CreateIndex
CREATE INDEX "analise_ambiente_organizacao_id_idx" ON "analise_ambiente"("organizacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "estrategia_servico_organizacao_id_versao_key" ON "estrategia_servico"("organizacao_id", "versao");

-- CreateIndex
CREATE INDEX "objetivo_estrategico_organizacao_id_idx" ON "objetivo_estrategico"("organizacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "objetivo_estrategico_organizacao_id_codigo_key" ON "objetivo_estrategico"("organizacao_id", "codigo");

-- CreateIndex
CREATE INDEX "servico_organizacao_id_idx" ON "servico"("organizacao_id");

-- CreateIndex
CREATE INDEX "custo_servico_servico_id_idx" ON "custo_servico"("servico_id");

-- CreateIndex
CREATE INDEX "demanda_capacidade_servico_id_idx" ON "demanda_capacidade"("servico_id");

-- CreateIndex
CREATE INDEX "vinculo_estrategico_objetivo_id_idx" ON "vinculo_estrategico"("objetivo_id");

-- CreateIndex
CREATE UNIQUE INDEX "vinculo_estrategico_servico_id_objetivo_id_key" ON "vinculo_estrategico"("servico_id", "objetivo_id");

-- CreateIndex
CREATE INDEX "indicador_servico_id_idx" ON "indicador"("servico_id");

-- CreateIndex
CREATE INDEX "indicador_objetivo_id_idx" ON "indicador"("objetivo_id");

-- CreateIndex
CREATE INDEX "medicao_indicador_id_periodo_ref_idx" ON "medicao"("indicador_id", "periodo_ref");

-- CreateIndex
CREATE UNIQUE INDEX "medicao_indicador_id_periodo_ref_key" ON "medicao"("indicador_id", "periodo_ref");

-- CreateIndex
CREATE INDEX "cenario_simulacao_organizacao_id_idx" ON "cenario_simulacao"("organizacao_id");

-- CreateIndex
CREATE INDEX "registro_operacional_servico_id_data_abertura_idx" ON "registro_operacional"("servico_id", "data_abertura");

-- CreateIndex
CREATE INDEX "registro_operacional_cenario_id_idx" ON "registro_operacional"("cenario_id");

-- AddForeignKey
ALTER TABLE "organizacao" ADD CONSTRAINT "organizacao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analise_ambiente" ADD CONSTRAINT "analise_ambiente_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estrategia_servico" ADD CONSTRAINT "estrategia_servico_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "objetivo_estrategico" ADD CONSTRAINT "objetivo_estrategico_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servico" ADD CONSTRAINT "servico_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custo_servico" ADD CONSTRAINT "custo_servico_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "demanda_capacidade" ADD CONSTRAINT "demanda_capacidade_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculo_estrategico" ADD CONSTRAINT "vinculo_estrategico_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vinculo_estrategico" ADD CONSTRAINT "vinculo_estrategico_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivo_estrategico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_objetivo_id_fkey" FOREIGN KEY ("objetivo_id") REFERENCES "objetivo_estrategico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicao" ADD CONSTRAINT "medicao_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cenario_simulacao" ADD CONSTRAINT "cenario_simulacao_organizacao_id_fkey" FOREIGN KEY ("organizacao_id") REFERENCES "organizacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_operacional" ADD CONSTRAINT "registro_operacional_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_operacional" ADD CONSTRAINT "registro_operacional_cenario_id_fkey" FOREIGN KEY ("cenario_id") REFERENCES "cenario_simulacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
