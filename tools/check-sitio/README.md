# check-sitio — chequeo de seguridad y servidor local para sitios estáticos

Herramientas de **Security** (`agents/es/seguridad.md`) y **The Builder** (`agents/es/constructor-web.md`). Node ≥ 18, cero dependencias, sin red. Licencia MIT.

## `check.mjs` — chequeo de seguridad antes de entregar
Node ≥ 18, **cero dependencias, sin red**: solo lee los archivos de la carpeta que le pasas.

```
node check.mjs mi-sitio
node check.mjs base --sin-color      # sin colores (para guardar la salida en un archivo)
```

**Qué revisa:** secretos (salen tapados: `sk-…a1b2`), recursos de otro dominio (scripts, estilos, fuentes, imágenes, iframes, `@import`, `url()`, `fetch`), código en línea (`<script>`, `on*=`, `javascript:`, `eval`, `new Function`, `innerHTML`), CSP en `<meta>` de cada página y `_headers` con la línea base, rastreadores conocidos, archivos que no se suben (`.env`, `.bak`, `.zip`, `.git`, `node_modules`…), correos a la vista, `http://`, `target="_blank"` sin `rel`, formularios que envían a otro dominio, y tres puntos de accesibilidad (`lang`, `alt`, `<label>`).

**Cómo leer la salida:** primero el hallazgo más grave y el veredicto; después la lista por severidad, cada uno con `archivo:línea`, qué es, por qué importa y el arreglo exacto.

| Código de salida | Significa |
|---|---|
| `0` | Sin crítico ni alto. Lo medio se arregla antes de entregar (o se anota la decisión del responsable); lo bajo e informativo puede esperar. |
| `1` | Hay crítico o alto: **no entregar**. |
| `2` | Error de uso (falta la carpeta o no existe). |

**Pásale la carpeta del sitio**, no la raíz de un repo con otras cosas.

**Límites:** lee patrones, no es un navegador; puede dar falsos positivos (se confirman a mano) y no ve el sitio publicado, el hosting, el dominio ni las cuentas. Lo manual está en `seguridad-checklist.md`.


## `serve.mjs` — ver un sitio en local (The Builder)
Node ≥ 18, **cero dependencias**. Sirve una carpeta solo en `127.0.0.1` y aplica el bloque `/*` de su `_headers` (así la CSP se prueba de verdad).

```
node serve.mjs mi-sitio          # http://127.0.0.1:8080/
node serve.mjs base 8081
```

**Seguridad:** no sirve nada fuera de la carpeta pedida (bloquea `../`, `%2e%2e`, `%2f`, `\`, `:`, archivos ocultos como `.env` o `.git`, y enlaces simbólicos que apunten fuera), no sirve `_headers` ni `_redirects` (como Cloudflare Pages), rechaza un `Host` que no sea `127.0.0.1` o `localhost`, y solo acepta GET y HEAD. Tipos MIME correctos con `X-Content-Type-Options: nosniff`.

**Límites:** imita lo básico de Cloudflare Pages (`404.html`, `/pagina` → `pagina.html`), no `_redirects` ni las reglas de `*.pages.dev`. Es para mirar en tu computador, nunca para publicar.

¿Prefieres que hagamos tu sitio, con esta revisión incluida? → https://hammockai.site
