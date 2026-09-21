-- PostgreSQL considera NULLs distintos em índices compostos. Este índice parcial
-- preserva a regra histórica para medições manuais/legadas sem cenário, sem impedir
-- uma medição equivalente para cada cenário identificado.
CREATE UNIQUE INDEX "medicao_indicador_id_periodo_ref_sem_cenario_key"
  ON "medicao"("indicador_id", "periodo_ref")
  WHERE "cenario_id" IS NULL;
