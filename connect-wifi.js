const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('🔌 Digite a porta do Wireless Debugging (ex: 45035): ', (port) => {
  port = port.trim();
  if (!port) {
    console.log('Nenhuma porta digitada. Pulando conexao adb...');
    rl.close();
    process.exit(0);
  }

  const adbPath = `${process.env.LOCALAPPDATA}\\Android\\Sdk\\platform-tools\\adb`;
  const ip = '192.168.2.101';
  
  try {
    console.log(`\n⏳ Conectando no celular (${ip}:${port})...`);
    execSync(`"${adbPath}" connect ${ip}:${port}`, { stdio: 'inherit' });
    
    console.log('🔄 Espelhando a porta 8081 do Metro...');
    execSync(`"${adbPath}" reverse tcp:8081 tcp:8081`, { stdio: 'inherit' });
    
    console.log('✅ Tudo pronto!\n');
  } catch (err) {
    console.error('❌ Erro ao executar adb:', err.message);
  }
  
  rl.close();
});
