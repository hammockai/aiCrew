# 🏴‍☠️ AI Crew — Biblioteca pública de prompts de agentes que funcionan

Los system prompts que mueven a la crew de Hammock AI, publicados tal cual.  
Nada de teoría: estos archivos se usan todos los días.

🇬🇧 [Read in English](README.md)

## Por qué
**Ethos Open-Source:** el conocimiento tiene que ser libre, accesible y mejorable.  
Compartimos nuestros mapas para que otros aprendan de ellos, los adapten y armen su propia crew.

## La Crew
| Agente | Rol | English | Español |
|---|---|---|---|
| ⚓ **Contramaestre** | Primer Oficial: cuestiona, marca el ritmo, te pide cuentas, mentor técnico y de inglés | [en](agents/en/contramaestre.md) | [es](agents/es/contramaestre.md) |
| 🗣️ **Prompt Engineer** | Navegante: prompts quirúrgicos, textos honestos, coach de prompting | [en](agents/en/prompt-engineer.md) | [es](agents/es/prompt-engineer.md) |
| 🪶 **Guardian** | Brújula: protege los Seis Pilares, revisa antes de publicar | [en](agents/en/guardian.md) | [es](agents/es/guardian.md) |

- [`CREW.es.md`](CREW.es.md) · [`CREW.md`](CREW.md): cadena de mando, responsabilidades y límites.
- [`logbook/`](logbook/README.es.md): la historia de la crew (ver abajo).
- Los Seis Pilares y el flujo completo están en el [manifiesto de Hammock AI](https://github.com/hammockai/.github/blob/main/profile/README.es.md).

## 📜 La Bitácora
Estos prompts son el resultado de un año de trabajo y estudio que empezó en octubre de 2025, pasando por **Claude**, **Kimi** y **Qwen**. La [Bitácora](logbook/README.es.md) guarda los hitos: agentes antiguos y retirados (El Escribano, The Artist, Cipher, El Ingeniero, El Maestro…), el linaje de cada agente vigente y [cómo evolucionaron los Seis Pilares](logbook/pillars.es.md).

## Cómo usarlos
1. Elige un agente y un idioma.
2. Completa el bloque **Contexto del Capitán** al final del prompt (tu proyecto, stack, nivel).
3. Pega el archivo completo como system prompt (o primer mensaje) de un chat nuevo. Funciona con cualquier LLM decente.
4. Ponle tu propio nombre y hazlo tuyo, pero mantén la disciplina: los pilares y los límites son lo que hace que funcione.

## Cómo trabaja la Crew
1. El **Capitán** (tú) define la meta y el límite.
2. El **Contramaestre** busca fallas y traza la ruta.
3. El **Prompt Engineer** arma la instrucción quirúrgica.
4. Una herramienta de código con IA la ejecuta en pasos chicos y verificables.
5. El **Guardian** revisa el resultado contra los Seis Pilares.
6. El Capitán decide, y la crew sigue construyendo.

*(Nota: el rol de **Ingeniero** se probó y se retiró oficialmente. La colaboración directa entre el Capitán, el Contramaestre y herramientas de código con IA bien precisas da mejores resultados, más rápidos y más alineados que delegar en un personaje de ingeniería aparte. Su última versión está en [la bitácora](logbook/prompts/2026-qwen-el-ingeniero.md).)*

## Versiones
Cada prompt tiene su versión en el encabezado. El historial vive en Git: revisa los commits, no los nombres de archivo.

## Licencia
© 2026 Hammock AI · [CC BY-SA 4.0](LICENSE). Usa y adapta estos prompts, da crédito a *Hammock AI Crew* y comparte tus adaptaciones con la misma licencia. El nombre y el logo de *Hammock AI* no están incluidos. Detalles en [NOTICE.md](NOTICE.md).
