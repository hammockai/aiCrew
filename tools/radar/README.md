# Radar de trabajo remoto

*v1.0 · 2026-10-29 · Licencia MIT · [English](README.en.md)*

Un script que cada día junta las ofertas de trabajo remoto de varias fuentes abiertas, deja solo las que calzan con lo que buscas y las escribe en **un solo archivo** (`ofertas.md`). Alimenta a **El Avistador** y **La Estafeta** (ver [Cómo se combina con los prompts](#cómo-se-combina-con-el-avistador-y-la-estafeta)), pero también sirve solo: es un archivo de texto que puedes leer tú.

**Probado con ofertas reales.** No necesita cuenta, ni servidor, ni IA, ni instalar paquetes.

## Qué hace
- Lee 7 fuentes de ofertas remotas (5 encendidas por defecto, ver [Fuentes](#fuentes-y-sus-términos)), una vez al día.
- Clasifica cada oferta en tus **líneas de trabajo** con las palabras que tú eliges.
- Marca la región (✅ abierta, ❓ por revisar; descarta las cerradas), las que piden algo que te favorece (⭐, por ejemplo un idioma) y las **sospechosas de estafa** (van aparte, con la señal que las delató).
- No repite lo ya visto: lo que marcaste como enviado (📤) o descartado (❌) no vuelve.
- Reescribe `ofertas.md` cada vez: entran las nuevas, se quedan las pendientes y salen las viejas.

## Qué no hace
- **No postula por ti.** Cada link lleva a la oferta original y ahí postulas tú.
- **No lee la oferta por ti:** filtra por palabras, no entiende el texto. Abre la oferta entera antes de decidir.
- No garantiza ofertas ni resultados, y no reemplaza tu criterio.
- No usa inteligencia artificial: la IA la ponen los prompts (más abajo), si quieres usarlos.

## Qué necesitas
- **Node.js 18 o más nuevo** (gratis, en [nodejs.org](https://nodejs.org)). Para comprobar: abre una terminal y escribe `node --version`.
- Una carpeta donde guardar los archivos y conexión a internet.
- **Probado en Windows.** En macOS y Linux no lo hemos probado; el script no usa nada propio de Windows (NO VERIFICADO).

## Instalación y primera corrida
1. Baja el repositorio aiCrew (o solo esta carpeta, `tools/radar/`).
2. En esa carpeta, copia `config.ejemplo.json` con el nombre `config.json`.
   Windows (PowerShell o Símbolo del sistema): `copy config.ejemplo.json config.json`
   macOS / Linux: `cp config.ejemplo.json config.json`
3. Abre `config.json` con cualquier editor de texto y cámbialo por lo que buscas (siguiente sección). Los datos que trae son de ejemplo y ficticios.
4. En una terminal, dentro de la carpeta, escribe: `node radar.mjs`
5. Se crea `ofertas.md` en la misma carpeta. Ábrelo con cualquier editor o visor de markdown.

Si algo falla, mira [Si algo falla](#si-algo-falla).

## Cómo configurarlo (`config.json`)
Las claves que empiezan con `_` son comentarios: el radar las ignora. Las palabras van en minúsculas.

| Clave | Para qué sirve |
|---|---|
| `idioma` | `"es"` o `"en"`: idioma de `ofertas.md` y de los mensajes. |
| `salida` | Dónde se escribe el archivo del día (por defecto `ofertas.md`). |
| `dias` | Solo entran ofertas publicadas en los últimos N días. |
| `diasPendientes` | Una oferta sin marcar sale a los N días de su publicación. |
| `maxPorLinea` | Máximo de ofertas nuevas por línea y por día. |
| `lineas` | Tus tipos de trabajo. Cada una: `nombre`, `cv` (qué CV conviene mandar; solo se muestra), `incluir` (palabras que buscas), `excluir` (palabras que descartan) y, si quieres, `soloConExtras` (puestos que solo valen si la oferta menciona uno de tus extras). |
| `extras` | Señales que te favorecen (idiomas que hablas, una región). Suman puntos y marcan ⭐. |
| `geo` | `abiertas`: regiones donde puedes trabajar. `cerradas`: donde no (la oferta se descarta). Si no aparece ninguna, queda ❓. |
| `alertas` | Frases típicas de estafas: la oferta va a «Sospechosas». |
| `plataformasManuales` | Sitios sin API que quieres revisar tú: salen como lista de tareas al inicio. |
| `getonboardCategorias` | Categorías de Get on Board que se leen, cada una con la línea a la que pertenece. |
| `jobicyGeo` | Regiones que se piden a Jobicy. |
| `fuentesApagadas` | Fuentes que no se leen. |

Una oferta entra a una línea si alguna palabra de `incluir` está en el **título** (o en las etiquetas y la descripción a la vez) y ninguna de `excluir` está en el título. Empieza con pocas palabras, mira qué trae el primer día y ajusta.

## Cómo leer `ofertas.md`
- Arriba: lista de plataformas manuales y el resumen del día (nuevas, pendientes, las que salieron y cuántas se filtraron).
- Una sección por línea, con una tabla: marca (🆕 nueva hoy · ✅ región abierta · ❓ revisar región · ⭐ coincide con tus extras), puesto (con el link a la oferta original), empresa, región, fuente, fecha y **Estado**.
- **Estado** lo marcas tú (o El Avistador): vacío = sin revisar · ⏳ por leer · 📝 lista para enviar · 📤 enviada · ❌ descartada (con su razón). Al día siguiente salen las 📤 y las ❌, y no vuelven.
- Abajo: la sección «Sospechosas» (si hay) y el estado de cada fuente. Si una fuente falla, aparece ahí con el error.

## Programarlo para que corra cada día
Una pasada al día es lo correcto: más seguido no trae ofertas nuevas y puede hacer que una fuente te bloquee. Elige una hora en que el computador esté encendido.

### Windows: Programador de tareas
1. En la carpeta del radar crea un archivo `radar.cmd` con este contenido (no lleva rutas: se ubica solo):
   ```
   @echo off
   cd /d "%~dp0"
   node radar.mjs >> radar.log 2>&1
   ```
2. Abre el **Programador de tareas** (búscalo en el menú Inicio) y crea una tarea. En un Windows en español el asistente se llama «Crear tarea básica…», con una página de **Desencadenador** (elige «Diariamente» y la hora) y una de **Acción** («Iniciar un programa», y eliges `radar.cmd`). Los nombres pueden variar según tu versión de Windows (NO VERIFICADO en todas).
3. Alternativa por línea de comandos (sintaxis estándar de Windows; no la probamos): `schtasks /Create /SC DAILY /ST 07:30 /TN "Radar de ofertas" /TR "C:\carpeta\sin-espacios\radar.cmd"`. Cambia la carpeta por la tuya; si tiene espacios, usa el asistente.
4. Prueba la tarea una vez (en el Programador: clic derecho sobre la tarea → «Ejecutar») y revisa que `ofertas.md` se actualice.

### macOS y Linux: cron
Abre el editor de tareas con `crontab -e` y agrega una línea (ejemplo: todos los días a las 7:30):
```
30 7 * * * cd /ruta/a/tools/radar && /ruta/a/node radar.mjs >> radar.log 2>&1
```
Escribe `which node` en la terminal para saber la ruta de `node`: cron no siempre la encuentra solo. Cambia `/ruta/a/` por tus rutas. (cron no lo hemos probado con este script: NO VERIFICADO.)

## Fuentes y sus términos
El radar solo lee las **APIs o feeds públicos** de cada sitio, una vez al día, y deja el link a la oferta original. Cada fuente tiene sus reglas y pueden cambiar: **revísalas antes de usar o redistribuir el script**. Esto es lo que encontramos el 2026-10-29:

| Fuente | Por defecto | Qué piden |
|---|---|---|
| [Jobicy](https://jobicy.com/jobs-rss-feed) | Encendida | Citar a Jobicy como fuente, que los links lleven a la oferta original en Jobicy, y no más de una pasada automática por hora. |
| [Himalayas](https://himalayas.app/api) | Encendida | Usar el link de postulación sin cambiarlo y mostrar un link a Himalayas como fuente; no pasar las ofertas a otros portales ni agregadores. Límites publicados con clave gratis: 60 por minuto y 10.000 por día; el radar no usa clave. |
| [Remotive](https://github.com/remotive-com/remote-jobs-api) | Encendida | Enlazar a la oferta y nombrar a Remotive como fuente; no enviar sus ofertas a otros sitios; las ofertas llegan con 24 h de retraso; recomiendan como máximo 4 consultas al día. |
| [Get on Board](https://www.getonbrd.com/user-manual/get-on-board-s-api) | Encendida si pones categorías | API pública «abierta a cualquiera», con los mismos datos que se ven sin iniciar sesión. Su página no menciona límites ni atribución; la referencia técnica está en [api-doc.getonbrd.com](https://api-doc.getonbrd.com/?version=latest). |
| [Working Nomads](https://www.workingnomads.com/terms-and-conditions) | Encendida | Sus términos no mencionan la API, pero prohíben usar el servicio para construir un producto o servicio competidor: úsala solo para ti y con moderación, no para armar un portal de empleo. |
| [Remote OK](https://remoteok.com/api) | **Apagada** | Enlazar a la oferta (con *follow*) y nombrar a Remote OK; no usar su logo sin permiso. |
| [We Work Remotely](https://weworkremotely.com/api-terms-and-guidelines) | **Apagada** | No pudimos abrir su página de términos (error 403): NO VERIFICADO. Revísala tú; según lo que encontramos, piden citar la fuente y que se postule por su sitio. |

Por qué dos vienen apagadas: según nuestra revisión, cobran una membresía a quien postula. Compruébalo tú antes de encenderlas (quita sus nombres de `fuentesApagadas`).

En general: uso personal, una pasada al día, **se postula siempre en el link original** de cada oferta, y las ofertas no se republican en otro sitio. `ofertas.md` nombra las fuentes leídas ese día. Si una fuente cambia sus términos o su API, puede dejar de funcionar: aparecerá con error en la tabla de fuentes.

## Cómo se combina con El Avistador y La Estafeta
El radar trae las ofertas; los prompts las leen y trabajan con ellas. Están en este mismo repositorio:

- **El Avistador**: [`agents/es/avistador.md`](../../agents/es/avistador.md) (inglés: [`agents/en/avistador.md`](../../agents/en/avistador.md)). Lee `ofertas.md`, abre cada oferta candidata entera, descarta el humo, elige tu CV y deja la postulación lista. El clic de enviar es tuyo.
- **La Estafeta**: [`agents/es/estafeta.md`](../../agents/es/estafeta.md) (inglés: [`agents/en/estafeta.md`](../../agents/en/estafeta.md)). Lleva el registro de lo que enviaste, avisa los seguimientos y cuenta la semana.

Un flujo diario sencillo:
1. El radar corre solo (o con `node radar.mjs`) y actualiza `ofertas.md`.
2. Le pasas `ofertas.md` al Avistador. La primera vez te hará unas preguntas cortas para armar tu perfil de búsqueda; guárdalo en un archivo tuyo.
3. Tú envías las postulaciones y se las cuentas a La Estafeta, que las registra.
4. Marcas el Estado en `ofertas.md` (📤 o ❌). Si tu asistente puede editar archivos, puede marcarlo por ti; si no, hazlo a mano.

`textos.json` guarda el texto de cada oferta del día. Si una web no te deja abrir la oferta, puedes pegar ese texto al Avistador.

**Qué se probó:** los dos prompts se probaron con **Claude Code**. Con otros asistentes no los hemos probado: si usas otro, pega el contenido de `ofertas.md` en el chat.

## Tus datos
Todo queda en tu computador: `config.json`, `ofertas.md`, `vistos.json` (lo ya visto, se olvida a los 45 días) y `textos.json`. El radar solo se conecta a las fuentes de la tabla; no hay cuenta, ni rastreo, ni servidor nuestro. La carpeta trae un `.gitignore` para que esos archivos no se suban por error si guardas tu copia en un repositorio.

## Si algo falla
| Síntoma | Qué hacer |
|---|---|
| «Falta config.json» | Copia `config.ejemplo.json` como `config.json` (paso 2). |
| `node` no se reconoce como comando | Instala Node.js 18 o más nuevo y abre una terminal nueva. |
| Una fuente sale con ❌ en la tabla (por ejemplo `HTTP 403` o `HTTP 429`) | El sitio bloqueó o limitó la consulta. No repitas la corrida: espera al día siguiente. Si sigue, apaga esa fuente. |
| 0 ofertas nuevas | Pocas palabras en `incluir`, `dias` muy bajo o una región muy cerrada. Prueba `node radar.mjs --todas` (incluye las ya vistas). |
| Salen muchas ofertas que no te sirven | Agrega palabras a `excluir` y vuelve a correr. |
| Corriste el radar dos veces en el día | Está pensado así: lo visto hoy se repite, no queda el día en cero. |
| Borraste `ofertas.md` | Se pierden las pendientes y tus marcas de Estado; las ofertas cerradas siguen anotadas en `vistos.json`. |

## Licencia
**MIT** para los archivos de esta carpeta (`LICENSE`, copyright 2026 Hammock AI). El resto del repositorio tiene su propia licencia: mira el `LICENSE` de la raíz. Las ofertas que lee el script son de sus fuentes y siguen sus términos.

---
¿Necesitas un sitio o una automatización para tu negocio? → hammockai.site
