export type GeradorPseudoaleatorio = () => number;

export function criarPrng(seed: number): GeradorPseudoaleatorio {
  let estado = seed >>> 0;

  return () => {
    estado += 0x6d2b79f5;
    let valor = estado;
    valor = Math.imul(valor ^ (valor >>> 15), valor | 1);
    valor ^= valor + Math.imul(valor ^ (valor >>> 7), valor | 61);
    return ((valor ^ (valor >>> 14)) >>> 0) / 4_294_967_296;
  };
}
