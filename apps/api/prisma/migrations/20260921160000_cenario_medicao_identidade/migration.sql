-- Preserva medições históricas sem cenário e passa a identificar cada medição simulada.
ALTER TABLE "cenario_simulacao"
  ADD COLUMN "gerador_versao" VARCHAR(20) NOT NULL DEFAULT '1',
  ADD COLUMN "chave_reproducao" VARCHAR(64),
  ADD COLUMN "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "cenario_simulacao"
SET "chave_reproducao" = 'legacy:' || "id"::text
WHERE "chave_reproducao" IS NULL;

ALTER TABLE "cenario_simulacao"
  ALTER COLUMN "chave_reproducao" SET NOT NULL;

CREATE UNIQUE INDEX "cenario_simulacao_organizacao_id_chave_reproducao_key"
  ON "cenario_simulacao"("organizacao_id", "chave_reproducao");

ALTER TABLE "medicao"
  ADD COLUMN "cenario_id" UUID,
  ADD COLUMN "denominador" INTEGER NOT NULL DEFAULT 0;

DROP INDEX "medicao_indicador_id_periodo_ref_key";

CREATE UNIQUE INDEX "medicao_indicador_id_periodo_ref_cenario_id_key"
  ON "medicao"("indicador_id", "periodo_ref", "cenario_id");

CREATE INDEX "medicao_cenario_id_idx" ON "medicao"("cenario_id");

ALTER TABLE "medicao"
  ADD CONSTRAINT "medicao_cenario_id_fkey"
  FOREIGN KEY ("cenario_id") REFERENCES "cenario_simulacao"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
