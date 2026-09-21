import { carregarAmbienteDaRaiz } from '../src/config/root-env.js';
import { executarComandosDeTeste } from './test-runner.js';

carregarAmbienteDaRaiz();
executarComandosDeTeste(process.env);
