const { spawn } = require('child_process');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
process.env.PATH = `${androidDir};${process.env.PATH}`;

const args = ['react-native', 'run-android', ...process.argv.slice(2)];
const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
