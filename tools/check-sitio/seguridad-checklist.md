# Checklist de seguridad por entrega: sitio estático de negocio chico
*v1 · 2026-10-21 · La Cerrajera (seguridad) · Hammock AI · CC BY-SA 4.0*

Sirve para cada sitio que sale de `base/` o `demos/` y se publica en **Cloudflare Pages a nombre del cliente**. No es una auditoría ni una prueba de intrusión: al terminar no se dice "seguro", se dice **qué puertas se revisaron y cuáles no**.

**Cómo se usa (en orden):**
1. `node tools/check.mjs <carpeta-del-sitio>` → tiene que salir con **0 crítico y 0 alto** (código de salida 0).
2. Recorrer lo manual de esta lista.
3. Informe de La Cerrajera (formato A de su prompt): primero lo más grave, cada hallazgo con su arreglo exacto. **El responsable del proyecto decide si sale.**

**Leyenda**
- **[A]** lo revisa `check.mjs` (automático, lectura de archivos, sin red).
- **[M]** lo revisa a mano quien entrega (el responsable o La Cerrajera).
- **[C]** lo confirma el cliente en su propio panel. La Cerrajera **no entra a cuentas ni pide claves**: lo que se ve en un panel se anota como "confirmado por el cliente".
- Severidad si falla: **crítico / alto** (no se entrega) · **medio** (se arregla antes, salvo decisión anotada del responsable) · **bajo / info** (puede esperar).

---

## 1. Código y archivos de la carpeta
En un sitio estático **todo lo que está en la carpeta se publica**: lo que no es del sitio, no va.

| # | Qué | Cómo | Si falla |
|---|---|---|---|
| 1.1 | Sin secretos: claves de API, tokens, contraseñas, llaves privadas | [A] | crítico (se cambia la llave, no solo se borra) |
| 1.2 | Sin archivos que no se suben: `.env`, `.bak`, `.zip`, `.sql`, `.git`, `node_modules`, notas internas, planillas con datos de clientes | [A] + [M] mirar la lista de archivos | alto / medio |
| 1.3 | Cero recursos de otro dominio: scripts, hojas de estilo, fuentes, imágenes, iframes, mapas o videos incrustados, píxeles | [A] | alto |
| 1.4 | Sin rastreo ni analítica sin consentimiento | [A] firmas conocidas + [M] | alto |
| 1.5 | Sin `<script>` en línea (salvo `type="application/ld+json"`), sin atributos `on*`, sin `javascript:`, sin `eval` / `new Function` | [A] | medio |
| 1.6 | `innerHTML` / `document.write` solo con texto propio y fijo | [A] avisa + [M] confirmar de dónde viene el contenido | bajo (medio si viene de la URL o de un formulario) |
| 1.7 | `target="_blank"` con `rel="noopener noreferrer"` | [A] | bajo |
| 1.8 | Sin `http://` (enlaces ni recursos) | [A] | bajo (alto si es un recurso cargado) |
| 1.9 | Cero dependencias (`package.json`, `node_modules`) | [A] | medio |
| 1.10 | Fotos sin metadatos de ubicación (EXIF con GPS), sobre todo si el negocio funciona en una casa | [M] abrir propiedades de cada foto o exportarlas sin metadatos | medio si revela un domicilio particular (SUPUESTO: depende de la cámara y de cómo se exportó la foto). `check.mjs` no lee imágenes |
| 1.11 | Leer el HTML completo una vez: comentarios con notas internas, nombres o datos que no deberían estar | [M] (los datos personales en lo público los cruza Guardian) | según lo que aparezca |
| 1.12 | Accesibilidad mínima: `<html lang>`, `alt` en imágenes, `<label>` en campos | [A] | bajo (no es seguridad, pero la seguridad no la rompe) |

## 2. Cabeceras de seguridad
*Cabecera de seguridad: una instrucción que el sitio le da al navegador (por ejemplo, "solo carga cosas de este mismo sitio").*

| # | Qué | Cómo | Si falla |
|---|---|---|---|
| 2.1 | CSP en `<meta>` en **cada** página, como primera etiqueta de `<head>` (justo después de `<meta charset>`) | [A] | medio |
| 2.2 | `_headers` en la raíz de lo que se publica, con la línea base de abajo | [A] | medio (sin CSP) / bajo (el resto) |
| 2.3 | La CSP no tiene `'unsafe-inline'`, `'unsafe-eval'` ni `*` | [A] | medio |
| 2.4 | La página se ve y funciona con la CSP puesta: consola del navegador sin errores "Refused to load / Refused to execute" | [M] abrir en local y en el sitio publicado | medio (algo quedó roto o se abrió la CSP para arreglarlo) |
| 2.5 | Las cabeceras **reales** del sitio publicado coinciden con `_headers` | [M] **solo en el dominio autorizado del cliente**: DevTools → Network → el documento → Response Headers, o `curl -sI https://<dominio-del-cliente>/` | medio. Mientras no se pruebe en vivo, va SUPUESTO |
| 2.6 | HSTS solo cuando el dominio sirve únicamente HTTPS, y **sin `preload`** salvo decisión anotada del responsable | [A] avisa si hay preload + [M] | info |

**Línea base de `_headers`** (va en la raíz de la carpeta publicada, archivo sin extensión):
```
/*
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
  X-Frame-Options: DENY
```
**CSP del `<meta>`** (la misma, **sin** `frame-ancestors`, porque en `<meta>` se ignora):
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests">
```
Va en las dos partes para que el sitio siga protegido aunque el cliente lo mueva a un hosting que no lea `_headers`.

**Por qué cada una (con fuente):**

| Cabecera | Qué hace | Fuente (consultada 2026-10-21) |
|---|---|---|
| `Content-Security-Policy` | Lista de dónde puede cargar cosas la página. Con `default-src` presente, se bloquean `<script>` en línea, atributos de evento, `javascript:`, `<style>` en línea y `style=""`, además de `eval()` y `new Function()`. MDN: evitar `'unsafe-inline'` y `'unsafe-eval'` porque "defeats much of the purpose of having a CSP". | VERIFICADO HOY · MDN, Content-Security-Policy y guía CSP |
| CSP en `<meta>` | No acepta `report-uri`, `frame-ancestors` ni `sandbox`, y **no se aplica a lo que está antes** del `<meta>` en el documento. | VERIFICADO HOY · W3C CSP Level 3 (Working Draft del 16-09-2026) |
| `base-uri`, `form-action` | **No** heredan de `default-src`: hay que escribirlas. MDN (form-action): "Not setting this allows anything." | VERIFICADO HOY · MDN default-src y form-action |
| `X-Content-Type-Options: nosniff` | Impide que el navegador "adivine" el tipo de un archivo y lo ejecute como script. | VERIFICADO HOY · MDN; OWASP HTTP Headers Cheat Sheet |
| `Referrer-Policy: strict-origin-when-cross-origin` | A otros sitios solo les dice el dominio de origen, no la página completa. MDN: es el valor por defecto cuando no se indica otro (cambio de la especificación de noviembre de 2020); se deja escrito igual para navegadores viejos. | VERIFICADO HOY · MDN; OWASP |
| `Permissions-Policy` | Apaga cámara, micrófono, ubicación, pagos y USB que el sitio no usa. MDN lo marca de **disponibilidad limitada** (no todos los navegadores lo aplican): es endurecimiento, no una defensa principal. | VERIFICADO HOY · MDN; OWASP |
| `X-Frame-Options: DENY` y `frame-ancestors 'none'` | Impiden que otro sitio muestre el tuyo dentro de un marco (clickjacking). `frame-ancestors` es la forma moderna; `X-Frame-Options` cubre navegadores viejos. **Ninguna funciona en `<meta>`.** | VERIFICADO HOY · MDN X-Frame-Options y frame-ancestors; OWASP |
| `Strict-Transport-Security` | Obliga a usar HTTPS en las visitas siguientes. Se ignora si llega por http. MDN advierte que salir de la lista de precarga es difícil y lento. OWASP recomienda `preload`; **aquí no va por defecto** por ese costo de salida. | VERIFICADO HOY · MDN; OWASP |
| `X-XSS-Protection` | No se envía (o se pone en `0`): el filtro viejo podía causar problemas propios; la protección real es la CSP. | VERIFICADO HOY · OWASP |
| `<meta http-equiv>` para otras cabeceras | MDN: no poner otras cabeceras de seguridad en `<meta http-equiv>` porque dan una falsa sensación de seguridad. | VERIFICADO HOY · MDN meta http-equiv |
| `_headers` en Cloudflare Pages | Sintaxis por ruta, máximo 100 reglas y 2.000 caracteres por línea; solo para archivos estáticos. | https://developers.cloudflare.com/pages/configuration/headers/ (2026-10-21) |
| Cabeceras que Pages agrega por defecto | La página oficial de `_headers` no las lista. | NO VERIFICADO · se comprueba en vivo (2.5) |

## 3. Hosting: Cloudflare Pages

| # | Qué | Cómo | Si falla |
|---|---|---|---|
| 3.1 | Cuenta de Cloudflare **a nombre del cliente**, con un correo que el cliente controla | [C] | alto |
| 3.2 | **Segundo factor (2FA)** activo en esa cuenta. Ruta: My Profile → Authentication. Métodos: llave de seguridad (o Windows Hello / Touch ID), app de códigos (TOTP) o código por correo. Guardar los **códigos de respaldo**. Cloudflare recomienda tener al menos dos factores distintos. | [C] · VERIFICADO HOY: developers.cloudflare.com/fundamentals/user-profiles/2fa/ | alto |
| 3.3 | Si quien hizo el sitio lo mantiene: entra como **miembro invitado**, nunca con la clave del cliente, y su acceso se retira al terminar la mantención | [C] · NO VERIFICADO: roles y miembros de Cloudflare | alto si se usa la clave del cliente |
| 3.4 | HTTPS funciona en el dominio propio y `http://` redirige a `https://` | [M] probar en el sitio publicado y autorizado. NO VERIFICADO si Pages lo hace solo (pendiente en la biblioteca). Si el dominio es zona de Cloudflare, existe **Always Use HTTPS** en SSL/TLS → Edge Certificates (VERIFICADO HOY); ojo: no arregla el contenido mixto | alto si el sitio abre sin HTTPS |
| 3.5 | Se sube **solo** la carpeta del sitio (no la del repo con `tools/`, `docs/` ni `.git`) | [M] | según lo que se suba (ver 1.2) |
| 3.6 | Proyectos de prueba o viejos borrados, con su dominio quitado primero (ver 5.2) | [M] / [C] | alto si queda un dominio apuntando a un proyecto borrado |

*Dato de la biblioteca:* un proyecto creado por Direct Upload no se puede pasar después a Git (https://developers.cloudflare.com/pages/get-started/direct-upload/, 2026-10-21).

## 4. Dominio

| # | Qué | Cómo | Si falla |
|---|---|---|---|
| 4.1 | **Titular (registrante) del dominio = el cliente** (persona o empresa), no quien hizo el sitio ni la agencia | [C] mostrar la ficha del dominio en el registrador | alto (si el cliente no es dueño, no controla su nombre en internet) |
| 4.2 | **2FA** en la cuenta del registrador | [C] | alto |
| 4.3 | **Renovación automática** activa, medio de pago vigente y avisos a un correo que el cliente lee | [C] | alto (un dominio vencido deja al negocio sin sitio y sin correo, y otro lo puede registrar) |
| 4.4 | Correo de recuperación del registrador controlado por el cliente, con 2FA | [C] | alto |

**Cloudflare Registrar** (si el dominio está ahí) · VERIFICADO HOY, developers.cloudflare.com/registrar/account-options/renew-domains/: la renovación automática viene **activada por defecto** (al precio de lista del registro); si el cobro falla, reintenta tres veces antes del vencimiento y avisa por correo; después hay que renovar a mano. Un dominio vencido entra en un período de gracia de 30 días en que se puede recuperar, quizá con un costo extra, y no se puede transferir.
**Otros registradores** (por ejemplo NIC Chile para `.cl`): NO VERIFICADO. Antes de afirmar algo, se revisa su documentación oficial.

## 5. DNS

| # | Qué | Cómo | Si falla |
|---|---|---|---|
| 5.1 | Inventario: cada registro apunta a algo que **existe** y es del cliente | [M] con el cliente en su panel, o [C] | alto |
| 5.2 | Al dar de baja algo: **primero se borra el registro DNS, después el proyecto**. Un registro que apunta a un servicio borrado permite que otro "reclame" ese subdominio y publique lo que quiera bajo el nombre del negocio (subdomain takeover). MDN: "Start deprovisioning by removing DNS records first." | [M] / [C] · VERIFICADO HOY: MDN Subdomain takeover. En Pages: DNS → borrar el CNAME; después Custom domains → Remove domain (https://developers.cloudflare.com/pages/configuration/custom-domains/) | alto |
| 5.3 | Sin registros de prueba olvidados | [M] / [C] | medio |
| 5.4 | Si el dominio envía correo: registros que impiden que otro mande correos a nombre del negocio (SPF, DKIM, DMARC) | [C] con el proveedor de correo · NO VERIFICADO aquí: fuera de esta lista base | medio · SUPUESTO |

## 6. Correo expuesto y cuentas de correo

| # | Qué | Cómo | Si falla |
|---|---|---|---|
| 6.1 | Correos a la vista en el sitio (texto o `mailto:`) | [A] los lista | bajo: puede esperar. Los bots juntan correos de los sitios para spam (SUPUESTO: práctica conocida, no medida). Opciones: botón de WhatsApp (`wa.me`), formulario con campo trampa, o un correo del negocio con buen filtro |
| 6.2 | El correo del negocio (el que recupera las demás cuentas) tiene 2FA | [C] | alto: quien entra a ese correo entra a todo lo demás |

## 7. Formularios (solo si el sitio tiene uno; los construye Automatizaciones)

| # | Qué | Cómo | Si falla |
|---|---|---|---|
| 7.1 | `action` por HTTPS y hacia un servicio **a nombre del cliente** | [A] avisa si es externo (medio) o `http://` (alto) + [M] | alto / medio |
| 7.2 | Campo trampa (honeypot) y límite de envíos; CAPTCHA solo si hace falta, y accesible | [M] | medio (spam en la bandeja del cliente) |
| 7.3 | Campos mínimos y nada sensible (RUT, salud, tarjetas, claves) | [M] | alto si pide datos sensibles |
| 7.4 | Los datos le llegan **solo** al cliente; `form-action` de la CSP ajustado al dominio exacto (en `<meta>` y en `_headers`) | [M] | medio |
| 7.5 | Aviso de para qué se usan los datos | [M] · información general, no asesoría legal: para la ley de datos personales se deriva a un profesional | según el caso |

## 8. Privacidad
- Sin analítica, píxeles ni rastreo sin consentimiento ([A] detecta firmas conocidas; [M] el resto).
- Fuentes de Google, mapas y videos incrustados **también** le avisan de cada visita a un tercero: se reemplazan por archivos locales o por enlaces ([A] los detecta como recurso externo).

## 9. Respaldo y traspaso

| # | Qué | Cómo | Si falla |
|---|---|---|---|
| 9.1 | Copia de la carpeta **exacta** que se publicó (zip con fecha) guardada en el repo privado y entregada al cliente, sin secretos | [M] | medio (sin copia, un error en el panel se vuelve rehacer el sitio) |
| 9.2 | El cliente tiene acceso a Cloudflare, al registrador y al correo, con sus códigos de respaldo de 2FA guardados en un gestor de claves | [C] | alto |
| 9.3 | Guía para el cliente: cómo activar 2FA, dónde guardar los códigos y a quién avisar si ve algo raro | [M] (`docs/` del repo) | medio |
| 9.4 | Al terminar la mantención: se retira el acceso de quien mantuvo el sitio y se anota la fecha | [C] | alto si queda un acceso que nadie vigila |

## 10. Cierre
1. Volver a correr `node tools/check.mjs <carpeta>` después de cada arreglo.
2. Cada hallazgo queda **cerrado (PROBADO)** o **sigue abierto** con la razón.
3. Informe con: puertas revisadas, puertas no revisadas y por qué, y lo que confirmó el cliente.

---

## Lo que esta checklist NO cubre
- **No es una prueba de intrusión ni una garantía.** Se revisan estas puertas; no se dice "seguro".
- **Sitios con cuentas de usuario, pagos, datos sensibles o código en servidor** (Pages Functions, Workers con lógica): necesitan una revisión aparte.
- La seguridad de **los servicios de terceros** (Cloudflare, el registrador, el proveedor de formularios o de correo) y su disponibilidad ante ataques de tráfico masivo.
- **Los equipos** del cliente y de quien hace el sitio (virus, robo de sesión, phishing).
- **Leyes de datos personales y políticas de privacidad**: solo información general; se deriva a un profesional.
- **El contenido** (valores, datos personales en lo público): lo revisa Guardian.
- **Sitios de terceros o de posibles clientes: nunca se revisan ni se escanean**, ni siquiera "solo las cabeceras", sin permiso escrito de su dueño.

## Límites de `check.mjs` (para no confiarse)
- Lee patrones en archivos de texto; **no es un navegador**: no ejecuta el JS ni ve lo que se arma al cargar la página.
- **Puede dar falsos positivos** (un texto largo que no es clave) y **falsos negativos** (un secreto con un formato que no conoce, un recurso externo armado por partes en el JS). Lo dudoso se confirma a mano.
- No sabe si un secreto está vigente: todo secreto encontrado se trata como real y se cambia.
- No ve el sitio publicado: cabeceras reales, HTTPS, redirecciones y lo que agrega Cloudflare quedan para 2.5 y 3.4.
- No abre imágenes ni archivos binarios (metadatos de fotos: punto 1.10). No sigue enlaces simbólicos.
- No revisa cuentas, dominio ni DNS (secciones 3 a 6).

## Fuentes (consultadas el 2026-10-21)
- MDN, Content-Security-Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy
- MDN, guía CSP: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
- MDN, default-src: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/default-src
- MDN, form-action: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/form-action
- MDN, frame-ancestors: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors
- W3C, Content Security Policy Level 3 (Working Draft, 16-09-2026): https://www.w3.org/TR/CSP3/
- MDN, meta http-equiv: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/http-equiv
- MDN, X-Content-Type-Options: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options
- MDN, Referrer-Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referrer-Policy
- MDN, Permissions-Policy: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Permissions-Policy
- MDN, X-Frame-Options: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Frame-Options
- MDN, Strict-Transport-Security: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security
- MDN, rel=noopener: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener
- MDN, Subdomain takeover: https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Subdomain_takeover
- OWASP, HTTP Headers Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
- Cloudflare, Two-factor authentication: https://developers.cloudflare.com/fundamentals/user-profiles/2fa/
- Cloudflare, Always Use HTTPS: https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/
- Cloudflare Registrar, Renew domains: https://developers.cloudflare.com/registrar/account-options/renew-domains/
- Cloudflare Pages, Headers: https://developers.cloudflare.com/pages/configuration/headers/

*Las páginas se leyeron en versión procesada (resumen), no el texto exacto. Copia con más de 30 días: se vuelve a verificar antes de citarla.*
