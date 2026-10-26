export const missoes = [
  { titulo: 'Analisar o ambiente', descricao: 'Registre pelo menos um item SWOT para entender o contexto da organização.', href: '/analise' },
  { titulo: 'Definir a direção', descricao: 'Preencha os quatro Ps para transformar a análise em uma direção estratégica.', href: '/estrategia' },
  { titulo: 'Organizar os serviços', descricao: 'Crie um objetivo e um serviço que apoiem a estratégia.', href: '/objetivos' },
  { titulo: 'Operar e medir', descricao: 'Configure um indicador e execute uma simulação com um serviço em operação.', href: '/servicos' },
  { titulo: 'Avaliar e melhorar', descricao: 'Interprete os resultados e revise a estratégia criando uma nova versão.', href: '/indicadores/painel' }
] as const;

const chave = (usuarioId: string) => `eduitsm.missao.${usuarioId}`;

export function lerMissao(usuarioId: string): number {
  const valor = Number(localStorage.getItem(chave(usuarioId)) ?? '0');
  return Number.isInteger(valor) && valor >= 0 && valor <= missoes.length ? valor : 0;
}

export function concluirMissao(usuarioId: string): number {
  const atual = lerMissao(usuarioId);
  const proxima = Math.min(atual + 1, missoes.length);
  localStorage.setItem(chave(usuarioId), String(proxima));
  window.dispatchEvent(new CustomEvent('eduitsm:missao-atualizada'));
  return proxima;
}
