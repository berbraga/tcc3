/* global process, URL */
import { spawn, spawnSync } from 'node:child_process';

const env = {
  ...process.env,
  NODE_ENV: 'test',
  EDUITSM_DEMO_SEED: 'true',
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://eduitsm:eduitsm_dev@localhost:5432/eduitsm?schema=e2e',
  JWT_SECRET: process.env.JWT_SECRET ?? 'eduitsm-e2e-secret-at-least-32-characters',
  JWT_EXPIRES_IN: '1h',
  API_PORT: '3333',
  WEB_ORIGIN: 'http://127.0.0.1:5173'
};

const run = (command, args) => {
  const result = spawnSync(command, args, { cwd: new URL('../..', import.meta.url), env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run('npm', ['run', 'db:deploy', '-w', '@eduitsm/api']);
run('npm', ['run', 'db:seed', '-w', '@eduitsm/api']);

const server = spawn('node', ['--import', 'tsx', 'src/server.ts'], { cwd: new URL('../../apps/api', import.meta.url), env, stdio: 'inherit' });
const stop = () => server.kill('SIGTERM');
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
server.on('exit', (code) => process.exit(code ?? 0));
