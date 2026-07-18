const fs = require('fs');
const path = require('path');

// Carpetas que queremos ignorar para no saturar la terminal
const carpetasIgnoradas = ['node_modules', '.git', '.next', 'dist', 'build'];

function listarArchivos(rutaDirectorio, prefijo = '') {
  // Verificar si la carpeta existe antes de leerla
  if (!fs.existsSync(rutaDirectorio)) {
    console.log(`⚠️ La ruta no existe: ${rutaDirectorio}`);
    return;
  }

  const elementos = fs.readdirSync(rutaDirectorio);

  elementos.forEach((elemento, indice) => {
    // Evitar leer carpetas pesadas de dependencias o compilación
    if (carpetasIgnoradas.includes(elemento)) return;

    const rutaCompleta = path.join(rutaDirectorio, elemento);
    const esUltimo = indice === elementos.length - 1;
    const conector = esUltimo ? '└── ' : '├── ';
    
    // Imprimir el archivo o carpeta actual
    console.log(`${prefijo}${conector}${elemento}`);

    // Si es una carpeta, leer su contenido de forma recursiva
    const estadisticas = fs.statSync(rutaCompleta);
    if (estadisticas.isDirectory()) {
      const nuevoPrefijo = prefijo + (esUltimo ? '    ' : '│   ');
      listarArchivos(rutaCompleta, nuevoPrefijo);
    }
  });
}

// Ejecutar la lectura para backend y frontend
console.log('📂 Estructura actual de tu proyecto:\n');

console.log('📦 backend');
listarArchivos(path.join(process.cwd(), 'backend'), '  ');

console.log('\n📦 frontend');
listarArchivos(path.join(process.cwd(), 'frontend'), '  ');
