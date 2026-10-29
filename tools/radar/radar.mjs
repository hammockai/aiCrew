// radar.mjs · v1.0 · 2026-10-29 · MIT · Hammock AI
// ES: junta las ofertas remotas del día y actualiza un solo archivo (por defecto, ofertas.md).
// EN: gathers the day's remote job listings and updates a single file (default: ofertas.md).
//
// Uso / Usage:  node radar.mjs            → solo ofertas nuevas / only new listings
//               node radar.mjs --todas    → incluye las ya vistas / includes already-seen ones
//
// Sin dependencias: Node 18+ trae fetch. / No dependencies: Node 18+ ships fetch.
// Una pasada al día por fuente: respeta los límites y términos de cada fuente (ver README).
// One pass per day per source: respect each source's limits and terms (see README).
// Configuración / Configuration: config.json (copia/copy config.ejemplo.json).
// Archivos que genera, en esta carpeta / Files it writes, in this folder: vistos.json, textos.json, ofertas.md.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

// ---------- configuración ----------
let CFG;
try { CFG = JSON.parse(await readFile(join(AQUI, 'config.json'), 'utf8')); }
catch (err) {
  console.error(err.code === 'ENOENT'
    ? 'Falta config.json: copia config.ejemplo.json como config.json y edítalo. / config.json is missing: copy config.ejemplo.json to config.json and edit it.'
    : `Error en config.json / config.json error: ${err.message}`);
  process.exit(1);
}

// Valores por defecto y minúsculas (las palabras se comparan en minúsculas). Las claves que empiezan con "_" son comentarios.
const minus = l => (l ?? []).map(p => String(p).toLowerCase());
CFG.dias ??= 3; CFG.diasPendientes ??= 7; CFG.diasGetOnBoard ??= 21; CFG.maxPorLinea ??= 25;
CFG.lineas = Object.fromEntries(Object.entries(CFG.lineas ?? {})
  .filter(([k]) => !k.startsWith('_'))
  .map(([k, L]) => [k, { ...L, incluir: minus(L.incluir), excluir: minus(L.excluir), soloConExtras: minus(L.soloConExtras) }]));
CFG.extras = minus(CFG.extras);
CFG.alertas = minus(CFG.alertas);
CFG.geo = { abiertas: minus(CFG.geo?.abiertas), cerradas: minus(CFG.geo?.cerradas) };
CFG.plataformasManuales ??= []; CFG.getonboardCategorias ??= {}; CFG.fuentesApagadas ??= []; CFG.jobicyGeo ??= ['anywhere'];
if (!Object.keys(CFG.lineas).length) {
  console.error('config.json no tiene líneas de trabajo ("lineas"). / config.json has no job lines ("lineas").');
  process.exit(1);
}

const ES = CFG.idioma !== 'en'; // "idioma": "es" (por defecto) o "en"
const t = (es, en) => (ES ? es : en);

const VISTOS_PATH = join(AQUI, 'vistos.json');
const SALIDA = resolve(AQUI, CFG.salida ?? 'ofertas.md');
const TODAS = process.argv.includes('--todas');
const HOY = new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD en hora local
const LIMITE = Date.now() - CFG.dias * 86400000;

// ---------- utilidades ----------
const UA = { 'User-Agent': 'aicrew-radar/1.0 (uso personal, una pasada al dia / personal use, one pass per day)' };
async function traer(url, tipo = 'json') {
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return tipo === 'json' ? r.json() : r.text();
}

// Algunas fuentes mandan textos con doble codificación (Ã¡, â€™): se corrige si se nota.
function arreglarTexto(s = '') {
  s = String(s);
  if (/[ÃÂâ][\x80-\xBF]/.test(s)) { try { s = Buffer.from(s, 'latin1').toString('utf8'); } catch {} }
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&ndash;|&mdash;/g, '-')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/\s+/g, ' ').trim();
}
const tag = (xml, t) => { const m = xml.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)); return m ? m[1] : ''; };
const celda = s => String(s ?? '').replace(/\|/g, '/').slice(0, 70);

// Oferta normalizada: { fuente, titulo, empresa, url, region, fecha(ms), etiquetas[], texto }
// ---------- fuentes ----------
// Cada fuente tiene sus propios términos: revisa el README antes de encender o apagar una.
const FUENTES = {
  async 'Jobicy'() {
    const out = [];
    for (const geo of CFG.jobicyGeo) {
      const d = await traer(`https://jobicy.com/api/v2/remote-jobs?count=100&geo=${encodeURIComponent(geo)}`);
      for (const j of d.jobs ?? []) out.push({
        titulo: j.jobTitle, empresa: j.companyName, url: j.url, region: j.jobGeo,
        fecha: Date.parse(j.pubDate), etiquetas: [...(j.jobIndustry ?? []), ...(j.jobType ?? [])], texto: j.jobExcerpt,
      });
    }
    return out;
  },
  async 'Remote OK'() { // apagada por defecto en config.ejemplo.json
    const d = await traer('https://remoteok.com/api');
    return d.filter(j => j.id).map(j => ({ // el primer elemento es el aviso legal
      titulo: j.position, empresa: j.company, url: j.url, region: j.location || '',
      fecha: Date.parse(j.date), etiquetas: j.tags ?? [], texto: (j.description ?? '').slice(0, 1500),
    }));
  },
  async 'We Work Remotely'() { // apagada por defecto en config.ejemplo.json
    const xml = await traer('https://weworkremotely.com/remote-jobs.rss', 'text');
    return xml.split('<item>').slice(1).map(it => {
      const t = arreglarTexto(tag(it, 'title')); const i = t.indexOf(': ');
      return {
        titulo: i > 0 ? t.slice(i + 2) : t, empresa: i > 0 ? t.slice(0, i) : '',
        url: tag(it, 'link').trim(), region: [tag(it, 'region'), tag(it, 'country')].filter(Boolean).join(', '),
        fecha: Date.parse(tag(it, 'pubDate')), etiquetas: [tag(it, 'category'), tag(it, 'type')],
        texto: tag(it, 'description').slice(0, 8000),
      };
    });
  },
  async 'Himalayas'() { // listado general, por cursor
    const out = []; let cursor = '';
    for (let p = 0; p < 5; p++) {
      const d = await traer(`https://himalayas.app/jobs/api?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      for (const j of d.jobs ?? []) out.push({
        titulo: j.title, empresa: j.companyName, url: j.applicationLink || j.guid,
        region: (j.locationRestrictions ?? []).join(', ') || 'Worldwide',
        fecha: j.pubDate * 1000, etiquetas: [...(j.categories ?? []), ...(j.parentCategories ?? [])], texto: j.excerpt,
      });
      if (!d.nextCursor) break; cursor = d.nextCursor;
    }
    return out;
  },
  async 'Get on Board'() { // latinoamericana; por categoría (config: getonboardCategorias), solo remotas
    const out = [];
    for (const [cat, linea] of Object.entries(CFG.getonboardCategorias)) {
      if (cat.startsWith('_')) continue;
      const d = await traer(`https://www.getonbrd.com/api/v0/categories/${cat}/jobs?per_page=50&expand=["company"]`);
      for (const j of d.data ?? []) {
        const a = j.attributes;
        if (!['fully_remote', 'remote_local'].includes(a.remote_modality)) continue;
        out.push({
          titulo: a.title, empresa: a.company?.data?.attributes?.name ?? '', url: j.links?.public_url,
          region: a.remote_modality === 'remote_local' ? 'LATAM (Get on Board, remoto local: revisar país)' : 'LATAM (Get on Board)',
          fecha: a.published_at * 1000, etiquetas: [a.category_name], texto: (a.description ?? '').slice(0, 4000), linea,
        });
      }
    }
    return out;
  },
  async 'Remotive'() { // complemento: la API gratis trae pocas ofertas y con 24 h de retraso
    const d = await traer('https://remotive.com/api/remote-jobs?limit=100');
    return (d.jobs ?? []).map(j => ({
      titulo: j.title, empresa: j.company_name, url: j.url, region: j.candidate_required_location,
      fecha: Date.parse(j.publication_date), etiquetas: [j.category, ...(j.tags ?? [])], texto: (j.description ?? '').slice(0, 1500),
    }));
  },
  async 'Working Nomads'() { // complemento: sus términos no mencionan la API → uso personal y moderado
    const d = await traer('https://www.workingnomads.com/api/exposed_jobs/');
    return d.map(j => ({
      titulo: j.title, empresa: j.company_name, url: j.url, region: j.location,
      fecha: Date.parse(j.pub_date), etiquetas: [j.category_name, ...String(j.tags ?? '').split(',')], texto: (j.description ?? '').slice(0, 1500),
    }));
  },
};

// ---------- clasificación ----------
const contiene = (txt, lista) => lista.filter(p => txt.includes(p));
// Puestos que solo valen si aparece un "extra" (por ejemplo, un idioma): config → soloConExtras
const soloSiHayExtra = (L, titulo, todo) => {
  const hits = contiene(titulo, L.incluir);
  return L.soloConExtras.length > 0 && hits.length > 0 && hits.every(p => L.soloConExtras.includes(p)) && !contiene(todo, CFG.extras).length;
};

function geo(region) {
  const r = (region || '').toLowerCase();
  if (!r.trim()) return '❓';
  if (contiene(r, CFG.geo.abiertas).length) return '✅';
  if (contiene(r, CFG.geo.cerradas).length) return '❌';
  return '❓';
}

function clasificar(o) {
  const t = ` ${o.titulo} `.toLowerCase();
  const e = o.etiquetas.join(' ').toLowerCase();
  const d = o.texto.toLowerCase();
  let mejor = null;
  if (o.linea && CFG.lineas[o.linea]) {
    const L = CFG.lineas[o.linea];
    if (contiene(t, L.excluir).length) return null;
    mejor = { id: o.linea, puntos: 3 + contiene(t, L.incluir).length * 3 };
  }
  for (const [id, L] of Object.entries(CFG.lineas)) {
    if (contiene(t, L.excluir).length) continue;
    const pt = contiene(t, L.incluir).length, pe = contiene(e, L.incluir).length, pd = contiene(d, L.incluir).length;
    if (!pt && !(pe && pd)) continue; // la palabra va en el título, o en etiquetas y descripción a la vez
    if (soloSiHayExtra(L, t, `${t} ${e} ${d}`)) continue; // puesto que exige un extra y no lo tiene → fuera
    const puntos = pt * 3 + pe * 2 + Math.min(pd, 3);
    if (!mejor || puntos > mejor.puntos) mejor = { id, puntos };
    if (o.linea) break;
  }
  if (!mejor) return null;
  const todo = `${t} ${e} ${d}`;
  const extra = contiene(todo, CFG.extras).length > 0;
  const alerta = contiene(todo, CFG.alertas);
  return { ...mejor, puntos: mejor.puntos + (extra ? 2 : 0), extra, alerta };
}

// ---------- programa ----------
let vistos = {};
try { vistos = JSON.parse(await readFile(VISTOS_PATH, 'utf8')); } catch {}

const estado = [];
const todas = [];
for (const [nombre, fn] of Object.entries(FUENTES)) {
  if (CFG.fuentesApagadas.includes(nombre)) continue; // apagada en config.json
  try {
    const lista = (await fn()).map(o => ({ ...o, fuente: nombre, titulo: arreglarTexto(o.titulo), empresa: arreglarTexto(o.empresa), texto: arreglarTexto(o.texto), etiquetas: (o.etiquetas ?? []).filter(Boolean).map(String) }));
    estado.push({ nombre, ok: true, n: lista.length });
    todas.push(...lista);
  } catch (err) {
    estado.push({ nombre, ok: false, error: err.message });
  }
}

// Antes de clasificar: lo que ya cerraste en el archivo de salida (❌ o 📤) no vuelve
try {
  for (const l of (await readFile(SALIDA, 'utf8')).split('\n')) {
    const c = l.split('|').slice(1, -1).map(x => x.trim());
    const u = (l.match(/\]\((https?:[^)\s]+)\)/) || [])[1];
    if (u && c.length >= 7 && /^(❌|📤)/.test(c[6])) vistos[u] = 'cerrada';
  }
} catch {}

const porLinea = Object.fromEntries(Object.keys(CFG.lineas).map(k => [k, []]));
const sospechosas = [];
const unicas = new Set();
let fueraRegion = 0, viejas = 0, repetidas = 0;

for (const o of todas) {
  if (!o.url || unicas.has(o.url)) continue;
  unicas.add(o.url);
  const lim = o.fuente === 'Get on Board' ? Date.now() - CFG.diasGetOnBoard * 86400000 : LIMITE; // en Get on Board las ofertas duran semanas
  if (!(o.fecha >= lim)) { viejas++; continue; }
  const c = clasificar(o);
  if (!c) continue;
  const g = geo(o.region);
  if (g === '❌') { fueraRegion++; continue; }
  if (vistos[o.url] === 'cerrada') { repetidas++; continue; }
  if (vistos[o.url] && vistos[o.url] !== HOY && !TODAS) { repetidas++; continue; } // lo visto hoy se repite: correr dos veces no deja el día en cero
  const fila = { ...o, ...c, geo: g };
  (c.alerta.length ? sospechosas : porLinea[c.id]).push(fila);
}

// ordenar: región abierta primero, luego puntaje, luego fecha
const orden = (a, b) => (a.geo === '✅' ? 0 : 1) - (b.geo === '✅' ? 0 : 1) || b.puntos - a.puntos || b.fecha - a.fecha;
for (const k in porLinea) porLinea[k].sort(orden);

// ---------- archivo único de salida ----------
// Cada día se reescribe el mismo archivo: entran las nuevas, se quedan las pendientes de días anteriores
// y salen las enviadas (📤, ya están en tu registro), las descartadas (❌) y las que llevan más de
// "diasPendientes" sin moverse. La columna Estado la marcan el Avistador o tú.
const DIAS_PEND = CFG.diasPendientes;
const CORTE_PEND = new Date(Date.now() - DIAS_PEND * 86400000).toLocaleDateString('sv-SE');
const fmtFecha = ms => new Date(ms).toLocaleDateString('sv-SE');
const idPorNombre = Object.fromEntries(Object.entries(CFG.lineas).map(([k, L]) => [L.nombre, k]));

// Lee las filas de un archivo de salida anterior
function leerFilas(texto) {
  const filas = []; let linea = null;
  for (const l of texto.split('\n')) {
    if (l.startsWith('## ')) { linea = idPorNombre[l.slice(3).trim()] ?? null; continue; }
    if (!linea || !l.startsWith('|') || !l.includes('](http')) continue;
    const c = l.split('|').slice(1, -1).map(s => s.trim());
    const url = (l.match(/\]\((https?:[^)\s]+)\)/) || [])[1];
    if (!url) continue;
    filas.push({ linea, url, marca: c[0].replace('🆕', '').trim(), puesto: c[1], empresa: c[2], region: c[3], fuente: c[4], fecha: c[5], estado: c[6] ?? '' });
  }
  return filas;
}
let previas = [];
try { previas = leerFilas(await readFile(SALIDA, 'utf8')); } catch {} // primera vez: no hay archivo
const cerrada = e => /^(📤|❌)/.test(e);
let salieron = 0;
const pendientes = new Map();
for (const p of previas) {
  const cortePend = p.fuente === 'Get on Board' ? new Date(Date.now() - CFG.diasGetOnBoard * 86400000).toLocaleDateString('sv-SE') : CORTE_PEND;
  if (cerrada(p.estado)) vistos[p.url] = 'cerrada'; // descartada o enviada: no vuelve nunca
  if (cerrada(p.estado) || p.fecha < cortePend) { salieron++; pendientes.delete(p.url); continue; }
  // las pendientes vuelven a pasar por el filtro vigente (si cambió config.json, se aplican igual)
  if (CFG.fuentesApagadas.includes(p.fuente) && p.estado === '') { salieron++; pendientes.delete(p.url); continue; }
  const L = CFG.lineas[p.linea], tit = ` ${((p.puesto.match(/^\[(.*)\]\(/) || [])[1] ?? '').toLowerCase()} `;
  if (!L || contiene(tit, L.excluir).length || soloSiHayExtra(L, tit, tit) || geo(p.region) === '❌') { salieron++; pendientes.delete(p.url); continue; }
  pendientes.set(p.url, p);
}

const filaNueva = f => `| 🆕 ${f.geo}${f.extra ? ' ⭐' : ''} | [${celda(f.titulo)}](${f.url}) | ${celda(f.empresa)} | ${celda(f.region)} | ${f.fuente} | ${fmtFecha(f.fecha)} |  |`;
const filaVieja = p => `| ${p.marca} | ${p.puesto} | ${p.empresa} | ${p.region} | ${p.fuente} | ${p.fecha} | ${p.estado} |`;

let total = 0, arrastradas = 0;
let md = `# ${t('Radar de ofertas', 'Job radar')}\n**${t('Actualizado', 'Updated')}: ${HOY}** · ${t('se reescribe cada mañana', 'rewritten every morning')}\n\n`;
md += t(
  `**Estado** (lo marcan el Avistador o tú): vacío = sin revisar · ⏳ por leer · 📝 lista para enviar · 📤 enviada · ❌ descartada (con su razón)\n`,
  `**Status** (marked by the Avistador or by you): empty = not reviewed · ⏳ to read · 📝 ready to send · 📤 sent · ❌ discarded (with the reason)\n`);
md += t(
  `Al día siguiente salen las 📤 (quedan en tu registro) y las ❌. Las demás se quedan hasta ${DIAS_PEND} días desde su publicación.\n`,
  `The next day the 📤 (kept in your log) and the ❌ drop out. The rest stay up to ${DIAS_PEND} days from their publication date.\n`);
md += t(
  `Leyenda: 🆕 nueva hoy · ✅ región abierta · ❓ revisar la región · ⭐ coincide con tus extras (idioma, región…)\n\n`,
  `Legend: 🆕 new today · ✅ open region · ❓ check the region · ⭐ matches your extras (language, region…)\n\n`);

md += `## ${t('Revisión manual (plataformas sin API)', 'Manual check (platforms without an API)')}\n`;
for (const p of CFG.plataformasManuales) md += `- [ ] [${p.nombre}](${p.url}) · ${CFG.lineas[p.linea]?.nombre ?? p.linea ?? ''}${p.nota ? ` · ${p.nota}` : ''}\n`;
md += '\n';

const cabecera = t(
  '| | Puesto | Empresa | Región | Fuente | Fecha | Estado |\n|---|---|---|---|---|---|---|',
  '| | Role | Company | Region | Source | Date | Status |\n|---|---|---|---|---|---|---|');
let cuerpo = '';
for (const [k, l] of Object.entries(porLinea)) {
  const nuevas = l.filter(f => !pendientes.has(f.url)).slice(0, CFG.maxPorLinea);
  const previasLinea = [...pendientes.values()].filter(p => p.linea === k);
  total += nuevas.length; arrastradas += previasLinea.length;
  cuerpo += `## ${CFG.lineas[k].nombre}\n${t('CV sugerido', 'Suggested CV')}: ${CFG.lineas[k].cv ?? '—'}\n\n`;
  cuerpo += (nuevas.length || previasLinea.length)
    ? [cabecera, ...previasLinea.map(filaVieja), ...nuevas.map(filaNueva)].join('\n') + '\n\n'
    : t('_Nada pendiente en esta línea._\n\n', '_Nothing pending on this line._\n\n');
}
md += t(
  `**${total} nuevas hoy · ${arrastradas} pendientes de días anteriores · ${salieron} salieron** (enviadas, descartadas o con más de ${DIAS_PEND} días)\n`,
  `**${total} new today · ${arrastradas} pending from earlier days · ${salieron} dropped** (sent, discarded or older than ${DIAS_PEND} days)\n`);
md += t(
  `Filtradas por el radar: ${fueraRegion} por región cerrada, ${repetidas} ya vistas, ${viejas} antiguas.\n\n`,
  `Filtered by the radar: ${fueraRegion} closed region, ${repetidas} already seen, ${viejas} too old.\n\n`) + cuerpo;

if (sospechosas.length) {
  md += `## ⚠️ ${t('Sospechosas de hoy (revisar con cuidado antes de abrir)', "Suspicious today (check carefully before opening)")}\n`;
  md += sospechosas.map(f => `- [${celda(f.titulo)}](${f.url}) · ${celda(f.empresa)} · ${f.fuente} · ${t('señal', 'signal')}: "${f.alerta.join('", "')}"`).join('\n') + '\n\n';
}

md += `## ${t('Fuentes', 'Sources')} (${HOY})\n| ${t('Fuente', 'Source')} | ${t('Estado', 'Status')} |\n|---|---|\n`;
md += estado.map(s => `| ${s.nombre} | ${s.ok ? `✅ ${s.n} ${t('ofertas leídas', 'listings read')}` : `❌ ${s.error}`} |`).join('\n');
md += t(
  `\n\n_Ofertas de ${estado.filter(s => s.ok).map(s => s.nombre).join(', ') || '—'}. Cada link lleva a la oferta original: se postula allí._\n`,
  `\n\n_Listings from ${estado.filter(s => s.ok).map(s => s.nombre).join(', ') || '—'}. Each link goes to the original listing: apply there._\n`);

// ---------- guardar ----------
await writeFile(SALIDA, md, 'utf8');
// Texto de cada oferta del día, para cuando la web no deja leerla
const textos = {};
const enLista = new Set([...pendientes.keys(), ...Object.values(porLinea).flat().map(f => f.url), ...sospechosas.map(f => f.url)]);
for (const f of todas) if (enLista.has(f.url)) textos[f.url] = { titulo: f.titulo, empresa: f.empresa, region: f.region, fuente: f.fuente, texto: f.texto };
let previosTextos = {}; try { previosTextos = JSON.parse(await readFile(join(AQUI, 'textos.json'), 'utf8')); } catch {}
for (const u of pendientes.keys()) if (!textos[u] && previosTextos[u]) textos[u] = previosTextos[u];
await writeFile(join(AQUI, 'textos.json'), JSON.stringify(textos, null, 1), 'utf8');

for (const l of [...Object.values(porLinea), sospechosas]) for (const f of l) vistos[f.url] ??= HOY;
const corte = new Date(Date.now() - 45 * 86400000).toLocaleDateString('sv-SE'); // olvida lo visto hace más de 45 días
for (const [u, d] of Object.entries(vistos)) if (d !== 'cerrada' && d < corte) delete vistos[u];
await writeFile(VISTOS_PATH, JSON.stringify(vistos, null, 1), 'utf8');

console.log(t(`Radar listo: ${SALIDA}`, `Radar done: ${SALIDA}`));
console.log(`${t(`${total} nuevas, ${arrastradas} pendientes, ${salieron} salieron`, `${total} new, ${arrastradas} pending, ${salieron} dropped`)} · ${sospechosas.length} ${t('sospechosas', 'suspicious')} · ${t('fuentes', 'sources')}: ${estado.map(s => `${s.nombre} ${s.ok ? s.n : 'ERROR'}`).join(', ')}`);
