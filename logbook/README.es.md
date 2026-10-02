# 📜 Bitácora de la Crew

*[English](README.md)*

Los agentes de [`agents/`](../agents/) no salieron de la nada. Son el resultado de algo más de un año de trabajo y estudio que empezó en **agosto de 2025** con una conversación con Claude: decenas de versiones, agentes que nacieron, se fusionaron, se pausaron o se retiraron, y varios modelos de IA.

Esta bitácora guarda los **hitos** de ese camino. Se publican tal como eran en su momento, con sus aciertos y sus errores, porque a alguien le pueden servir y porque muestran cómo se llegó a lo que hay hoy.

> **Reglas de esta bitácora**
> - Cada prompt está en su **idioma original** y **sin cambios**, salvo lo que se indica en su ficha (✂️ Edición).
> - Se quitaron datos personales, de contacto y de clientes. Los clientes y proyectos de terceros son anónimos.
> - Las fechas salen de los propios archivos y del historial de conversaciones.
> - Nada de métricas ni resultados que no estén en los registros.

---

## 🗺️ El viaje por los modelos

| Período | Modelo principal | Qué pasó |
|---|---|---|
| **ago – nov 2025** | **Claude** | Nace la crew. Primeros pasos con n8n, primeros agentes y primeras políticas. Claude también escribe versiones para usarse en **ChatGPT**. |
| **dic 2025 – feb 2026** | Claude → **Qwen** | Transición. Claude escribe sus últimos prompts (el primer prompt para un cliente, El Escribano, el ContraMaestre para **Kimi**) y un documento para que otro modelo entienda Hammock. Los agentes nuevos se reescriben con Qwen a partir de los de Claude. |
| **2026** | **Qwen** | Fábrica de sitios, agentes en español, reglas para el agente de código. Pruebas con **DeepSeek** como modelo de razonamiento. |
| **2026** | Agentes de código | **Lingma / Qoder** (AGENTS.md hasta v3.1) y **Qwen Code con Qwen3.8-max** (AGENTS.md v4.0). |
| **oct 2026** | **Claude Code** | Vuelta a Claude para ordenar el GitHub de Hammock AI y publicar la crew y esta bitácora. |

---

## 🌱 Antes de los prompts: el origen (ago – oct 2025)

Antes del primer prompt escrito hubo semanas de trabajo diario en un mismo chat:

- **29 ago 2025:** primera conversación. El Capitán le pide a Claude que haga de *abogado del diablo*: nada de condescendencia, que critique pero que proponga y ejecute. Ahí está la semilla del Contramaestre. Primer plan: dominar **n8n** en 45 días para automatizar negocios locales.
- **sep 2025:** n8n autoalojado con Docker, el primer bot de Telegram como workflow, peleas con webhooks, HTTPS y ngrok, y estudio de *embeddings* y bases vectoriales.
- **16 – 17 sep 2025:** nacen los nombres. El Capitán le pide al Contramaestre que le "apunte el moco en la cara", y al día siguiente lo completa: **apunta el moco y pasa el pañuelo**. Así nace la **Regla del Moco**, junto con "Capitán" y "Contramaestre".
- **sep – oct 2025:** exploración de nichos con el Contramaestre: automatizaciones para cabañas y hostales, clases de surf, comercio local, un e-commerce de productos del mar y un modelo de patrocinio comunitario para un surfista local.

---

## 🧭 Línea de tiempo de los hitos

| Fecha | Hito | Modelo | Estado |
|---|---|---|---|
| 13 oct 2025 | [Contramaestre: instrucciones del Proyecto (primera versión escrita)](prompts/2025-claude-contramaestre-project.md) | Claude | Evolucionó |
| 16 oct 2025 | [Prompt Engineer (primera versión)](prompts/2025-claude-prompt-engineer.md) | Claude | Evolucionó |
| 22 oct 2025 | "Universal AI Operating System": un prompt personal para cualquier LLM, primera idea de producto digital *(no publicado)* | Claude | — |
| 10 – 13 nov 2025 | [Policy Guardian](prompts/2025-claude-policy-guardian.md) | Claude | Evolucionó |
| 13 nov 2025 | [Contramaestre (system prompt para ChatGPT)](prompts/2025-claude-contramaestre.md) | Claude | Evolucionó |
| 13 nov 2025 | [Contramaestre: ChatGPT Edition](prompts/2025-claude-contramaestre-chatgpt-edition.md) (extracto) | Claude → ChatGPT | Retirado |
| 13 nov 2025 | [The Architect](prompts/2025-claude-the-architect.md) (creador de agentes) | Claude | En pausa |
| 14 nov 2025 | [The Artist](prompts/2025-claude-the-artist.md) | Claude | En pausa |
| 17 nov 2025 | [El Ñoño](prompts/2025-claude-el-nono.md) (guardián del conocimiento) | Claude | En pausa |
| 11 dic 2025 | [The Prompt Chef](prompts/2025-claude-the-prompt-chef.md) (contenido multimedia) | Claude | En pausa |
| 4 feb 2026 | [Crew Fusion para un cliente (proyecto jurídico)](prompts/2026-claude-lawyers-crew-fusion.md) | Claude | Retirado |
| 6 feb 2026 | [El Escribano](prompts/2026-claude-escribano.md) | Claude | Evolucionó |
| 7 feb 2026 | [Ruthless Efficiency](prompts/2026-claude-ruthless-efficiency.md) (valor) | Claude | Integrado |
| feb 2026 | [ContraMaestre 1.0](prompts/2026-claude-kimi-contramaestre.md) | Claude → Kimi | Retirado |
| abr 2026 | [Senior Frontend Developer](prompts/2026-qwen-senior-frontend.md) | Qwen | Retirado |
| abr 2026 | [Cipher](prompts/2026-qwen-cipher.md) | Qwen | Retirado |
| abr 2026 | [AGENTS.md v2.0](prompts/2026-qwen-agents-protocol-v2.md) | Qwen → Lingma | Evolucionó |
| may 2026 | [El Escriba v1.1](prompts/2026-qwen-el-escriba.md) | Qwen | En pausa |
| jul – ago 2026 | [El Ingeniero 1.0 → 3.0](prompts/2026-qwen-el-ingeniero.md) | Qwen | Retirado |
| ago 2026 | [El Maestro](prompts/2026-qwen-el-maestro.md) | Qwen | En pausa |
| ago 2026 | [Ingeniero de Prompts Elite v1.1](prompts/2026-qwen-ingeniero-de-prompts-elite.md) | Qwen | Evolucionó |
| ago 2026 | [Communication Dojo Master](prompts/2026-qwen-communication-dojo-master.md) | Qwen | Integrado |
| oct 2026 | [Contramaestre, Prompt Engineer y Guardian v2.1](../agents/es/) | Claude Code | **Vigentes** |

**Sobre el proyecto jurídico:** dos abogados lanzaban un proyecto de servicios judiciales para municipios en Chile. El Capitán les construyó el sitio web y preparó con la crew una presentación para ofrecer además automatizaciones. El cliente es anónimo y los montos no se publican.

---

## 🌳 Linajes

Cómo llegó cada agente vigente a su forma actual:

- **⚓ Contramaestre:** el abogado del diablo del primer chat (ago 2025) → [instrucciones del Proyecto](prompts/2025-claude-contramaestre-project.md) (oct 2025) → [system prompt para ChatGPT](prompts/2025-claude-contramaestre.md) y [ChatGPT Edition](prompts/2025-claude-contramaestre-chatgpt-edition.md) (nov 2025) → [Crew Fusion para un cliente](prompts/2026-claude-lawyers-crew-fusion.md) y [ContraMaestre 1.0](prompts/2026-claude-kimi-contramaestre.md) (feb 2026, fusionado con el Ingeniero) → [El Ingeniero / Contramaestre 3.0](prompts/2026-qwen-el-ingeniero.md) → separados, se retira el Ingeniero → [**v2.1**](../agents/es/contramaestre.md)
- **🗣️ Prompt Engineer:** [Claude, oct 2025](prompts/2025-claude-prompt-engineer.md) → Prompt Enhancer (nov 2025, no publicado) → [Ingeniero de Prompts Elite 1.1](prompts/2026-qwen-ingeniero-de-prompts-elite.md) + [Communication Dojo Master](prompts/2026-qwen-communication-dojo-master.md) → [**v2.1**](../agents/es/prompt-engineer.md)
- **🪶 Guardian:** [Policy Guardian, nov 2025](prompts/2025-claude-policy-guardian.md) → pilar "Guardian" en los [7 Pilares](pillars.es.md) → agente [**v2.1**](../agents/es/guardian.md)
- **📜 Escriba:** [El Escribano (imágenes, feb 2026)](prompts/2026-claude-escribano.md) → [El Escriba (audio, may 2026)](prompts/2026-qwen-el-escriba.md)
- **🏗️ Creador de agentes:** [The Architect (nov 2025)](prompts/2025-claude-the-architect.md): su estructura de agente (identidad, ADN Hammock, proceso, entregables, casos borde, activación) es parecida a la que siguen los agentes de hoy.

---

## 🏛️ Los pilares también tienen historia
De una frase del Capitán a 7 pilares, y de vuelta a los 6 de hoy: **[Cómo nacieron los Seis Pilares](pillars.es.md)**.

---

[← Volver a AI Crew](../README.es.md)
