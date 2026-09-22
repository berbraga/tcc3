-- Mantém vínculos existentes sem indicador; nenhuma associação é inferida.
ALTER TABLE "vinculo_estrategico" ADD COLUMN "indicador_id" UUID;

CREATE INDEX "vinculo_estrategico_indicador_id_idx" ON "vinculo_estrategico"("indicador_id");

ALTER TABLE "vinculo_estrategico"
  ADD CONSTRAINT "vinculo_estrategico_indicador_id_fkey"
  FOREIGN KEY ("indicador_id") REFERENCES "indicador"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
