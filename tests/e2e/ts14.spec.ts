import { expect, test } from '@playwright/test';

test('TS14 — login, painel e navegação do fluxo estratégico em Firefox', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail institucional').fill('aluno@eduitsm.local');
  await page.getByLabel('Senha').fill('EduITSM@2026');
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL(/\/painel$/);
  await expect(page.getByRole('heading', { name: /Painel inicial da organização/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /TechNova Retail/ })).toBeVisible();

  await page.getByRole('link', { name: /Análise de ambiente/ }).click();
  await expect(page).toHaveURL(/\/analise$/);
  await expect(page.getByRole('heading', { name: /Análise de ambiente/ })).toBeVisible();

  await page.getByRole('link', { name: /Estratégia \(4 Ps\)/ }).click();
  await expect(page).toHaveURL(/\/estrategia$/);
  await expect(page.getByRole('heading', { name: /Estratégia/ })).toBeVisible();

  await page.getByRole('link', { name: /Relatório da estratégia/ }).click();
  await expect(page).toHaveURL(/\/relatorios\/estrategia$/);
  await expect(page.getByRole('heading', { name: /Relatório/ })).toBeVisible();
});
