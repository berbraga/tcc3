import { spawnSync } from 'node:child_process';
import { carregarAmbienteDaRaiz } from '../src/config/root-env.js';

const [comando, ...argumentos] = process.argv.slice(2);
if (!comando) {
  throw new Error('Informe o comando que deve receber o ambiente da raiz.');
}

carregarAmbienteDaRaiz();
const resultado = spawnSync(comando, argumentos, { stdio: 'inherit', env: process.env });
process.exitCode = resultado.status ?? 1;
