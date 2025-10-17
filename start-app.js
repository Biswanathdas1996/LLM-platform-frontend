#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Start the backend server
console.log('Starting backend server...');
const backend = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development', PORT: '5000' }
});

// Give backend time to start, then start frontend
setTimeout(() => {
  console.log('Starting frontend...');
  const frontend = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit', 
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  backend.on('exit', (code) => {
    console.log(`Backend exited with code ${code}`);
    frontend.kill();
    process.exit(code);
  });

  frontend.on('exit', (code) => {
    console.log(`Frontend exited with code ${code}`);
    backend.kill();
    process.exit(code);
  });
}, 2000);