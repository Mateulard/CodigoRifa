const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Funci贸n para escribir logs
function log(message) {
  const logMessage = `${new Date().toISOString()}: ${message}\n`;
  const logPath = path.join(process.cwd(), 'launcher.log');
  fs.appendFileSync(logPath, logMessage);
}

// Asegurarse de que el archivo de log existe
const logPath = path.join(process.cwd(), 'launcher.log');
if (!fs.existsSync(logPath)) {
  fs.writeFileSync(logPath, '');
}

log('Iniciando launcher...');

// Configuraci贸n para ocultar la ventana de comando
const hideWindow = {
  windowsHide: true,
  stdio: 'ignore'
};

// Primer comando - cd y node api
const servicesPath = path.join(process.cwd(), 'src', 'services');
log(`Ejecutando API en: ${servicesPath}`);

const apiProcess = exec('cd ' + servicesPath + ' && node api', hideWindow);

apiProcess.on('error', (error) => {
  log(`Error al iniciar API: ${error.message}`);
});

// Esperar a que la API se inicie
setTimeout(() => {
  log('Iniciando aplicaci贸n React...');
  
  // Segundo comando - npm start
  const reactProcess = exec('npm start', hideWindow);

  reactProcess.on('error', (error) => {
    log(`Error al iniciar la aplicaci贸n React: ${error.message}`);
  });

  // Mantener el proceso principal activo
  process.stdin.resume();

  // Manejar el cierre del proceso
  process.on('SIGINT', () => {
    log('Cerrando procesos...');
    apiProcess.kill();
    reactProcess.kill();
    process.exit();
  });

}, 2000);

log('Launcher iniciado correctamente.');
