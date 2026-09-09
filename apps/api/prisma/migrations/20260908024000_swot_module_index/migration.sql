-- Replace the organization-only index with one that also supports SWOT category grouping.
-- This migration changes no existing rows.
DROP INDEX "analise_ambiente_organizacao_id_idx";
CREATE INDEX "analise_ambiente_organizacao_id_categoria_idx" ON "analise_ambiente"("organizacao_id", "categoria");
