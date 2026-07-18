const fs = require('fs');
const path = require('path');

// 1. Configuración de carpetas
const carpetasAAnalizar = ['frontend', 'backend'];
const archivoSalida = 'codigo_completo.txt';

// 2. Filtros: Evitar carpetas pesadas y archivos que no son código de texto
const directoriosIgnorados = new Set([
    '.git', 'node_modules', 'dist', 'build', 
    '.next', 'out', '__pycache__', '.venv', 'coverage'
]);

const extensionesIgnoradas = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.mp4', 
    '.pdf', '.zip', '.exe', '.woff', '.woff2', '.ttf', '.eot'
]);

console.log("Iniciando la lectura de archivos...\n");

// Limpiamos el archivo de salida si ya existía e iniciamos el encabezado
fs.writeFileSync(archivoSalida, "ESTE ES EL CÓDIGO COMPLETO DEL PROYECTO (FRONTEND Y BACKEND)\n\n", 'utf8');

// Función recursiva para leer el contenido de las carpetas
function procesarCarpeta(rutaActual) {
    if (!fs.existsSync(rutaActual)) {
        console.log(`⚠️ La carpeta '${rutaActual}' no existe. Saltando...`);
        return;
    }

    const elementos = fs.readdirSync(rutaActual);

    for (const elemento of elementos) {
        const rutaCompleta = path.join(rutaActual, elemento);
        
        try {
            const estadisticas = fs.statSync(rutaCompleta);

            // Si es carpeta, revisamos si debemos ignorarla o entrar en ella
            if (estadisticas.isDirectory()) {
                if (!directoriosIgnorados.has(elemento)) {
                    procesarCarpeta(rutaCompleta); 
                }
            } 
            // Si es archivo, revisamos la extensión
            else if (estadisticas.isFile()) {
                const extension = path.extname(elemento).toLowerCase();
                
                if (!extensionesIgnoradas.has(extension)) {
                    const contenido = fs.readFileSync(rutaCompleta, 'utf8');
                    
                    const separador = "=".repeat(60);
                    const bloqueTexto = `\n${separador}\nRUTA DEL ARCHIVO: ${rutaCompleta}\n${separador}\n\n${contenido}\n`;
                    
                    fs.appendFileSync(archivoSalida, bloqueTexto, 'utf8');
                    console.log(`✅ Agregado: ${rutaCompleta}`);
                }
            }
        } catch (error) {
            console.error(`❌ Error leyendo ${rutaCompleta}: ${error.message}`);
        }
    }
}

// Ejecutar el proceso para cada carpeta configurada
carpetasAAnalizar.forEach(carpeta => {
    procesarCarpeta(carpeta);
});

console.log(`\n🚀 ¡Listo! Todo el código se ha consolidado en el archivo: '${archivoSalida}'`);