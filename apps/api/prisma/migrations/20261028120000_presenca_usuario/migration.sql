CREATE TABLE "presenca_usuario" (
  "usuario_id" UUID NOT NULL,
  "ultima_atividade" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "pagina_atual" VARCHAR(120) NOT NULL,
  "missao_atual" INTEGER,
  "ultima_acao" VARCHAR(160),
  CONSTRAINT "presenca_usuario_pkey" PRIMARY KEY ("usuario_id"),
  CONSTRAINT "presenca_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "presenca_usuario_ultima_atividade_idx" ON "presenca_usuario"("ultima_atividade");
