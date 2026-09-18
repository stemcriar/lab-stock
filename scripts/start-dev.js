import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('Iniciando LabStock (Servidor Backend SQLite + Frontend Vite)...');

// Start backend server
const serverProcess = spawn('node', ['server/index.js'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
});

// Start frontend vite client
const clientProcess = spawn('npx', ['vite', '--config', 'config/vite.config.ts'], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true,
});

function cleanup() {
  console.log('\nEncerrando processos...');
  try {
    serverProcess.kill();
    clientProcess.kill();
  } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
