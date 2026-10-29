#!/usr/bin/env node
/**
 * check.mjs — Chequeo local de seguridad (La Cerrajera · Hammock AI)
 *
 * Uso:   node check.mjs <carpeta-del-sitio>
 * Ej.:   node check.mjs mi-sitio
 *
 * Qué hace: lee TODOS los archivos de la carpeta (sin red, sin dependencias,
 * Node >= 18) y busca rendijas típicas de un sitio estático:
 *   1. Código: <script> en línea, atributos on*, javascript:, eval, innerHTML…
 *   2. Recursos externos: scripts, estilos, fuentes, imágenes, iframes de otro dominio.
 *   3. Cabeceras: CSP en <meta> de cada página y _headers con la línea base.
 *   4. Secretos y archivos que no se suben (.env, respaldos, llaves).
 *   5. Dependencias (package.json, node_modules: deben ser cero).
 *   + Correos a la vista, http://, y tres chequeos de accesibilidad.
 *
 * Por qué así:
 * - Sin dependencias: una herramienta de seguridad que instala código de
 *   terceros agrega la misma rendija que busca. Todo es Node puro.
 * - Sin red: solo mira archivos locales. Nunca escanea un sitio publicado
 *   (y menos uno de terceros).
 * - Los secretos se muestran TAPADOS (primeros 3…últimos 4): el informe
 *   no debe convertirse en otra copia de la llave.
 *
 * Código de salida: 0 = sin crítico ni alto · 1 = hay crítico o alto (no entregar)
 *                   2 = error de uso (carpeta que no existe, etc.)
 *
 * Límite honesto: es una lectura con patrones, no un navegador. Puede tener
 * falsos positivos (se confirman a mano) y no ve lo que pasa en el hosting,
 * el dominio ni las cuentas. Eso va en docs/seguridad-checklist.md.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ESTE_SCRIPT = resolve(fileURLToPath(import.meta.url));
// Fecha local en formato AAAA-MM-DD ('sv-SE' da justo ese formato).
const HOY = new Date().toLocaleDateString('sv-SE');

// ---------------------------------------------------------------------------
// Línea base (la de La Cerrajera, agents/es/seguridad.md). Se usa en los arreglos.
// ---------------------------------------------------------------------------
// En <meta> va SIN frame-ancestors: esa directiva se ignora en <meta>
// (W3C CSP3: "Neither are the report-uri, frame-ancestors, and sandbox directives").
const CSP_META_BASE =
  "default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests";
const META_CSP_BASE = `<meta http-equiv="Content-Security-Policy" content="${CSP_META_BASE}">`;
const HEADERS_BASE = [
  '/*',
  `  Content-Security-Policy: ${CSP_META_BASE.replace('upgrade-insecure-requests', "frame-ancestors 'none'; upgrade-insecure-requests")}`,
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  '  X-Frame-Options: DENY',
].join('\n');

// ---------------------------------------------------------------------------
// Severidades (escala de La Cerrajera, agents/es/seguridad.md)
// ---------------------------------------------------------------------------
const SEV = {
  critico: { orden: 0, etiqueta: 'CRÍTICO', color: '1;31', nota: 'bloquea la entrega' },
  alto: { orden: 1, etiqueta: 'ALTO', color: '31', nota: 'bloquea la entrega' },
  medio: { orden: 2, etiqueta: 'MEDIO', color: '33', nota: 'arreglar antes de entregar, salvo decisión anotada del responsable' },
  bajo: { orden: 3, etiqueta: 'BAJO', color: '36', nota: 'puede esperar' },
  info: { orden: 4, etiqueta: 'INFORMATIVO', color: '90', nota: 'para saber; no frena nada' },
};

// ---------------------------------------------------------------------------
// Argumentos
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const banderas = new Set(args.filter((a) => a.startsWith('-')));
const posicionales = args.filter((a) => !a.startsWith('-'));
const usarColor = process.stdout.isTTY && !process.env.NO_COLOR && !banderas.has('--sin-color');
const col = (codigo, s) => (usarColor ? `\x1b[${codigo}m${s}\x1b[0m` : s);

const AYUDA = `Chequeo local de seguridad (La Cerrajera)

Uso:  node check.mjs <carpeta-del-sitio> [--sin-color]
Ej.:  node check.mjs mi-sitio

Sale con código 1 si hay hallazgos CRÍTICOS o ALTOS (no entregar).
Solo lee archivos locales; no usa la red.`;

if (banderas.has('-h') || banderas.has('--ayuda') || banderas.has('--help')) {
  console.log(AYUDA);
  process.exit(0);
}
if (posicionales.length !== 1) {
  console.error(AYUDA);
  process.exit(2);
}
const RAIZ = resolve(posicionales[0]);
try {
  if (!statSync(RAIZ).isDirectory()) throw new Error('no es carpeta');
} catch {
  console.error(`No encuentro la carpeta "${posicionales[0]}". Revisa la ruta (relativa a donde estás parado).`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

/** Devuelve una función índice → número de línea (1, 2, 3…) para un texto. */
function crearContadorDeLineas(texto) {
  const inicios = [0];
  for (let i = 0; i < texto.length; i++) if (texto.charCodeAt(i) === 10) inicios.push(i + 1);
  return (indice) => {
    let lo = 0;
    let hi = inicios.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (inicios[mid] <= indice) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };
}

/** Tapa un secreto: muestra solo los primeros 3 y los últimos 4 caracteres. */
function tapar(valor) {
  const v = String(valor);
  // Si es corto, mostrar 7 caracteres sería mostrar casi todo: solo el largo.
  if (v.length < 16) return `${v.slice(0, 1)}… (${v.length} caracteres)`;
  return `${v.slice(0, 3)}…${v.slice(-4)}`;
}

/** Acorta un texto largo para que el informe siga legible. */
function recortar(s, max = 90) {
  const t = String(s).replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Entropía de Shannon: mide qué tan "aleatorio" es un texto (claves ≈ alta). */
function entropia(s) {
  const f = {};
  for (const ch of s) f[ch] = (f[ch] || 0) + 1;
  let h = 0;
  for (const k in f) {
    const p = f[k] / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

/** ¿El valor parece de prueba? (se avisa, pero la severidad no baja). */
const pareceDePrueba = (v) => /fake|example|ejemplo|falso|dummy|test/i.test(v);

// ---------------------------------------------------------------------------
// Patrones de secretos
// ---------------------------------------------------------------------------
// Cada patrón trae dónde se cambia la llave: el arreglo de un secreto no es
// solo borrarlo, es CAMBIARLO, porque ya estuvo a la vista.
const SECRETOS = [
  { id: 'sk', nombre: 'clave de API tipo "sk-" (OpenAI, Anthropic u otro proveedor)', re: /\bsk-(?:ant-|proj-|live-|test-)?[A-Za-z0-9_-]{20,}/g, sev: 'critico', donde: 'el panel del proveedor de esa clave (sección API keys): revocarla y crear otra', exigeDigito: true },
  { id: 'stripe', nombre: 'clave secreta de Stripe', re: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/g, sev: 'critico', donde: 'Stripe → Developers → API keys: rotar la clave' },
  { id: 'github', nombre: 'token de GitHub', re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/g, sev: 'critico', donde: 'GitHub → Settings → Developer settings → Personal access tokens: revocarlo' },
  { id: 'aws', nombre: 'llave de acceso de AWS', re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, sev: 'critico', donde: 'AWS → IAM → usuario → Security credentials: desactivar y borrar la llave' },
  { id: 'pem', nombre: 'llave privada (bloque PEM)', re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/g, sev: 'critico', donde: 'el servidor o servicio que usa esa llave: generar un par nuevo y retirar el viejo', ocultarTodo: true },
  { id: 'google', nombre: 'clave de API de Google', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, sev: 'alto', donde: 'Google Cloud Console → APIs y servicios → Credenciales: rotarla o restringirla' },
  { id: 'slack', nombre: 'token o webhook de Slack', re: /\bxox[abposr]-[A-Za-z0-9-]{10,}|hooks\.slack\.com\/services\/[A-Za-z0-9/_-]{20,}/g, sev: 'critico', donde: 'Slack → configuración de la app: revocarlo' },
  { id: 'discord', nombre: 'webhook de Discord', re: /discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]{20,}/g, sev: 'critico', donde: 'Discord → canal → Integraciones → Webhooks: borrarlo y crear otro' },
  { id: 'telegram', nombre: 'token de bot de Telegram', re: /\b\d{8,10}:AA[A-Za-z0-9_-]{33}\b/g, sev: 'critico', donde: '@BotFather → /revoke' },
  { id: 'sendgrid', nombre: 'clave de SendGrid', re: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g, sev: 'critico', donde: 'SendGrid → Settings → API Keys: borrarla y crear otra' },
  { id: 'jwt', nombre: 'token JWT (sesión o acceso)', re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, sev: 'alto', donde: 'el servicio que lo emitió: invalidarlo' },
];
// Asignaciones con nombre sospechoso: api_key = "…", "password": "…", token: '…'
// Se exige valor entre comillas para no confundir texto normal ("Clave: …").
const RE_ASIGNACION =
  /\b(api[_-]?key|apikey|api[_-]?secret|secret[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|private[_-]?key|token|secret|password|passwd|pwd|contrase(?:ñ|n)a|clave)["']?\s*[:=]\s*["'`]([^"'`\s]{8,})["'`]/gi;
// Claves pegadas en una URL: ?api_key=…&token=…
const RE_PARAM_URL = /[?&](api[_-]?key|apikey|key|token|access_token|auth|secret|password)=([^&"'\s<>#]{8,})/gi;
// Textos largos y aleatorios guardados en una variable (posibles tokens).
const RE_VAR_LARGA = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*["'`]([A-Za-z0-9_\-+/=.]{32,})["'`]/g;
// Valores de relleno que no son secretos ("tu_clave_aqui", "xxxx", "${API}").
const RE_RELLENO = /^(x{4,}|\*{4,}|\.{3}|<[^>]*>|\{\{.*\}\}|\$\{.*\}|(tu|your|su)[_-]|placeholder|changeme|cambiar|null|undefined|process\.env|import\.meta)/i;

/** Reemplaza cualquier secreto dentro de un texto por su versión tapada. */
function taparSecretosEn(texto) {
  let t = String(texto);
  for (const p of SECRETOS) t = t.replace(new RegExp(p.re.source, 'g'), (m) => (p.ocultarTodo ? '[llave privada oculta]' : tapar(m)));
  t = t.replace(new RegExp(RE_ASIGNACION.source, 'gi'), (m, _n, v) => m.replace(v, tapar(v)));
  t = t.replace(new RegExp(RE_PARAM_URL.source, 'gi'), (m, _n, v) => m.replace(v, tapar(v)));
  return t;
}

// ---------------------------------------------------------------------------
// Registro de hallazgos
// ---------------------------------------------------------------------------
// Hallazgos iguales en el mismo archivo se juntan en una sola entrada con
// varias líneas: el informe queda corto (Regla del Moco) sin perder ubicaciones.
const hallazgos = new Map();
const lineasConHallazgo = new Set(); // "archivo:línea" ya cubiertas (evita duplicar avisos http://)

function reportar(h) {
  // h = { sev, archivo, linea, regla, que, porque, arreglo, clave?, unir? }
  const clave = h.unir === false ? Symbol('unico') : h.clave || `${h.archivo}|${h.regla}|${h.que}`;
  if (h.linea) lineasConHallazgo.add(`${h.archivo}:${h.linea}`);
  const previo = hallazgos.get(clave);
  if (previo) {
    if (h.linea && !previo.lineas.includes(h.linea)) previo.lineas.push(h.linea);
    return;
  }
  hallazgos.set(clave, { ...h, que: taparSecretosEn(h.que), arreglo: taparSecretosEn(h.arreglo), lineas: h.linea ? [h.linea] : [] });
}

// ---------------------------------------------------------------------------
// URLs: ¿es de otro dominio?
// ---------------------------------------------------------------------------
// Orígenes propios del sitio, sacados de <link rel="canonical"> y og:url.
// Así una imagen con la URL completa del mismo sitio no cuenta como externa.
const origenesPropios = new Set();

function origenDe(url) {
  try {
    const u = new URL(url.startsWith('//') ? `https:${url}` : url);
    return u.host.toLowerCase();
  } catch {
    return null;
  }
}

/** Externa = absoluta (http, https o "//dominio") y de un dominio que no es el propio. */
function esExterna(url) {
  const u = String(url || '').trim();
  if (!/^(https?:)?\/\//i.test(u)) return false;
  const host = origenDe(u);
  return !(host && origenesPropios.has(host));
}

// Direcciones http:// que son nombres de espacio (no se cargan): se ignoran.
const RE_NAMESPACE = /^http:\/\/(www\.)?(w3\.org|schema\.org|ogp\.me|purl\.org|xmlns\.com|sitemaps\.org|google\.com\/schemas)\b/i;
// Archivos donde un http:// sí importa (se carga o se puede hacer clic). En un
// .txt (p. ej. la licencia de una fuente) es solo texto: no se avisa.
const EXT_WEB = ['.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.svg', '.xml', '.json', '.webmanifest'];

// ---------------------------------------------------------------------------
// Tokenizador de HTML (simple, a mano)
// ---------------------------------------------------------------------------
// No es un navegador: separa etiquetas, atributos, comentarios y el contenido
// crudo de <script>/<style>. Alcanza para revisar sin instalar un parser.
function tokenizarHtml(src) {
  const tokens = [];
  const n = src.length;
  let i = 0;
  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt === -1) {
      tokens.push({ type: 'text', index: i, value: src.slice(i) });
      break;
    }
    if (lt > i) tokens.push({ type: 'text', index: i, value: src.slice(i, lt) });
    if (src.startsWith('<!--', lt)) {
      // Los comentarios no se ejecutan, pero SÍ se publican (los secretos se buscan aparte).
      const fin = src.indexOf('-->', lt + 4);
      tokens.push({ type: 'comment', index: lt, value: src.slice(lt + 4, fin === -1 ? n : fin) });
      i = fin === -1 ? n : fin + 3;
      continue;
    }
    if (src[lt + 1] === '!' || src[lt + 1] === '?') {
      const fin = src.indexOf('>', lt);
      tokens.push({ type: 'doctype', index: lt });
      i = fin === -1 ? n : fin + 1;
      continue;
    }
    const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)/.exec(src.slice(lt, lt + 80));
    if (!m) {
      tokens.push({ type: 'text', index: lt, value: '<' });
      i = lt + 1;
      continue;
    }
    const esCierre = m[1] === '/';
    const nombre = m[2].toLowerCase();
    let j = lt + m[0].length;
    const attrs = [];
    while (j < n) {
      while (j < n && /[\s/]/.test(src[j])) j++;
      if (j >= n || src[j] === '>') break;
      const ini = j;
      while (j < n && !/[\s/>=]/.test(src[j])) j++;
      if (j === ini) {
        j++; // carácter suelto (p. ej. "=" sin nombre): se salta
        continue;
      }
      const aNombre = src.slice(ini, j).toLowerCase();
      while (j < n && /\s/.test(src[j])) j++;
      let valor = null;
      let iValor = ini;
      if (src[j] === '=') {
        j++;
        while (j < n && /\s/.test(src[j])) j++;
        const q = src[j];
        if (q === '"' || q === "'") {
          const cierre = src.indexOf(q, j + 1);
          iValor = j + 1;
          valor = src.slice(j + 1, cierre === -1 ? n : cierre);
          j = cierre === -1 ? n : cierre + 1;
        } else {
          iValor = j;
          const s = j;
          while (j < n && !/[\s>]/.test(src[j])) j++;
          valor = src.slice(s, j);
        }
      }
      attrs.push({ nombre: aNombre, valor, index: ini, iValor });
    }
    const finEtiqueta = j < n ? j + 1 : n;
    tokens.push({ type: esCierre ? 'end' : 'start', name: nombre, attrs, index: lt, end: finEtiqueta });
    i = finEtiqueta;
    // Contenido crudo: lo de adentro de <script>/<style> no es HTML.
    if (!esCierre && ['script', 'style', 'textarea', 'title'].includes(nombre)) {
      const reCierre = new RegExp(`</${nombre}\\s*>`, 'ig');
      reCierre.lastIndex = i;
      const c = reCierre.exec(src);
      const finContenido = c ? c.index : n;
      tokens.push({ type: 'raw', parent: nombre, index: i, value: src.slice(i, finContenido) });
      if (c) {
        tokens.push({ type: 'end', name: nombre, attrs: [], index: c.index, end: c.index + c[0].length });
        i = c.index + c[0].length;
      } else i = n;
    }
  }
  return tokens;
}

const attr = (t, nombre) => t.attrs.find((a) => a.nombre === nombre);
const valorAttr = (t, nombre) => {
  const a = attr(t, nombre);
  return a ? a.valor ?? '' : null;
};

// ---------------------------------------------------------------------------
// CSP: revisión de calidad (sirve para <meta> y para _headers)
// ---------------------------------------------------------------------------
function parsearCsp(valor) {
  const dirs = new Map();
  for (const parte of String(valor).split(';')) {
    const toks = parte.trim().split(/\s+/).filter(Boolean);
    if (!toks.length) continue;
    const nombre = toks[0].toLowerCase();
    if (!dirs.has(nombre)) dirs.set(nombre, toks.slice(1)); // la primera aparición manda
  }
  return dirs;
}

function revisarCsp(valor, archivo, linea, dondeVa) {
  const d = parsearCsp(valor);
  const enMeta = dondeVa === 'meta';
  const lugar = enMeta ? 'La CSP del <meta>' : 'La CSP de _headers';

  if (!d.has('default-src') && !d.has('script-src')) {
    reportar({ sev: 'medio', archivo, linea, regla: 'csp-sin-limite', que: `${lugar} no tiene default-src ni script-src: no limita los scripts`,
      porque: 'Sin esas directivas, un script inyectado se ejecuta igual: la CSP queda de adorno.',
      arreglo: `Partir de la línea base:\n${enMeta ? META_CSP_BASE : HEADERS_BASE}` });
  }
  for (const [nombre, fuentes] of d) {
    const lower = fuentes.map((f) => f.toLowerCase());
    const esDeScripts = ['default-src', 'script-src', 'script-src-elem', 'script-src-attr'].includes(nombre);
    if (lower.includes("'unsafe-inline'")) {
      reportar({ sev: esDeScripts ? 'medio' : 'bajo', archivo, linea, regla: 'csp-unsafe-inline', que: `${lugar} permite 'unsafe-inline' en ${nombre}`,
        porque: esDeScripts
          ? "Deja correr código en línea: si alguien logra colar un <script> o un onclick, el navegador lo ejecuta (MDN: 'unsafe-inline' anula gran parte del sentido de la CSP)."
          : 'Permite estilos en línea: un texto inyectado podría cambiar cómo se ve la página (riesgo menor que en scripts).',
        arreglo: `Quitar 'unsafe-inline' de ${nombre} y mover el código o estilo en línea a archivos .js/.css.` });
    }
    if (lower.includes("'unsafe-eval'")) {
      reportar({ sev: 'medio', archivo, linea, regla: 'csp-unsafe-eval', que: `${lugar} permite 'unsafe-eval' en ${nombre}`,
        porque: 'Permite convertir texto en código (eval, new Function): si ese texto viene de afuera, se ejecuta código ajeno.',
        arreglo: `Quitar 'unsafe-eval' de ${nombre} y reescribir el código que lo necesita (JSON.parse para datos, funciones en vez de texto).` });
    }
    if (lower.includes('*')) {
      reportar({ sev: 'medio', archivo, linea, regla: 'csp-comodin', que: `${lugar} usa el comodín * en ${nombre}`,
        porque: 'El * acepta cualquier dominio: la lista blanca deja de filtrar.',
        arreglo: `Cambiar * por 'self' (o por el dominio exacto que haga falta) en ${nombre}.` });
    }
    if (esDeScripts && lower.some((f) => ['https:', 'http:', 'data:'].includes(f))) {
      reportar({ sev: 'medio', archivo, linea, regla: 'csp-esquema-abierto', que: `${lugar} acepta un esquema completo (https:, http: o data:) en ${nombre}`,
        porque: 'Aceptar "https:" en scripts es aceptar scripts de cualquier sitio con candado: casi lo mismo que no tener CSP.',
        arreglo: `Dejar ${nombre} en 'self'.` });
    }
    if (lower.some((f) => f === 'http:' || f.startsWith('http://'))) {
      reportar({ sev: 'bajo', archivo, linea, regla: 'csp-http', que: `${lugar} acepta fuentes http:// en ${nombre}`,
        porque: 'Un recurso por http:// se puede alterar en el camino (wifi pública).',
        arreglo: 'Usar solo https:// o, mejor, servir el recurso desde el propio sitio.' });
    }
  }
  // Estas directivas NO heredan de default-src (MDN, default-src): hay que escribirlas.
  const faltan = ['base-uri', 'form-action'].filter((x) => !d.has(x));
  if (!d.has('object-src') && !d.has('default-src')) faltan.push('object-src');
  if (faltan.length) {
    reportar({ sev: 'bajo', archivo, linea, regla: 'csp-incompleta', que: `${lugar} no fija ${faltan.join(', ')}`,
      porque: 'base-uri y form-action no heredan de default-src: un <base> o un formulario inyectado podría desviar enlaces o envíos a otro sitio.',
      arreglo: `Agregar a la CSP: ${faltan.map((x) => (x === 'object-src' ? "object-src 'none'" : `${x} 'self'`)).join('; ')}` });
  }
  if (enMeta) {
    const ignoradas = ['frame-ancestors', 'report-uri', 'sandbox'].filter((x) => d.has(x));
    if (ignoradas.length) {
      reportar({ sev: 'info', archivo, linea, regla: 'csp-meta-ignorada', que: `${ignoradas.join(', ')} no funciona en <meta> (el navegador lo ignora)`,
        porque: 'W3C CSP3: report-uri, frame-ancestors y sandbox no se aceptan en <meta>. No es riesgo, pero da una falsa sensación de protección.',
        arreglo: `Quitar ${ignoradas.join(', ')} del <meta> y dejarlo solo en _headers.` });
    }
  }
}

// ---------------------------------------------------------------------------
// CSS
// ---------------------------------------------------------------------------
/** Borra comentarios /* … *\/ conservando los saltos de línea (para no mover las líneas). */
const blanquearComentariosCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

function analizarCss(css, base, ctx) {
  const limpio = blanquearComentariosCss(css);
  const linea = (i) => ctx.linea(base + i);
  // Rangos de @font-face: para decir "fuente" en vez de "recurso".
  const fuentes = [];
  for (const m of limpio.matchAll(/@font-face\s*\{[^}]*\}/gi)) fuentes.push([m.index, m.index + m[0].length]);
  const enFuente = (i) => fuentes.some(([a, b]) => i >= a && i < b);

  const imports = [];
  for (const m of limpio.matchAll(/@import\s+(?:url\(\s*)?(["']?)([^"')\s;]+)\1/gi)) {
    imports.push([m.index, m.index + m[0].length]);
    if (esExterna(m[2])) {
      reportar({ sev: 'alto', archivo: ctx.rel, linea: linea(m.index), regla: 'externo-css', que: `@import de una hoja de estilos de otro dominio: ${recortar(m[2])}`,
        porque: 'El proveedor ve la IP de cada visita (rastreo sin consentimiento) y puede cambiar ese CSS cuando quiera; la CSP base lo bloquea y la página se ve rota.',
        arreglo: 'Quitar el @import. Si es una fuente (p. ej. Google Fonts), descargar los .woff2, ponerlos en fonts/ y declararlos con @font-face { src: url("../fonts/archivo.woff2") format("woff2"); }. Revisar la licencia de la fuente.' });
    }
  }
  for (const m of limpio.matchAll(/url\(\s*(["']?)([^"')]+?)\1\s*\)/gi)) {
    if (imports.some(([a, b]) => m.index >= a && m.index < b)) continue;
    const url = m[2].trim();
    if (!esExterna(url)) continue;
    const esFuente = enFuente(m.index);
    reportar({ sev: 'alto', archivo: ctx.rel, linea: linea(m.index), regla: 'externo-css', que: `${esFuente ? 'Fuente cargada' : 'Recurso cargado'} desde otro dominio en CSS: ${recortar(url)}`,
      porque: 'Cada visita le avisa a ese dominio (ve la IP y la página) y él puede cambiar el archivo; la CSP base lo bloquea.',
      arreglo: esFuente
        ? 'Descargar la fuente (.woff2) a fonts/ y usar url("../fonts/archivo.woff2"). Revisar su licencia.'
        : 'Descargar el archivo (si hay derechos de uso) a la carpeta del sitio y usar una ruta relativa: url("../img/archivo.webp").' });
  }
}

// ---------------------------------------------------------------------------
// JavaScript
// ---------------------------------------------------------------------------
/**
 * Borra los comentarios de JS (// y /* *\/) respetando textos entre comillas,
 * plantillas `…` y expresiones regulares. Así un "eval(" dentro de un
 * comentario explicativo no cuenta como hallazgo.
 */
function blanquearComentariosJs(src) {
  const a = src.split('');
  let estado = 'codigo';
  let ultimo = '';
  for (let i = 0; i < a.length; i++) {
    const c = a[i];
    const d = a[i + 1];
    switch (estado) {
      case 'codigo':
        if (c === '/' && d === '/') { estado = 'linea'; a[i] = ' '; break; }
        if (c === '/' && d === '*') { estado = 'bloque'; a[i] = ' '; break; }
        if (c === "'") estado = 'sq';
        else if (c === '"') estado = 'dq';
        else if (c === '`') estado = 'tpl';
        // Un "/" después de estos signos abre una expresión regular, no una división.
        else if (c === '/' && (ultimo === '' || '(,=:[!&|?{};+-*%<>~^'.includes(ultimo))) estado = 'regex';
        if (!/\s/.test(c)) ultimo = c;
        break;
      case 'linea':
        if (c === '\n') estado = 'codigo';
        else a[i] = ' ';
        break;
      case 'bloque':
        if (c === '*' && d === '/') { a[i] = ' '; a[i + 1] = ' '; i++; estado = 'codigo'; }
        else if (c !== '\n') a[i] = ' ';
        break;
      case 'sq': if (c === '\\') i++; else if (c === "'" || c === '\n') estado = 'codigo'; break;
      case 'dq': if (c === '\\') i++; else if (c === '"' || c === '\n') estado = 'codigo'; break;
      case 'tpl': if (c === '\\') i++; else if (c === '`') estado = 'codigo'; break;
      case 'regex': if (c === '\\') i++; else if (c === '[') estado = 'clase'; else if (c === '/' || c === '\n') estado = 'codigo'; break;
      case 'clase': if (c === '\\') i++; else if (c === ']') estado = 'regex'; break;
    }
  }
  return a.join('');
}

const URL_ABS = String.raw`((?:https?:|wss?:)?\/\/[^"'\x60\s]+)`;
const Q = String.raw`(["'\x60])`;
// Formas en que el código JS pide algo a otro dominio mientras corre.
const CARGAS_JS = [
  { re: new RegExp(String.raw`\bfetch\s*\(\s*${Q}${URL_ABS}\1`, 'g'), que: 'fetch() a otro dominio' },
  { re: new RegExp(String.raw`\bimport\s*\(\s*${Q}${URL_ABS}\1`, 'g'), que: 'import() de código de otro dominio' },
  { re: new RegExp(String.raw`\b(?:import|export)\b[^;'"\x60]*?\bfrom\s*${Q}${URL_ABS}\1`, 'g'), que: 'import de código de otro dominio' },
  { re: new RegExp(String.raw`\bimport\s*${Q}${URL_ABS}\1`, 'g'), que: 'import de código de otro dominio' },
  { re: new RegExp(String.raw`\bnew\s+(?:WebSocket|EventSource|Worker|SharedWorker)\s*\(\s*${Q}${URL_ABS}\1`, 'g'), que: 'conexión a otro dominio (WebSocket/EventSource/Worker)' },
  { re: new RegExp(String.raw`\bimportScripts\s*\(\s*${Q}${URL_ABS}\1`, 'g'), que: 'importScripts de otro dominio' },
  { re: new RegExp(String.raw`\bsendBeacon\s*\(\s*${Q}${URL_ABS}\1`, 'g'), que: 'sendBeacon a otro dominio (envío de datos en segundo plano)' },
  { re: new RegExp(String.raw`\.open\s*\(\s*["'][A-Za-z]+["']\s*,\s*${Q}${URL_ABS}\1`, 'g'), que: 'XMLHttpRequest a otro dominio' },
  { re: new RegExp(String.raw`\.src\s*=\s*${Q}${URL_ABS}\1`, 'g'), que: 'carga dinámica (.src =) desde otro dominio' },
];
// Firmas de rastreo/analítica conocidas (puerta 7: sin rastreo sin consentimiento).
const RASTREADORES = [
  ['Google Analytics / Tag Manager', /googletagmanager\.com|google-analytics\.com|\bgtag\s*\(/],
  ['Meta (Facebook) Pixel', /connect\.facebook\.net|\bfbq\s*\(/],
  ['Hotjar', /hotjar\.com/],
  ['Microsoft Clarity', /clarity\.ms/],
  ['TikTok Pixel', /analytics\.tiktok\.com|\bttq\.(?:load|page|track)\b/],
  ['LinkedIn Insight', /snap\.licdn\.com/],
];

function analizarJs(js, base, ctx) {
  const codigo = blanquearComentariosJs(js);
  const linea = (i) => ctx.linea(base + i);
  const r = (sev, i, regla, que, porque, arreglo) => reportar({ sev, archivo: ctx.rel, linea: linea(i), regla, que, porque, arreglo });

  for (const m of codigo.matchAll(/(?<![\w$])eval\s*\(/g))
    r('medio', m.index, 'js-eval', 'Uso de eval()', 'Convierte texto en código: si ese texto viene de afuera (URL, formulario), se ejecuta código ajeno. Con la CSP base, además, no corre (se rompe).',
      'Reescribir sin evaluar texto: JSON.parse(texto) para datos, o llamar la función directamente.');
  for (const m of codigo.matchAll(/\bnew\s+Function\s*\(/g))
    r('medio', m.index, 'js-eval', 'Uso de new Function()', 'Es un eval con otro nombre: arma código a partir de texto. La CSP base lo bloquea.',
      'Escribir la función normal en el .js (function nombre() { … }) en vez de armarla con texto.');
  for (const m of codigo.matchAll(/\bset(?:Timeout|Interval)\s*\(\s*["'`]/g))
    r('medio', m.index, 'js-eval', 'setTimeout/setInterval con texto en vez de función', 'El texto se evalúa como código (igual que eval). La CSP base lo bloquea.',
      'Pasar una función: setTimeout(() => { … }, 1000).');
  for (const m of codigo.matchAll(/\.(?:inner|outer)HTML\s*\+?=(?!=)/g))
    r('bajo', m.index, 'js-innerhtml', 'Asignación a innerHTML/outerHTML', 'Si lo que se inserta viene de afuera (URL, formulario, otra web), se puede colar código. Con texto fijo y propio no es riesgo.',
      'Para texto, usar elemento.textContent = texto; para estructura, document.createElement(…) y append.');
  for (const m of codigo.matchAll(/\binsertAdjacentHTML\s*\(|\bdocument\.write(?:ln)?\s*\(/g))
    r('bajo', m.index, 'js-innerhtml', 'insertAdjacentHTML / document.write', 'Insertan HTML crudo: mismo riesgo que innerHTML si el contenido viene de afuera.',
      'Usar textContent o document.createElement(…) en su lugar.');
  for (const m of codigo.matchAll(/\bcreateElement\s*\(\s*["'`]script["'`]\s*\)/g))
    r('bajo', m.index, 'js-script-dinamico', 'El código crea etiquetas <script> mientras corre', 'Es la forma típica de meter scripts de terceros sin que se vean en el HTML.',
      'Confirmar qué carga. Si es de otro dominio, quitarlo; si es propio, cargarlo con <script src defer> en el HTML.');
  for (const { re, que } of CARGAS_JS) {
    for (const m of codigo.matchAll(re)) {
      if (!esExterna(m[2].replace(/^wss?:/, 'https:'))) continue;
      r('alto', m.index, 'externo-js', `${que}: ${recortar(m[2])}`,
        'El sitio le entrega datos de la visita a un tercero (IP, página, lo que se envíe) y depende de lo que ese tercero responda; la CSP base (connect-src/script-src \'self\') lo bloquea.',
        'Quitarlo. Si hace falta enviar datos (formulario), derivar a Automatizaciones y ajustar la CSP al dominio exacto.');
    }
  }
  const lineas = codigo.split('\n');
  let acumulado = 0;
  for (const l of lineas) {
    for (const [nombre, re] of RASTREADORES) {
      const m = re.exec(l);
      if (m) {
        r('alto', acumulado + m.index, 'rastreo', `Código de rastreo o analítica: ${nombre}`,
          'Envía datos de cada visita a un tercero sin pedir consentimiento (puerta 7: privacidad).',
          'Quitarlo. Si el cliente quiere estadísticas, se decide aparte, con aviso y consentimiento.');
        break;
      }
    }
    acumulado += l.length + 1;
  }
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------
// rel de <link> que hacen que el navegador DESCARGUE algo.
const REL_QUE_CARGAN = ['stylesheet', 'icon', 'shortcut', 'apple-touch-icon', 'apple-touch-icon-precomposed', 'mask-icon', 'manifest', 'preload', 'modulepreload', 'prefetch', 'prerender'];
// Atributos donde una URL "javascript:" se ejecutaría.
const ATTRS_URL = ['href', 'src', 'action', 'formaction', 'data', 'poster', 'background', 'xlink:href', 'srcset'];
// Tipos de <script> que el navegador ejecuta (o que la CSP trata como script).
const TIPOS_JS = ['', 'module', 'text/javascript', 'application/javascript', 'application/ecmascript', 'text/ecmascript', 'importmap', 'speculationrules'];
// Cabeceras que en <meta http-equiv> no hacen nada (MDN, meta http-equiv).
const META_SIN_EFECTO = ['x-frame-options', 'x-content-type-options', 'strict-transport-security', 'permissions-policy', 'x-xss-protection', 'referrer-policy', 'content-security-policy-report-only'];

const ARREGLO_JS_INLINE = 'Mover el código a un archivo de la carpeta (p. ej. js/main.js) y cargarlo con <script src="js/main.js" defer></script>; los eventos, con addEventListener desde ese archivo.';
const PORQUE_JS_INLINE = "Con la CSP base no se ejecuta (la función se rompe), y para que corra habría que permitir 'unsafe-inline', que apaga la principal defensa contra código inyectado.";

function reportarCargaExterna(ctx, linea, tipo, url) {
  const textos = {
    script: ['Script cargado desde otro dominio', 'Ese dominio puede cambiar el código cuando quiera y corre con los mismos permisos que tu sitio; además ve cada visita. La CSP base lo bloquea.',
      'Quitarlo, o descargar el archivo, revisarlo y servirlo desde la carpeta del sitio: <script src="js/archivo.js" defer></script>.'],
    estilo: ['Hoja de estilos o fuente cargada desde otro dominio', 'El proveedor ve la IP de cada visita (rastreo sin consentimiento) y puede cambiar el archivo; la CSP base lo bloquea.',
      'Descargar el CSS o la fuente (.woff2) a la carpeta del sitio y enlazarlo con ruta relativa: <link rel="stylesheet" href="css/estilos.css">. Revisar la licencia de la fuente.'],
    iframe: ['Contenido incrustado de otro dominio (iframe: mapa, video, widget)', 'Carga scripts y cookies del proveedor en cada visita (rastreo) y la CSP base lo bloquea.',
      'Reemplazarlo por un enlace normal (<a href="https://…">Ver en el mapa</a>) o una imagen local con enlace.'],
    objeto: ['Objeto incrustado de otro dominio (object/embed)', 'Carga contenido activo ajeno; la CSP base (object-src \'none\') lo bloquea.',
      'Quitarlo; usar <img>, <video> o un enlace.'],
    imagen: ['Imagen o medio cargado desde otro dominio', 'El otro dominio ve cada visita (así funcionan los píxeles de rastreo) y puede cambiar la imagen; la CSP base (img-src \'self\' data:) la bloquea.',
      'Descargar la imagen (si hay derechos de uso) a img/ y usar ruta relativa: src="img/archivo.webp".'],
    otro: ['Recurso cargado desde otro dominio', 'Cada visita le avisa a ese dominio y el sitio depende de él; la CSP base lo bloquea.',
      'Servir el archivo desde la carpeta del sitio con ruta relativa, o quitarlo.'],
  };
  const [que, porque, arreglo] = textos[tipo] || textos.otro;
  reportar({ sev: 'alto', archivo: ctx.rel, linea, regla: 'externo-html', que: `${que}: ${recortar(url)}`, porque, arreglo });
}

function analizarHtml(texto, ctx) {
  const tokens = tokenizarHtml(texto);
  const L = (i) => ctx.linea(i);

  // Pre-pasada: ids que tienen un <label for="…">.
  const idsConLabel = new Set();
  for (const t of tokens) if (t.type === 'start' && t.name === 'label') { const f = valorAttr(t, 'for'); if (f) idsConLabel.add(f.trim()); }

  const metasCsp = [];
  let primeraCarga = null; // primera etiqueta que carga algo (para ver si la CSP llega tarde)
  let dentroDeLabel = 0;
  let vioHtml = false;

  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.type === 'end' && t.name === 'label') dentroDeLabel = Math.max(0, dentroDeLabel - 1);
    if (t.type !== 'start') continue;
    const linea = L(t.index);
    const v = (n) => valorAttr(t, n);

    // --- Atributos de cualquier etiqueta ---
    for (const a of t.attrs) {
      if (/^on[a-z]+$/.test(a.nombre)) {
        reportar({ sev: 'medio', archivo: ctx.rel, linea, regla: 'evento-inline', que: `Atributo de evento en línea: ${a.nombre}=`, porque: PORQUE_JS_INLINE,
          arreglo: `Quitar ${a.nombre}= y escucharlo desde el .js: document.querySelector('#id').addEventListener('${a.nombre.slice(2)}', funcion);` });
      }
      if (ATTRS_URL.includes(a.nombre) && a.valor && /^\s*javascript:/i.test(a.valor)) {
        reportar({ sev: 'medio', archivo: ctx.rel, linea, regla: 'url-javascript', que: `URL "javascript:" en ${a.nombre}=`, porque: PORQUE_JS_INLINE,
          arreglo: 'Usar un <button type="button"> con addEventListener en el .js, o un enlace real (href="#seccion").' });
      }
      if (a.nombre === 'style' && a.valor && a.valor.trim()) {
        reportar({ sev: 'bajo', archivo: ctx.rel, linea, regla: 'estilo-inline', que: 'Atributo style="" en línea',
          porque: 'No es una rendija: la CSP base bloquea estilos en línea, así que ese estilo no se aplica y la página se ve distinta a lo diseñado.',
          arreglo: 'Mover esas reglas al .css del sitio con una clase (class="destacado").' });
      }
    }

    switch (t.name) {
      case 'html':
        vioHtml = true;
        if (!(v('lang') || '').trim()) {
          reportar({ sev: 'bajo', archivo: ctx.rel, linea, regla: 'a11y-lang', que: '<html> sin atributo lang (accesibilidad)',
            porque: 'No es riesgo de seguridad: el lector de pantalla no sabe en qué idioma leer y pronuncia mal.',
            arreglo: 'Cambiar a <html lang="es"> (o el idioma del sitio).' });
        }
        break;

      case 'meta': {
        const equiv = (v('http-equiv') || '').trim().toLowerCase();
        if (equiv === 'content-security-policy') {
          metasCsp.push({ linea, valor: v('content') || '', index: t.index });
        } else if (META_SIN_EFECTO.includes(equiv)) {
          reportar({ sev: 'info', archivo: ctx.rel, linea, regla: 'meta-sin-efecto', que: `<meta http-equiv="${equiv}"> no tiene efecto`,
            porque: 'MDN: no se deben poner otras cabeceras de seguridad en <meta http-equiv>, porque dan una falsa sensación de seguridad. Esa cabecera solo funciona como cabecera HTTP.',
            arreglo: 'Quitar ese <meta> y dejar la cabecera en _headers.' });
        }
        const prop = (v('property') || '').toLowerCase();
        if (prop === 'og:url') { const h = origenDe(v('content') || ''); if (h) origenesPropios.add(h); }
        break;
      }

      case 'script': {
        if (primeraCarga === null) primeraCarga = t.index;
        const src = v('src');
        const tipo = (v('type') || '').trim().toLowerCase();
        const crudo = tokens[k + 1] && tokens[k + 1].type === 'raw' ? tokens[k + 1] : null;
        if (src !== null) {
          if (esExterna(src)) reportarCargaExterna(ctx, linea, 'script', src);
          else if (/^\s*data:/i.test(src)) {
            reportar({ sev: 'alto', archivo: ctx.rel, linea, regla: 'script-data', que: 'Script con src="data:…" (código escondido dentro de la URL)',
              porque: 'Es código que no se ve a simple vista y obliga a abrir la CSP a data:, que deja pasar cualquier script inyectado.',
              arreglo: 'Pasar el código a un archivo .js de la carpeta y cargarlo con src="js/archivo.js".' });
          }
        } else if (crudo && crudo.value.trim()) {
          if (tipo === 'application/ld+json') {
            // Datos estructurados para buscadores: no se ejecutan. Permitido.
          } else if (TIPOS_JS.includes(tipo)) {
            reportar({ sev: 'medio', archivo: ctx.rel, linea, regla: 'script-inline', que: '<script> en línea (código dentro del HTML)', porque: PORQUE_JS_INLINE, arreglo: ARREGLO_JS_INLINE });
            analizarJs(crudo.value, crudo.index, ctx);
          } else {
            reportar({ sev: 'info', archivo: ctx.rel, linea, regla: 'script-datos', que: `<script type="${tipo}"> con contenido (bloque de datos, no se ejecuta)`,
              porque: 'No es riesgo directo, pero la regla del repo solo permite application/ld+json en línea.',
              arreglo: 'Confirmar que hace falta; si son datos, moverlos a un .json de la carpeta.' });
          }
        }
        break;
      }

      case 'style': {
        if (primeraCarga === null) primeraCarga = t.index;
        const crudo = tokens[k + 1] && tokens[k + 1].type === 'raw' ? tokens[k + 1] : null;
        if (crudo && crudo.value.trim()) {
          reportar({ sev: 'bajo', archivo: ctx.rel, linea, regla: 'estilo-inline', que: 'Bloque <style> en línea',
            porque: 'No es una rendija: la CSP base bloquea estilos en línea, así que ese bloque no se aplica y la página se ve distinta.',
            arreglo: 'Mover esas reglas al .css del sitio (p. ej. css/estilos.css).' });
          analizarCss(crudo.value, crudo.index, ctx);
        }
        break;
      }

      case 'link': {
        const rels = (v('rel') || '').toLowerCase().split(/\s+/).filter(Boolean);
        const href = v('href') || '';
        if (rels.includes('canonical')) { const h = origenDe(href); if (h) origenesPropios.add(h); }
        if (rels.some((r) => REL_QUE_CARGAN.includes(r))) {
          if (primeraCarga === null) primeraCarga = t.index;
          if (esExterna(href)) reportarCargaExterna(ctx, linea, rels.includes('stylesheet') || (v('as') || '') === 'font' || (v('as') || '') === 'style' ? 'estilo' : rels.includes('modulepreload') || (v('as') || '') === 'script' ? 'script' : 'otro', href);
        } else if (rels.some((r) => r === 'preconnect' || r === 'dns-prefetch') && esExterna(href)) {
          reportar({ sev: 'medio', archivo: ctx.rel, linea, regla: 'preconnect', que: `Conexión anticipada a otro dominio (rel="${rels.join(' ')}"): ${recortar(href)}`,
            porque: 'El navegador abre conexión con ese dominio en cada visita (le entrega la IP) aunque no cargue nada; suele ser un resto de Google Fonts.',
            arreglo: 'Borrar esa etiqueta <link>.' });
        }
        break;
      }

      case 'img': case 'source': case 'video': case 'audio': case 'track': case 'input': case 'image': case 'use': case 'iframe': case 'frame': case 'embed': case 'object': {
        if (primeraCarga === null && !['input', 'track'].includes(t.name)) primeraCarga = t.index;
        const tipoCarga = ['iframe', 'frame'].includes(t.name) ? 'iframe' : ['embed', 'object'].includes(t.name) ? 'objeto' : 'imagen';
        const urls = [];
        for (const n of ['src', 'poster', 'data', 'href', 'xlink:href']) {
          if (t.name === 'input' && (v('type') || '').toLowerCase() !== 'image') continue;
          const val = v(n);
          if (val) urls.push(val);
        }
        const srcset = v('srcset');
        if (srcset) for (const parte of srcset.split(',')) { const u = parte.trim().split(/\s+/)[0]; if (u) urls.push(u); }
        const externas = [...new Set(urls.filter(esExterna))];
        for (const u of externas) reportarCargaExterna(ctx, linea, tipoCarga, u);
        if (['embed', 'object'].includes(t.name) && !externas.length) {
          reportar({ sev: 'medio', archivo: ctx.rel, linea, regla: 'objeto', que: `<${t.name}> en la página`,
            porque: "La CSP base (object-src 'none') lo bloquea y es contenido activo innecesario en un sitio simple.",
            arreglo: 'Reemplazar por <img>, <video> o un enlace de descarga.' });
        }
        if (t.name === 'img' && attr(t, 'alt') === undefined) {
          reportar({ sev: 'bajo', archivo: ctx.rel, linea, regla: 'a11y-alt', que: '<img> sin atributo alt (accesibilidad)',
            porque: 'No es riesgo de seguridad: quien usa lector de pantalla no sabe qué muestra la imagen.',
            arreglo: 'Agregar alt="descripción breve de la imagen", o alt="" si es solo decorativa.' });
        }
        if (t.name === 'input') revisarCampo(t, linea);
        break;
      }

      case 'select': case 'textarea':
        revisarCampo(t, linea);
        break;

      case 'label':
        dentroDeLabel++;
        break;

      case 'a': case 'area': {
        const href = (v('href') || '').trim();
        if (/^http:\/\//i.test(href) && !RE_NAMESPACE.test(href)) {
          reportar({ sev: 'bajo', archivo: ctx.rel, linea, regla: 'enlace-http', que: `Enlace sin cifrar: ${recortar(href)}`,
            porque: 'La persona sale a una conexión que se puede leer o alterar en el camino (wifi pública).',
            arreglo: `Cambiar a ${recortar(href.replace(/^http:/i, 'https:'))} (comprobar antes que ese sitio abra con https).` });
        }
        revisarBlank(t, linea);
        break;
      }

      case 'form': {
        revisarBlank(t, linea);
        const action = (v('action') || '').trim();
        reportar({ sev: 'info', archivo: ctx.rel, linea, regla: 'formulario', que: 'Hay un formulario: revisar a mano lo que este script no ve',
          porque: 'Los bots de spam llenan formularios sin protección; los datos de las personas deben llegarle solo al cliente.',
          arreglo: 'Confirmar con Automatizaciones: campo trampa (honeypot), límite de envíos, campos mínimos, nada sensible, envío por HTTPS a una cuenta del cliente.' });
        revisarDestinoFormulario(action, linea, 'action');
        break;
      }

      case 'button': {
        const fa = v('formaction');
        if (fa) revisarDestinoFormulario(fa.trim(), linea, 'formaction');
        break;
      }

      default:
        break;
    }
  }

  function revisarCampo(t, linea) {
    const tipo = (valorAttr(t, 'type') || 'text').toLowerCase();
    if (t.name === 'input' && ['hidden', 'submit', 'reset', 'button', 'image'].includes(tipo)) return;
    const id = (valorAttr(t, 'id') || '').trim();
    const tieneNombre = ['aria-label', 'aria-labelledby', 'title'].some((n) => (valorAttr(t, n) || '').trim());
    if (dentroDeLabel > 0 || tieneNombre || (id && idsConLabel.has(id))) return;
    reportar({ sev: 'bajo', archivo: ctx.rel, linea, regla: 'a11y-label', que: `Campo de formulario sin etiqueta (<${t.name}${t.name === 'input' ? ` type="${tipo}"` : ''}>) (accesibilidad)`,
      porque: 'No es riesgo de seguridad: el lector de pantalla no sabe qué dato pide el campo.',
      arreglo: '<label for="campo-nombre">Nombre</label> + id="campo-nombre" en el campo (o envolver el campo dentro del <label>).' });
  }

  function revisarBlank(t, linea) {
    if ((valorAttr(t, 'target') || '').toLowerCase() !== '_blank') return;
    const rel = (valorAttr(t, 'rel') || '').toLowerCase().split(/\s+/);
    const faltan = ['noopener', 'noreferrer'].filter((x) => !rel.includes(x));
    if (!faltan.length) return;
    reportar({ sev: 'bajo', archivo: ctx.rel, linea, regla: 'blank-sin-rel', que: `target="_blank" sin ${faltan.join(' ni ')} en rel`,
      porque: 'Los navegadores actuales ya aplican noopener solos (MDN); en uno viejo, la pestaña nueva podría cambiar tu página por una falsa. noreferrer además no le cuenta al otro sitio de qué página vino la persona.',
      arreglo: 'Agregar rel="noopener noreferrer" a esa etiqueta.' });
  }

  function revisarDestinoFormulario(destino, linea, nombreAttr) {
    if (/^http:\/\//i.test(destino)) {
      reportar({ sev: 'alto', archivo: ctx.rel, linea, regla: 'formulario-http', que: `Formulario que envía sin cifrar (${nombreAttr}="${recortar(destino, 60)}")`,
        porque: 'Los datos que escribe la persona (nombre, teléfono, mensaje) viajan sin cifrar: se pueden leer en el camino.',
        arreglo: 'Derivar a Automatizaciones: el destino tiene que ser https:// y a una cuenta del cliente.' });
    } else if (esExterna(destino)) {
      reportar({ sev: 'medio', archivo: ctx.rel, linea, regla: 'formulario-externo', que: `Formulario que envía a otro dominio: ${origenDe(destino) || recortar(destino, 60)}`,
        porque: "Los datos de las personas llegan a un tercero (¿quién los guarda, dónde, a nombre de quién?). Además la CSP base (form-action 'self') bloquea el envío.",
        arreglo: 'Derivar a Automatizaciones: confirmar el servicio (a nombre del cliente) y su manejo de datos, campo trampa y límite de envíos; luego agregar ese dominio exacto a form-action en la CSP (meta y _headers).' });
    }
  }

  // --- CSP en <meta> ---
  if (vioHtml || /<head[\s>]/i.test(texto)) {
    if (!metasCsp.length) {
      reportar({ sev: 'medio', archivo: ctx.rel, linea: 1, regla: 'csp-falta-meta', que: 'La página no tiene CSP en <meta>',
        porque: 'La CSP (instrucción que le dice al navegador de dónde puede cargar cosas) es la defensa contra código inyectado. Va en <meta> para que la página quede protegida aunque se mueva a un hosting sin _headers.',
        arreglo: `Pegar como primera etiqueta dentro de <head>, justo después de <meta charset="utf-8">:\n${META_CSP_BASE}` });
    } else {
      if (metasCsp.length > 1) {
        reportar({ sev: 'info', archivo: ctx.rel, linea: metasCsp[1].linea, regla: 'csp-varias', que: 'Hay más de una CSP en <meta>',
          porque: 'El navegador aplica todas a la vez (la más estricta gana en cada punto): cuesta saber qué queda permitido.',
          arreglo: 'Dejar una sola etiqueta <meta http-equiv="Content-Security-Policy">.' });
      }
      const primera = metasCsp[0];
      if (primeraCarga !== null && primeraCarga < primera.index) {
        reportar({ sev: 'bajo', archivo: ctx.rel, linea: primera.linea, regla: 'csp-tarde', que: 'La CSP del <meta> aparece después de etiquetas que cargan recursos',
          porque: 'W3C CSP3: la política del <meta> no se aplica a lo que está antes de ella; eso queda sin protección.',
          arreglo: 'Moverla arriba: primera etiqueta dentro de <head>, justo después de <meta charset="utf-8">.' });
      }
      for (const m of metasCsp) revisarCsp(m.valor, ctx.rel, m.linea, 'meta');
    }
  }
}

// ---------------------------------------------------------------------------
// _headers (Cloudflare Pages / Workers static assets)
// ---------------------------------------------------------------------------
function analizarHeaders(texto, ctx, enRaiz) {
  if (!enRaiz) {
    reportar({ sev: 'info', archivo: ctx.rel, linea: 1, regla: 'headers-lugar', que: '_headers fuera de la raíz de la carpeta',
      porque: 'Cloudflare lo lee en la carpeta que se publica (la raíz del sitio); en una subcarpeta probablemente no se aplica (SUPUESTO: depende de qué carpeta se suba).',
      arreglo: 'Dejar un solo _headers en la raíz de lo que se publica.' });
  }
  const reglas = [];
  let actual = null;
  const lineas = texto.split(/\r?\n/);
  lineas.forEach((l, i) => {
    const n = i + 1;
    if (l.length > 2000) {
      reportar({ sev: 'medio', archivo: ctx.rel, linea: n, regla: 'headers-limite', que: 'Línea de _headers con más de 2.000 caracteres',
        porque: 'Cloudflare acepta hasta 2.000 caracteres por línea (https://developers.cloudflare.com/pages/configuration/headers/, consultado 2026-10-21); lo que se pase puede no aplicarse.',
        arreglo: 'Acortar la línea (normalmente la CSP): quitar fuentes que no se usan.' });
    }
    if (!l.trim() || l.trim().startsWith('#')) return;
    if (!/^\s/.test(l)) {
      actual = { ruta: l.trim(), linea: n, cabeceras: [] };
      reglas.push(actual);
      return;
    }
    const m = /^\s+(!\s*)?([A-Za-z0-9-]+)\s*:?\s*(.*)$/.exec(l);
    if (!m || !actual) return;
    actual.cabeceras.push({ nombre: m[2].toLowerCase(), valor: m[3].trim(), linea: n, quitar: Boolean(m[1]) });
  });
  if (reglas.length > 100) {
    reportar({ sev: 'medio', archivo: ctx.rel, linea: 1, regla: 'headers-limite', que: `_headers tiene ${reglas.length} reglas (el máximo es 100)`,
      porque: 'Cloudflare acepta hasta 100 reglas por archivo (https://developers.cloudflare.com/pages/configuration/headers/, consultado 2026-10-21).',
      arreglo: 'Juntar reglas: casi todo va bajo /*.' });
  }
  const global = reglas.find((r) => r.ruta === '/*');
  if (!global) {
    reportar({ sev: 'medio', archivo: ctx.rel, linea: 1, regla: 'headers-sin-global', que: '_headers no tiene una regla /* (las cabeceras no cubren todo el sitio)',
      porque: 'Las páginas que no calcen con ninguna ruta quedan sin cabeceras de seguridad.',
      arreglo: `Usar la línea base:\n${HEADERS_BASE}` });
    return;
  }
  const cab = new Map();
  for (const c of global.cabeceras) {
    if (c.quitar) {
      reportar({ sev: 'medio', archivo: ctx.rel, linea: c.linea, regla: 'headers-quita', que: `_headers QUITA la cabecera ${c.nombre} (línea con "!")`,
        porque: 'Una cabecera de seguridad quitada a propósito deja esa puerta abierta en todo el sitio.',
        arreglo: 'Borrar esa línea con "!" salvo que haya una razón anotada.' });
      continue;
    }
    if (!cab.has(c.nombre)) cab.set(c.nombre, c);
  }
  const L1 = global.linea;
  const csp = cab.get('content-security-policy');
  if (!csp) {
    reportar({ sev: 'medio', archivo: ctx.rel, linea: L1, regla: 'headers-sin-csp', que: '_headers sin Content-Security-Policy',
      porque: 'La CSP como cabecera es la versión completa (incluye frame-ancestors, que en <meta> no funciona).',
      arreglo: `Agregar bajo /*:\n${HEADERS_BASE.split('\n')[1]}` });
  } else revisarCsp(csp.valor, ctx.rel, csp.linea, 'headers');

  const nosniff = cab.get('x-content-type-options');
  if (!nosniff || nosniff.valor.toLowerCase() !== 'nosniff') {
    reportar({ sev: 'bajo', archivo: ctx.rel, linea: nosniff ? nosniff.linea : L1, regla: 'headers-nosniff', que: '_headers sin X-Content-Type-Options: nosniff',
      porque: 'Sin nosniff, el navegador puede "adivinar" el tipo de un archivo y ejecutar como script algo que no lo era (MDN).',
      arreglo: 'Agregar bajo /*:\n  X-Content-Type-Options: nosniff' });
  }
  const ref = cab.get('referrer-policy');
  if (!ref) {
    reportar({ sev: 'bajo', archivo: ctx.rel, linea: L1, regla: 'headers-referrer', que: '_headers sin Referrer-Policy',
      porque: 'strict-origin-when-cross-origin ya es el valor por defecto cuando no se indica otro (MDN), pero dejarlo escrito lo asegura en navegadores viejos.',
      arreglo: 'Agregar bajo /*:\n  Referrer-Policy: strict-origin-when-cross-origin' });
  } else if (/unsafe-url|no-referrer-when-downgrade/i.test(ref.valor)) {
    reportar({ sev: 'bajo', archivo: ctx.rel, linea: ref.linea, regla: 'headers-referrer', que: `Referrer-Policy permisiva (${ref.valor})`,
      porque: 'Le cuenta a otros sitios la dirección completa de la página desde donde llegó la persona.',
      arreglo: 'Cambiar a: Referrer-Policy: strict-origin-when-cross-origin' });
  }
  if (!cab.get('permissions-policy')) {
    reportar({ sev: 'bajo', archivo: ctx.rel, linea: L1, regla: 'headers-permissions', que: '_headers sin Permissions-Policy',
      porque: 'Endurecimiento: apaga cámara, micrófono, ubicación y pagos que el sitio no usa, por si se cuela un script. MDN lo marca como de soporte limitado (no todos los navegadores lo aplican).',
      arreglo: 'Agregar bajo /*:\n  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()' });
  }
  const xfo = cab.get('x-frame-options');
  const fa = csp && parsearCsp(csp.valor).has('frame-ancestors');
  if (!fa && !(xfo && /^(deny|sameorigin)$/i.test(xfo.valor))) {
    reportar({ sev: 'bajo', archivo: ctx.rel, linea: L1, regla: 'headers-framing', que: '_headers sin protección contra ser incrustado (frame-ancestors / X-Frame-Options)',
      porque: 'Otro sitio podría mostrar el tuyo dentro de un marco invisible o con su propio diseño encima (clickjacking). En un sitio sin cuentas el daño es bajo.',
      arreglo: "Agregar frame-ancestors 'none' a la CSP de _headers y, para navegadores viejos:\n  X-Frame-Options: DENY" });
  }
  const hsts = cab.get('strict-transport-security');
  if (hsts && /preload/i.test(hsts.valor)) {
    reportar({ sev: 'info', archivo: ctx.rel, linea: hsts.linea, regla: 'headers-hsts-preload', que: 'HSTS con preload',
      porque: 'MDN: una vez en la lista de precarga, salir es difícil y lento. Es decisión del responsable del sitio, no un default.',
      arreglo: 'Si no fue decisión anotada, quitar "; preload" (dejar max-age e includeSubDomains si el dominio es solo HTTPS).' });
  }
  const xxss = cab.get('x-xss-protection');
  if (xxss && xxss.valor.trim() !== '0') {
    reportar({ sev: 'info', archivo: ctx.rel, linea: xxss.linea, regla: 'headers-xxss', que: `X-XSS-Protection: ${xxss.valor}`,
      porque: 'OWASP recomienda 0 o no enviarla: el filtro viejo de XSS podía abrir problemas propios; la protección real es la CSP.',
      arreglo: 'Quitar la línea o dejar: X-XSS-Protection: 0' });
  }
}

// ---------------------------------------------------------------------------
// Revisiones que aplican a cualquier archivo de texto
// ---------------------------------------------------------------------------
function buscarSecretos(texto, ctx) {
  const lineas = texto.split('\n');
  lineas.forEach((l, i) => {
    const n = i + 1;
    const vistos = [];
    for (const p of SECRETOS) {
      for (const m of l.matchAll(new RegExp(p.re.source, 'g'))) {
        if (p.exigeDigito && !/\d/.test(m[0])) continue;
        vistos.push(m[0]);
        const mostrado = p.ocultarTodo ? '[contenido no mostrado]' : tapar(m[0]);
        reportar({ sev: p.sev, archivo: ctx.rel, linea: n, regla: 'secreto', unir: false,
          que: `Secreto a la vista: ${p.nombre} (${mostrado})${pareceDePrueba(m[0]) ? ' — parece de prueba; igual se saca' : ''}`,
          porque: 'En un sitio estático todo lo publicado es público: cualquiera que abra el código fuente puede copiar la llave y usarla a nombre del cliente (gasto, datos, cuentas).',
          arreglo: `Sacarla del archivo y CAMBIARLA en ${p.donde}, porque ya estuvo a la vista. Un sitio estático no puede guardar secretos: si hace falta una llave, va en un servicio de servidor (derivar a Automatizaciones).` });
      }
    }
    const yaVisto = (v) => vistos.some((s) => s.includes(v) || v.includes(s));
    for (const re of [RE_ASIGNACION, RE_PARAM_URL]) {
      for (const m of l.matchAll(new RegExp(re.source, 'gi'))) {
        const [, campo, valor] = m;
        if (RE_RELLENO.test(valor) || yaVisto(valor) || /^https?:/i.test(valor)) continue;
        vistos.push(valor);
        reportar({ sev: 'alto', archivo: ctx.rel, linea: n, regla: 'secreto-posible', unir: false,
          que: `Parece un secreto: ${campo} = ${tapar(valor)}${pareceDePrueba(valor) ? ' — parece de prueba; igual se saca' : ''}`,
          porque: 'Si es una clave o contraseña real, cualquiera que vea el código fuente la tiene.',
          arreglo: 'Confirmar qué es. Si es real: sacarla del sitio y cambiarla en el servicio donde se usa. Si es un falso positivo, renombrar la variable para que no parezca clave.' });
      }
    }
    for (const m of l.matchAll(new RegExp(RE_VAR_LARGA.source, 'g'))) {
      const [, nombreVar, valor] = m;
      if (yaVisto(valor) || entropia(valor) < 3.5 || !/[A-Za-z]/.test(valor) || !/\d/.test(valor)) continue;
      reportar({ sev: 'alto', archivo: ctx.rel, linea: n, regla: 'secreto-posible', unir: false,
        que: `Texto largo y aleatorio en una variable (${nombreVar} = ${tapar(valor)}): podría ser un token`,
        porque: 'Las llaves suelen verse así. Si lo es, cualquiera que abra el .js la tiene.',
        arreglo: 'Confirmar qué es. Si es una llave: sacarla del sitio y cambiarla. Si no lo es (un id público, un hash), anotarlo.' });
    }
    const pemPublico = /-----BEGIN (?!(?:[A-Z0-9]+ )*PRIVATE KEY)[A-Z0-9 ]+-----/.exec(l);
    if (pemPublico) {
      reportar({ sev: 'bajo', archivo: ctx.rel, linea: n, regla: 'pem', que: `Bloque ${recortar(pemPublico[0], 50)}`,
        porque: 'Certificados y llaves públicas no son secretos, pero no tienen por qué estar en un sitio de negocio.',
        arreglo: 'Confirmar que es público y que hace falta; si no, sacarlo.' });
    }
  });
}

// Dominios reservados para ejemplos (RFC 2606/6761): no son correos reales.
const RE_DOMINIO_EJEMPLO = /(^|\.)(example\.(com|org|net)|[a-z0-9-]+\.(example|test|invalid|localhost|local))$/i;
const EXT_NO_TLD = /^(png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|json|html?|woff2?|ttf|otf|mp4|webm|pdf)$/i;

function buscarCorreos(texto, ctx) {
  const vistos = new Map();
  for (const m of texto.matchAll(/[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.([A-Za-z]{2,}))\b/g)) {
    if (EXT_NO_TLD.test(m[2])) continue; // logo@2x.png no es un correo
    const correo = m[0].toLowerCase();
    if (!vistos.has(correo)) vistos.set(correo, []);
    vistos.get(correo).push(ctx.linea(m.index));
  }
  for (const [correo, lineas] of vistos) {
    const dominio = correo.split('@')[1];
    const ejemplo = RE_DOMINIO_EJEMPLO.test(dominio);
    for (const linea of lineas) {
      reportar({ sev: ejemplo ? 'info' : 'bajo', archivo: ctx.rel, linea, regla: 'correo-visible', que: `Correo a la vista: ${correo}${ejemplo ? ' (dominio de ejemplo)' : ''}`,
        porque: ejemplo
          ? 'Es un dominio reservado para ejemplos: en una demo está bien. En un sitio real, un correo a la vista atrae spam de bots.'
          : 'Los bots recorren sitios juntando correos para mandar spam (SUPUESTO: práctica conocida, no medida aquí).',
        arreglo: 'Puede esperar. Opciones: botón de WhatsApp (wa.me) o formulario con campo trampa (Automatizaciones); si el correo se queda, que sea uno del negocio con buen filtro de spam.' });
    }
  }
}

function buscarHttp(texto, ctx) {
  for (const m of texto.matchAll(/http:\/\/[^\s"'<>)\]]+/gi)) {
    if (RE_NAMESPACE.test(m[0])) continue;
    // xmlns="http://…" es un nombre de espacio: el navegador no lo descarga.
    if (/xmlns(:[\w-]+)?\s*=\s*["']?$/i.test(texto.slice(Math.max(0, m.index - 30), m.index))) continue;
    const linea = ctx.linea(m.index);
    if (lineasConHallazgo.has(`${ctx.rel}:${linea}`)) continue; // ya avisado por otra regla
    reportar({ sev: 'bajo', archivo: ctx.rel, linea, regla: 'http-texto', clave: `${ctx.rel}|http-texto`,
      que: `Dirección http:// (sin cifrar), p. ej. ${recortar(m[0], 70)}`,
      porque: 'Lo que viaja por http:// se puede leer o cambiar en el camino; si se carga desde una página https, el navegador lo bloquea o avisa (contenido mixto).',
      arreglo: 'Cambiar a https:// (comprobar que ese destino responde con https) o usar una ruta relativa si es del mismo sitio.' });
  }
}

// ---------------------------------------------------------------------------
// Archivos que no deberían publicarse (puertas 4 y 5)
// ---------------------------------------------------------------------------
const NO_PUBLICAR = [
  { re: /^\.env(\..*)?$/i, sev: 'alto', que: 'Archivo .env (variables de entorno: suelen tener claves)' },
  { re: /\.(pem|key|p12|pfx|jks|keystore|ppk)$|^id_(rsa|dsa|ecdsa|ed25519)$/i, sev: 'alto', que: 'Archivo de llave o certificado privado' },
  { re: /^\.htpasswd$/i, sev: 'alto', que: 'Archivo de contraseñas (.htpasswd)' },
  { re: /\.(sql|sqlite3?|db|mdb)$/i, sev: 'alto', que: 'Base de datos o volcado (.sql/.db)' },
  { re: /\.(bak|old|orig|backup|swp|swo|tmp)$|~$/i, sev: 'medio', que: 'Respaldo o archivo temporal' },
  { re: /\.(zip|rar|7z|tar|gz|tgz|bz2)$/i, sev: 'medio', que: 'Archivo comprimido (puede ser un respaldo completo)' },
  { re: /^(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|composer\.json)$/i, sev: 'medio', que: 'Archivo de dependencias (la regla es cero dependencias)' },
  { re: /\.(log)$/i, sev: 'bajo', que: 'Archivo de registro (.log)' },
  { re: /\.map$/i, sev: 'bajo', que: 'Mapa de código fuente (.map)' },
  { re: /^(\.DS_Store|Thumbs\.db|desktop\.ini)$/i, sev: 'bajo', que: 'Archivo del sistema operativo (revela nombres de archivos)' },
  { re: /\.(md|markdown|csv|xlsx?|ods|docx?)$/i, sev: 'info', que: 'Documento o nota que se publicaría junto al sitio' },
];

function revisarNombre(rel, nombre) {
  for (const r of NO_PUBLICAR) {
    if (!r.re.test(nombre)) continue;
    reportar({ sev: r.sev, archivo: rel, linea: 0, regla: 'archivo-no-publicar', que: `${r.que}: ${nombre}`,
      porque: r.sev === 'info'
        ? 'En un sitio estático todo lo que está en la carpeta se publica. Si es parte del sitio, bien; si es una nota interna o tiene datos de clientes, no.'
        : 'En un sitio estático todo lo que está en la carpeta se publica y se puede descargar con solo adivinar el nombre.',
      arreglo: r.sev === 'info' ? 'Confirmar que es parte del sitio; si no, sacarlo de la carpeta que se sube.' : 'Sacarlo de la carpeta que se publica (guardarlo fuera del sitio). Si tenía claves, cambiarlas.' });
    return;
  }
}

// ---------------------------------------------------------------------------
// Recorrido de la carpeta
// ---------------------------------------------------------------------------
const archivos = [];
const especiales = [];
function recorrer(dir) {
  let entradas;
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    especiales.push({ tipo: 'error', rel: relative(RAIZ, dir), detalle: e.code || e.message });
    return;
  }
  for (const e of entradas) {
    const ruta = join(dir, e.name);
    const rel = relative(RAIZ, ruta).split(sep).join('/');
    // No seguimos enlaces simbólicos: podrían apuntar fuera de la carpeta autorizada.
    if (e.isSymbolicLink()) { especiales.push({ tipo: 'enlace', rel }); continue; }
    if (e.isDirectory()) {
      if (e.name === '.git' || e.name === 'node_modules') { especiales.push({ tipo: e.name, rel }); continue; }
      recorrer(ruta);
    } else if (e.isFile()) {
      if (resolve(ruta) === ESTE_SCRIPT) continue; // no revisarse a sí mismo
      archivos.push({ ruta, rel, nombre: e.name, ext: extname(e.name).toLowerCase() });
    }
  }
}
recorrer(RAIZ);

for (const s of especiales) {
  if (s.tipo === '.git') {
    reportar({ sev: 'alto', archivo: s.rel, linea: 0, regla: 'archivo-no-publicar', que: 'Carpeta .git dentro del sitio',
      porque: 'Si se sube tal cual, cualquiera puede bajar el historial completo, incluido lo que alguna vez se borró (SUPUESTO: depende de si el método de subida la ignora).',
      arreglo: 'Publicar desde una carpeta sin .git (copiar solo los archivos del sitio).' });
  } else if (s.tipo === 'node_modules') {
    reportar({ sev: 'medio', archivo: s.rel, linea: 0, regla: 'archivo-no-publicar', que: 'Carpeta node_modules dentro del sitio',
      porque: 'Son dependencias de terceros (la regla es cero) y se publicarían enteras.',
      arreglo: 'Sacarla de la carpeta del sitio. Si el sitio la necesita para funcionar, avisar al responsable: rompe la regla de cero dependencias.' });
  } else if (s.tipo === 'enlace') {
    reportar({ sev: 'info', archivo: s.rel, linea: 0, regla: 'enlace-simbolico', que: 'Enlace simbólico (no se siguió)',
      porque: 'Podría apuntar fuera de la carpeta; no se revisó lo que hay al otro lado.', arreglo: 'Reemplazarlo por el archivo real si es parte del sitio.' });
  } else {
    reportar({ sev: 'info', archivo: s.rel || '.', linea: 0, regla: 'error-lectura', que: `No pude leer esta carpeta (${s.detalle})`,
      porque: 'Lo que no se lee no se revisa.', arreglo: 'Revisar permisos y volver a correr.' });
  }
}

// Primera pasada: leer textos y juntar los orígenes propios (canonical/og:url)
// antes de decidir qué URL es "externa".
const textos = new Map();
const MAX_BYTES = 5 * 1024 * 1024;
for (const a of archivos) {
  revisarNombre(a.rel, a.nombre);
  let buf;
  try {
    buf = readFileSync(a.ruta);
  } catch (e) {
    reportar({ sev: 'info', archivo: a.rel, linea: 0, regla: 'error-lectura', que: `No pude leer el archivo (${e.code || e.message})`, porque: 'Lo que no se lee no se revisa.', arreglo: 'Revisar permisos y volver a correr.' });
    continue;
  }
  // Binario (imagen, fuente…): tiene bytes 0 al principio. No se analiza como texto.
  if (buf.length > MAX_BYTES || buf.subarray(0, 8000).includes(0)) continue;
  const texto = buf.toString('utf8');
  textos.set(a.rel, texto);
  if (['.html', '.htm'].includes(a.ext)) {
    for (const m of texto.matchAll(/<link\b[^>]*rel=["']?canonical["']?[^>]*>/gi)) {
      const h = /href=["']?([^"'\s>]+)/i.exec(m[0]);
      if (h && origenDe(h[1])) origenesPropios.add(origenDe(h[1]));
    }
    for (const m of texto.matchAll(/<meta\b[^>]*property=["']?og:url["']?[^>]*>/gi)) {
      const h = /content=["']?([^"'\s>]+)/i.exec(m[0]);
      if (h && origenDe(h[1])) origenesPropios.add(origenDe(h[1]));
    }
  }
}

// Segunda pasada: análisis por tipo de archivo.
const conteo = { html: 0, css: 0, js: 0, headers: 0, otros: 0, binarios: archivos.length - textos.size };
let headersEnRaiz = false;
for (const a of archivos) {
  const texto = textos.get(a.rel);
  if (texto === undefined) continue;
  const ctx = { rel: a.rel, linea: crearContadorDeLineas(texto) };
  buscarSecretos(texto, ctx);
  if (a.nombre === '_headers') {
    conteo.headers++;
    const enRaiz = !a.rel.includes('/');
    if (enRaiz) headersEnRaiz = true;
    analizarHeaders(texto, ctx, enRaiz);
    continue; // en _headers, http:// y correos no aplican
  }
  if (['.html', '.htm'].includes(a.ext)) { conteo.html++; analizarHtml(texto, ctx); }
  else if (a.ext === '.svg') { conteo.otros++; analizarHtml(texto, ctx); } // un SVG puede traer <script> y on*
  else if (a.ext === '.css') { conteo.css++; analizarCss(texto, 0, ctx); }
  else if (['.js', '.mjs', '.cjs'].includes(a.ext)) { conteo.js++; analizarJs(texto, 0, ctx); }
  else conteo.otros++;
  buscarCorreos(texto, ctx);
  if (EXT_WEB.includes(a.ext)) buscarHttp(texto, ctx);
}

if (!headersEnRaiz) {
  reportar({ sev: 'medio', archivo: '_headers', linea: 0, regla: 'headers-falta', que: 'No hay archivo _headers en la raíz de la carpeta',
    porque: 'Sin él, el sitio publicado no envía las cabeceras de seguridad (CSP completa, nosniff, protección contra marcos, Permissions-Policy).',
    arreglo: `Crear un archivo llamado _headers (sin extensión) en la raíz con:\n${HEADERS_BASE}` });
}

// ---------------------------------------------------------------------------
// Informe
// ---------------------------------------------------------------------------
const lista = [...hallazgos.values()].sort((a, b) =>
  SEV[a.sev].orden - SEV[b.sev].orden || a.archivo.localeCompare(b.archivo) || (a.lineas[0] || 0) - (b.lineas[0] || 0));
const cuenta = Object.fromEntries(Object.keys(SEV).map((k) => [k, lista.filter((h) => h.sev === k).length]));
const bloquea = cuenta.critico + cuenta.alto > 0;

const ubicacion = (h) => {
  if (!h.lineas.length || (h.lineas.length === 1 && h.lineas[0] === 0)) return h.archivo;
  const ls = h.lineas.filter(Boolean).sort((x, y) => x - y);
  const muestra = ls.slice(0, 10).join(', ');
  return `${h.archivo}:${muestra}${ls.length > 10 ? ` (y ${ls.length - 10} más)` : ''}`;
};
const sangrar = (s, pref) => String(s).split('\n').map((l, i) => (i === 0 ? l : pref + l)).join('\n');

const out = [];
const relRaiz = relative(process.cwd(), RAIZ).split(sep).join('/') || '.';
out.push(col('1', `CHEQUEO DE SEGURIDAD — ${relRaiz} · ${HOY}`));
out.push(`Archivos: ${archivos.length} (html ${conteo.html} · css ${conteo.css} · js ${conteo.js} · _headers ${conteo.headers} · otros de texto ${conteo.otros} · binarios ${conteo.binarios})`);
out.push('Método: lectura automática de archivos, sin red. Cada hallazgo está PROBADO en el archivo; su efecto en el sitio publicado no se probó aquí.');
out.push('');
if (!lista.length) {
  out.push(`Primero:   Sin hallazgos en lo revisado.`);
} else {
  const p = lista[0];
  out.push(`Primero:   [${SEV[p.sev].etiqueta}] ${ubicacion(p)} — ${p.que}`);
}
if (bloquea) out.push(col('1;31', `Veredicto: NO ENTREGAR hasta arreglar ${cuenta.critico} crítico(s) y ${cuenta.alto} alto(s).`));
else if (cuenta.medio) out.push(col('33', `Veredicto: sin bloqueos, pero hay ${cuenta.medio} medio(s) que se arreglan antes de entregar (o se anota la decisión del responsable).`));
else out.push(col('32', `Veredicto: se puede entregar en lo que este script revisa; pendientes que pueden esperar: ${cuenta.bajo + cuenta.info}. Falta la revisión manual (docs/seguridad-checklist.md).`));

let numero = 0;
for (const sev of Object.keys(SEV)) {
  const grupo = lista.filter((h) => h.sev === sev);
  if (!grupo.length) continue;
  out.push('');
  out.push(col(SEV[sev].color, `${SEV[sev].etiqueta} (${grupo.length}) — ${SEV[sev].nota}`));
  for (const h of grupo) {
    numero++;
    out.push(`${String(numero).padStart(3)}. ${col(SEV[sev].color, `[${SEV[sev].etiqueta}]`)} ${ubicacion(h)} · ${h.regla}`);
    out.push(`     Qué es:  ${sangrar(h.que, '              ')}`);
    out.push(`     Por qué: ${sangrar(h.porque, '              ')}`);
    out.push(`     Arreglo: ${sangrar(h.arreglo, '              ')}`);
  }
}
out.push('');
out.push(`Resumen: crítico ${cuenta.critico} · alto ${cuenta.alto} · medio ${cuenta.medio} · bajo ${cuenta.bajo} · informativo ${cuenta.info}`);
out.push('No revisado por este script (va a mano, ver docs/seguridad-checklist.md): cabeceras reales del sitio publicado, HTTPS,');
out.push('dominio y hosting (2FA, renovación, titular), DNS, a dónde llegan los formularios, licencias de fuentes e imágenes.');
out.push(`Código de salida: ${bloquea ? 1 : 0}${bloquea ? ' (hay crítico o alto)' : ''}`);

console.log(out.join('\n'));
// exitCode en vez de process.exit(): así la salida no se corta cuando va a un pipe.
process.exitCode = bloquea ? 1 : 0;
