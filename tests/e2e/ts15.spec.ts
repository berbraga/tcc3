import { expect, test, type Page } from '@playwright/test';

const aluno = { email: 'aluno@eduitsm.local', senha: 'EduITSM@2026' };
const professor = { email: 'professor@eduitsm.local', senha: 'EduITSM@2026' };

async function entrar(page: Page, conta: typeof aluno) {
  await page.goto('/login');
  await page.getByLabel('E-mail institucional').fill(conta.email);
  await page.getByLabel('Senha').fill(conta.senha);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(/\/painel$/);
}

async function abrirMenu(page: Page, nome: RegExp) {
  await page.getByRole('link', { name: nome }).click();
}

async function selecionarOpcaoPorTexto(page: Page, rotulo: string, texto: string) {
  const select = page.getByLabel(rotulo);
  const opcao = select.locator('option').filter({ hasText: texto }).first();
  const valor = await opcao.getAttribute('value');
  expect(valor).not.toBeNull();
  await select.selectOption(valor!);
}

test('TS15 — aluno percorre a estratégia e professor acompanha sem escrever no ambiente do aluno', async ({ page }, testInfo) => {
  const marcador = `E2E-${testInfo.project.name}-${Date.now()}`;
  const semente = 100_000_000 + Number(marcador.match(/\d+$/)?.[0].slice(-8) ?? '1');
  const codigoObjetivo = `OE-${testInfo.project.name.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-5)}`;
  const nomeServico = `Serviço ${marcador}`;
  const nomeIndicador = `SLA ${marcador}`;
  const nomeIndicadorSegundoServico = `Tempo ${marcador}`;

  await entrar(page, aluno);
  await expect(page.getByRole('heading', { name: /TechNova Retail/ })).toBeVisible();
  await page.getByRole('button', { name: 'Editar organização' }).click();
  await page.getByLabel('Descrição').fill(`Organização validada na jornada ${marcador}.`);
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('status')).toContainText('Organização atualizada com sucesso');

  await abrirMenu(page, /Análise de ambiente/);
  await page.getByLabel('Descrição').fill(`Força operacional ${marcador}`);
  await page.getByRole('button', { name: 'Adicionar item' }).click();
  await expect(page.getByRole('status')).toContainText('Item adicionado com sucesso');

  await abrirMenu(page, /Estratégia \(4 Ps\)/);
  await page.getByLabel('Perspectiva — visão e propósito').fill(`Perspectiva ${marcador}`);
  await page.getByLabel('Posição — diferenciação competitiva').fill(`Posição ${marcador}`);
  await page.getByLabel('Plano — como a visão será executada').fill(`Plano ${marcador}`);
  await page.getByLabel('Padrão — comportamento recorrente').fill(`Padrão ${marcador}`);
  await page.getByRole('button', { name: 'Salvar estratégia' }).click();
  await expect(page.getByRole('status')).toContainText(/Estratégia salva como versão/);

  await abrirMenu(page, /Objetivos estratégicos/);
  await page.getByLabel('Código').fill(codigoObjetivo);
  await page.getByLabel('Descrição').fill(`Objetivo criado pela jornada ${marcador}`);
  await page.getByLabel('Prazo').fill('2026-12-31');
  await page.getByRole('button', { name: 'Adicionar objetivo' }).click();
  await expect(page.getByRole('status')).toContainText('Objetivo adicionado com sucesso');

  await abrirMenu(page, /Serviços de TI/);
  await page.getByLabel('Nome do serviço').fill(nomeServico);
  await page.getByLabel('Status no ciclo de vida').selectOption('EM_DESENHO');
  await page.getByRole('button', { name: 'Salvar serviço' }).click();
  await expect(page.getByRole('status')).toContainText('Serviço adicionado com sucesso');
  await page.getByRole('button', { name: /Editar Portal de Vendas Corporativas/ }).click();
  await page.getByLabel('Status no ciclo de vida').selectOption('EM_OPERACAO');
  await page.getByRole('button', { name: 'Salvar serviço' }).click();
  await expect(page.getByRole('status')).toContainText('Serviço atualizado com sucesso');

  await page.getByRole('link', { name: /Custos de Portal de Vendas Corporativas/ }).click();
  await page.getByLabel('Período').fill('2026-10');
  await page.getByLabel('Valor previsto').fill('1000');
  await page.getByLabel('Valor realizado').fill('950');
  await page.getByRole('button', { name: 'Adicionar lançamento' }).click();
  await expect(page.getByRole('status')).toContainText('Lançamento adicionado com sucesso');

  await abrirMenu(page, /Serviços de TI/);
  await page.getByRole('link', { name: /Demanda de Portal de Vendas Corporativas/ }).click();
  await page.getByLabel('Período').fill('2026-10');
  await page.getByLabel('Demanda prevista').fill('100');
  await page.getByLabel('Capacidade instalada').fill('120');
  await page.getByLabel('Unidade').fill('transações');
  await page.getByRole('button', { name: 'Adicionar período' }).click();
  await expect(page.getByRole('status')).toContainText('Período adicionado com sucesso');

  await abrirMenu(page, /Indicadores/);
  await selecionarOpcaoPorTexto(page, 'Serviço', 'Portal de Vendas Corporativas');
  await page.getByLabel('Nome do indicador').fill(nomeIndicador);
  await page.getByLabel('Tipo').selectOption('SLA');
  await selecionarOpcaoPorTexto(page, 'Objetivo vinculado', codigoObjetivo);
  await page.getByLabel('Unidade').fill('%');
  await page.getByLabel('Meta').fill('90');
  await page.getByLabel('Sentido').selectOption('MAIOR_MELHOR');
  await page.getByRole('button', { name: 'Adicionar indicador' }).click();
  await expect(page.getByRole('status')).toContainText('Indicador salvo com sucesso');

  await abrirMenu(page, /Vínculo estratégico/);
  await selecionarOpcaoPorTexto(page, 'Serviço de TI', 'Portal de Vendas Corporativas');
  await selecionarOpcaoPorTexto(page, 'Objetivo estratégico do negócio', codigoObjetivo);
  await selecionarOpcaoPorTexto(page, 'Indicador que demonstra a contribuição', nomeIndicador);
  await page.getByLabel('Justificativa de valor').fill(`Justificativa ${marcador}`);
  await page.getByLabel('Contribuição estimada').fill('35');
  await page.getByRole('button', { name: 'Salvar vínculo' }).click();
  await expect(page.getByRole('status')).toContainText('Vínculo salvo com sucesso');
  await expect(page.getByRole('row').filter({ hasText: nomeIndicador }).filter({ hasText: '35%' })).toBeVisible();

  await abrirMenu(page, /Indicadores/);
  await selecionarOpcaoPorTexto(page, 'Serviço', nomeServico);
  await page.getByLabel('Nome do indicador').fill(nomeIndicadorSegundoServico);
  await page.getByLabel('Tipo').selectOption('TEMPO_ATENDIMENTO');
  await selecionarOpcaoPorTexto(page, 'Objetivo vinculado', codigoObjetivo);
  await page.getByLabel('Unidade').fill('minutos');
  await page.getByLabel('Meta').fill('15');
  await page.getByLabel('Sentido').selectOption('MENOR_MELHOR');
  await page.getByRole('button', { name: 'Adicionar indicador' }).click();
  await expect(page.getByRole('status')).toContainText('Indicador salvo com sucesso');

  await abrirMenu(page, /Vínculo estratégico/);
  await selecionarOpcaoPorTexto(page, 'Serviço de TI', nomeServico);
  await selecionarOpcaoPorTexto(page, 'Objetivo estratégico do negócio', codigoObjetivo);
  await selecionarOpcaoPorTexto(page, 'Indicador que demonstra a contribuição', nomeIndicadorSegundoServico);
  await page.getByLabel('Justificativa de valor').fill(`Segundo vínculo ${marcador}`);
  await page.getByLabel('Contribuição estimada').fill('70');
  await page.getByRole('button', { name: 'Salvar vínculo' }).click();
  await expect(page.getByRole('alert')).toContainText('Saldo disponível: 65%');
  await expect(page.getByLabel('Justificativa de valor')).toHaveValue(`Segundo vínculo ${marcador}`);
  await expect(page.getByLabel('Contribuição estimada')).toHaveValue('70');
  await page.getByLabel('Contribuição estimada').fill('65');
  await page.getByRole('button', { name: 'Salvar vínculo' }).click();
  await expect(page.getByRole('status')).toContainText('Vínculo salvo com sucesso');
  await expect(page.getByRole('row').filter({ hasText: nomeIndicadorSegundoServico }).filter({ hasText: '65%' })).toBeVisible();

  await abrirMenu(page, /Cenário de simulação/);
  const portal = page.getByRole('checkbox', { name: /Portal de Vendas Corporativas/ });
  const caixas = page.getByRole('checkbox');
  for (let indice = 0; indice < await caixas.count(); indice += 1) {
    const caixa = caixas.nth(indice);
    if (await caixa.isChecked()) await caixa.uncheck();
  }
  await portal.check();
  await page.getByLabel('Semente').fill(String(semente));
  await page.getByLabel('Início do período').fill('2026-10-01');
  await page.getByLabel('Fim do período').fill('2026-10-31');
  await page.getByLabel('Volume de registros').fill('12');
  await page.getByRole('button', { name: 'Executar simulação' }).click();
  await expect(page.getByRole('status')).toContainText(/Simulação concluída: 12 registros/);
  await page.getByRole('link', { name: 'Ver painel de indicadores' }).click();
  await expect(page.getByRole('heading', { name: /Painel de indicadores/ })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: nomeIndicador }).filter({ hasText: '12 registros válidos' })).toBeVisible();

  await page.getByRole('link', { name: 'Revisar estratégia' }).first().click();
  await page.getByLabel('Plano — como a visão será executada').fill(`Plano revisado ${marcador}`);
  await page.getByRole('button', { name: 'Salvar estratégia' }).click();
  await expect(page.getByRole('status')).toContainText(/Estratégia salva como versão/);
  await abrirMenu(page, /Relatório da estratégia/);
  await expect(page.getByText(nomeIndicador, { exact: true }).last()).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar relatório' }).click();
  const arquivo = await download;
  await expect(arquivo.suggestedFilename()).toBe('relatorio-estrategia.pdf');
  const destino = testInfo.outputPath('relatorio-estrategia.pdf');
  await arquivo.saveAs(destino);
  expect(await arquivo.failure()).toBeNull();

  await page.getByRole('button', { name: 'Sair' }).click();
  await entrar(page, professor);
  await abrirMenu(page, /Acompanhamento de alunos/);
  await page.getByRole('link', { name: 'Abrir ambiente de Bernardo Aluno' }).click();
  await expect(page.getByText('Ambiente do aluno em modo somente leitura')).toBeVisible();
  const organizacaoAlunoId = new URL(page.url()).pathname.split('/').pop();
  const proibida = await page.evaluate(async (id) => {
    const sessao = JSON.parse(sessionStorage.getItem('eduitsm.auth') ?? '{}');
    const resposta = await fetch(`http://127.0.0.1:3333/api/v1/professor/ambientes/${id}`, {
      method: 'POST', headers: { Authorization: `Bearer ${sessao.token}` }
    });
    return { status: resposta.status, body: await resposta.json() };
  }, organizacaoAlunoId);
  expect(proibida).toMatchObject({ status: 403, body: { code: 'ACESSO_NEGADO' } });

  await abrirMenu(page, /Painel inicial/);
  await page.getByRole('button', { name: 'Editar organização' }).click();
  await page.getByLabel('Descrição').fill(`Ambiente do professor atualizado pela jornada ${marcador}.`);
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('status')).toContainText('Organização atualizada com sucesso');
});
