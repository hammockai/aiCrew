#!/usr/bin/env node
/**
 * serve.mjs — Servidor local para ver un sitio (The Builder · Hammock AI)
 *
 * Uso:   node serve.mjs <carpeta-del-sitio> [puerto]
 * Ej.:   node serve.mjs mi-sitio
 *        node serve.mjs base 8081
 * Luego abre http://127.0.0.1:8080/ en el navegador. Ctrl+C para cerrar.
 *
 * Para qué: abrir index.html con doble clic sirve para mirar, pero un
 * servidor se parece más al sitio publicado: la página 404 se ve con
 * estilos, las rutas que empiezan con "/" funcionan y se aplican las
 * cabeceras de seguridad de _headers (así se prueba la CSP de verdad).
 *
 * Por qué así:
 * - Node puro (>= 18), cero dependencias: no descarga código de terceros
 *   (npx http-server sí lo hace).
 * - Solo escucha en 127.0.0.1: nadie más en la red (wifi del café, la
 *   oficina) puede entrar. Además rechaza peticiones cuyo "Host" no sea
 *   127.0.0.1 o localhost (protege contra "DNS rebinding": una página
 *   maliciosa que intenta leer tu servidor local desde el navegador).
 * - Nunca sirve nada fuera de la carpeta pedida: bloquea "../" (también
 *   escrito como %2e%2e o %2f), barras invertidas, archivos ocultos (.env,
 *   .git) y enlaces simbólicos que apunten fuera.
 * - Tipos MIME correctos y "X-Content-Type-Options: nosniff", como en
 *   Cloudflare Pages: un error de tipo se ve aquí y no en producción.
 *
 * Límite honesto: imita lo básico de Cloudflare Pages, no todo. De _headers
 * aplica solo el bloque "/*" (las reglas para *.pages.dev no aplican en
 * local) y no imita _redirects. Es para mirar en tu computador, nunca para
 * publicar.
 *
 * Código de salida: 0 al cerrar con Ctrl+C · 1 = puerto ocupado u otro
 * error · 2 = error de uso (carpeta o puerto inválidos).
 */

import http from 'node:http';
import { createReadStream, readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path';

const HOST = '127.0.0.1';

// Tipos de archivo (MIME). Lo que no está aquí sale como "descarga binaria".
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// Archivos de configuración de Cloudflare Pages: Pages los lee pero no los
// publica, así que aquí tampoco se sirven.
const NO_SE_SIRVEN = new Set(['_headers', '_redirects']);

function salirConUso(mensaje) {
  console.error(`${mensaje}\nUso: node serve.mjs <carpeta-del-sitio> [puerto]\nEj.: node serve.mjs mi-sitio 8080`);
  process.exit(2);
}

// --- Argumentos -------------------------------------------------------------
const [carpetaArg, puertoArg = '8080'] = process.argv.slice(2);
if (!carpetaArg) salirConUso('Falta la carpeta del sitio.');

const puerto = Number(puertoArg);
if (!Number.isInteger(puerto) || puerto < 1024 || puerto > 65535) {
  salirConUso(`Puerto inválido: "${puertoArg}". Usa un número entre 1024 y 65535.`);
}

let raiz;
try {
  // realpath: la ruta real, sin enlaces simbólicos, para comparar después.
  raiz = realpathSync.native(resolve(carpetaArg));
  if (!statSync(raiz).isDirectory()) throw new Error('no es carpeta');
} catch {
  salirConUso(`No encuentro la carpeta "${carpetaArg}".`);
}

// --- Ayudantes ----------------------------------------------------------------

// ¿La ruta queda dentro de la carpeta del sitio?
function dentroDeLaRaiz(ruta) {
  const rel = relative(raiz, ruta);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

// Lee el bloque "/*" de _headers en cada petición: si editas _headers, el
// cambio se ve al recargar, sin reiniciar el servidor.
function cabecerasDelSitio() {
  const cabeceras = {};
  let texto;
  try {
    texto = readFileSync(join(raiz, '_headers'), 'utf8');
  } catch {
    return cabeceras; // sin _headers: solo las cabeceras mínimas
  }
  let enBloqueGeneral = false;
  for (const linea of texto.split(/\r?\n/)) {
    if (!linea.trim() || linea.trim().startsWith('#')) continue;
    if (!/^\s/.test(linea)) { // línea sin sangría = una ruta nueva
      enBloqueGeneral = linea.trim() === '/*';
      continue;
    }
    if (!enBloqueGeneral) continue;
    const i = linea.indexOf(':');
    if (i > 0) cabeceras[linea.slice(0, i).trim()] = linea.slice(i + 1).trim();
  }
  return cabeceras;
}

// Convierte la dirección pedida en un archivo de la carpeta, o explica por
// qué no. Devuelve { archivo } o { estado }.
function resolverArchivo(urlPedida) {
  // new URL(...) ya resuelve "/a/../b" y "%2e%2e" dentro de la dirección.
  const { pathname } = new URL(urlPedida, `http://${HOST}`);

  let ruta;
  try {
    ruta = decodeURIComponent(pathname); // "%20" -> espacio, "%2f" -> "/"
  } catch {
    return { estado: 400 }; // codificación rota
  }

  // Después de decodificar pueden aparecer trucos nuevos: se revisan aquí.
  // \0 (byte nulo), \ (separador de Windows) y : (unidad "C:" o flujos
  // alternos de Windows) no tienen uso legítimo en una dirección del sitio.
  if (ruta.includes('\0') || ruta.includes('\\') || ruta.includes(':')) return { estado: 400 };
  const partes = ruta.split('/').filter(Boolean);
  if (partes.some((p) => p.startsWith('.'))) return { estado: 404 }; // "..", .env, .git
  if (partes.length && NO_SE_SIRVEN.has(partes[partes.length - 1])) return { estado: 404 };

  let archivo = resolve(raiz, ...partes);
  if (!dentroDeLaRaiz(archivo)) return { estado: 403 };

  let info;
  try {
    info = statSync(archivo);
    if (info.isDirectory()) {
      archivo = join(archivo, 'index.html');
      info = statSync(archivo);
    }
  } catch {
    // Como en Cloudflare Pages: /contacto también encuentra contacto.html
    if (extname(archivo) === '') {
      try {
        archivo = `${archivo}.html`;
        info = statSync(archivo);
      } catch {
        return { estado: 404 };
      }
    } else {
      return { estado: 404 };
    }
  }
  if (!info.isFile()) return { estado: 404 };

  // Un enlace simbólico podría apuntar fuera: se compara la ruta REAL.
  // .native devuelve el nombre largo y con sus mayúsculas reales (Windows):
  // "GIT~1" vuelve a ser ".git" y "_HEADERS" vuelve a ser "_headers".
  let real;
  try {
    real = realpathSync.native(archivo);
  } catch {
    return { estado: 404 };
  }
  if (!dentroDeLaRaiz(real)) return { estado: 403 };
  const partesReales = relative(raiz, real).split(/[\\/]/);
  if (partesReales.some((p) => p.startsWith('.'))) return { estado: 404 };
  if (NO_SE_SIRVEN.has(partesReales[partesReales.length - 1].toLowerCase())) return { estado: 404 };
  return { archivo: real };
}

function enviar(req, res, estado, archivo) {
  const cabeceras = {
    ...cabecerasDelSitio(),
    'Content-Type': TIPOS[extname(archivo).toLowerCase()] || 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store', // en local, siempre la última versión
  };
  res.writeHead(estado, cabeceras);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  const flujo = createReadStream(archivo);
  flujo.on('error', () => res.destroy());
  flujo.pipe(res);
}

function enviarTexto(res, estado, texto) {
  res.writeHead(estado, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  });
  res.end(texto);
}

// --- Servidor -----------------------------------------------------------------
const hostsPermitidos = new Set([`127.0.0.1:${puerto}`, `localhost:${puerto}`]);

const servidor = http.createServer((req, res) => {
  const registrar = (estado) => console.log(`${estado} ${req.method} ${req.url}`);

  if (!hostsPermitidos.has(String(req.headers.host).toLowerCase())) {
    registrar(403);
    enviarTexto(res, 403, 'Solo se acepta http://127.0.0.1 o http://localhost.');
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    registrar(405);
    res.setHeader('Allow', 'GET, HEAD');
    enviarTexto(res, 405, 'Solo GET y HEAD.');
    return;
  }

  const { archivo, estado } = resolverArchivo(req.url);
  if (archivo) {
    registrar(200);
    enviar(req, res, 200, archivo);
    return;
  }

  // 404: la página 404.html del sitio, si existe (como en Cloudflare Pages).
  if (estado === 404) {
    const pagina404 = join(raiz, '404.html');
    try {
      if (statSync(pagina404).isFile()) {
        registrar(404);
        enviar(req, res, 404, pagina404);
        return;
      }
    } catch {
      // sin 404.html: respuesta de texto
    }
  }
  registrar(estado);
  enviarTexto(res, estado, estado === 404 ? 'No encontrado.' : estado === 403 ? 'Prohibido.' : 'Petición inválida.');
});

servidor.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`El puerto ${puerto} está ocupado. Prueba otro: node serve.mjs ${carpetaArg} ${puerto + 1}`);
  } else {
    console.error(`No pude iniciar el servidor: ${error.message}`);
  }
  process.exit(1);
});

servidor.listen(puerto, HOST, () => {
  console.log(`Sirviendo "${basename(raiz)}" en http://${HOST}:${puerto}/ (solo este computador).`);
  console.log('Ctrl+C para cerrar.');
});

process.on('SIGINT', () => {
  servidor.close();
  process.exit(0);
});
