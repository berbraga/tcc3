import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { validarAmbienteSeedDemo } from '../src/config/seed-demo.js';
import { popularDadosDemonstracao } from '../src/modules/demo/seed.service.js';

const db = new PrismaClient();

async function main() {
  validarAmbienteSeedDemo(process.env);
  await popularDadosDemonstracao(db, hash);
}

main()
  .then(() => console.log('Seed EduITSM concluído.'))
  .finally(() => db.$disconnect());
