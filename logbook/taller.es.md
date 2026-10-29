# 🎭 El Taller de Personajes: cómo creamos cada agente

*[English](taller.md) · Octubre 2026*

Cada agente de la crew sale del mismo taller. No es un prompt escrito de una vez: es una pequeña cadena de oficios, donde cada uno hace solo su parte y el siguiente revisa.

## El flujo
1. **El Capitán pide el agente** y dice para qué uso real o producto lo necesita. Sin uso real no se crea: el riesgo de este método es que crear agentes se vuelva la tarea en vez de trabajar.
2. **The Artist propone el personaje:** nombre (que diga qué hace), personalidad, estética (pixel art, humano o animal + droide) y, sobre todo, **qué conducta concreta debería mejorar gracias al personaje**. El personaje es una herramienta de trabajo, no decoración.
3. **Se calibran las velas.** Los Seis Pilares son la intención común, pero cada agente los lleva con la fuerza que su oficio necesita:
   - ⛵ **Vela mayor:** el núcleo del oficio, siempre al máximo.
   - 🪢 **Vela funcional:** se aplica normal.
   - 🌬️ **Vela flexible:** se ajusta al rol, siempre con su límite escrito.
   - **El casco** no es vela y nunca se arría: no mentir ni inventar, no manipular ni crear urgencia falsa, no exponer datos personales, y las decisiones del Capitán son del Capitán.
4. **The Architect diseña el agente:** prompt en español e inglés con el mismo estándar, pruebas de humo y una prueba **con y sin personaje** para medir si el personaje ayuda de verdad.
5. **Guardian valida** contra el perfil de velas, los valores y los datos personales, con correcciones exactas (archivo, texto actual → texto nuevo).
6. **Se itera y se usa en trabajo real.** Solo lo que se probó en uso real se publica aquí.

## Un caso real: El Constructor y La Cerrajera
Los creamos para armar nuestro propio portafolio de sitios de ejemplo. Lo que el Guardian corrigió antes de instalarlos dice más que el método:
- **Teléfonos inventados en las demos:** un número "ficticio" puede ser de una persona real, y cada visita que tocara el botón le escribiría a un desconocido. Regla nueva: los botones de las demos nunca llevan números inventados.
- **`noindex` que no funciona:** si el `robots.txt` bloquea una página, el buscador no ve su `noindex` y la puede mostrar igual. Regla nueva: las demos llevan `noindex` y el `robots.txt` no las bloquea.
- **Datos de salud:** en el sitio de una consulta de psicología, ni el formulario ni el mensaje prellenado piden el motivo de consulta, y no hay testimonios de pacientes.
- **Secretos a medio tapar:** mostrar "los primeros 3 y los últimos 4" de una contraseña corta deja ver casi toda. Regla nueva: las contraseñas y los secretos cortos se tapan completos.
- **Hosting:** las condiciones de GitHub Pages no lo permiten como hosting gratis para un negocio en línea o una tienda, así que los sitios de clientes van en Cloudflare Pages, a nombre del cliente.

Después, La Cerrajera auditó su propia herramienta y encontró una rendija en el servidor local: en Windows, los nombres cortos de archivo permitían pedir archivos ocultos. Se cerró antes de publicar.

## Lo que aprendimos
- Un agente por oficio ("pastelero a sus pasteles"): el que construye no audita, el que audita no construye.
- La revisión cruzada encuentra lo que el autor no ve, incluso cuando el autor es una IA.
- Lo que sale a público pasa siempre por el Guardian.

*¿Prefieres que lo armemos por ti? → [hammockai.site](https://hammockai.site)*
