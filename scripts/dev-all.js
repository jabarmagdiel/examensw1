import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Iniciando entorno de desarrollo desacoplado (Backend + Frontend)...');

// Iniciar Backend
const backend = spawn('node', ['backend/src/index.js'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

// Iniciar Frontend (Vite)
const frontend = spawn('npx', ['vite'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\n🛑 Deteniendo servicios...');
  backend.kill();
  frontend.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
