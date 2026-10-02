# 📜 Bitácora de la Crew

*[English](README.md)*

Los agentes de [`agents/`](../agents/) no salieron de la nada. Son el resultado de un año de trabajo y estudio que empezó en **octubre de 2025**: decenas de versiones, agentes que nacieron, se fusionaron, se pausaron o se retiraron, y tres modelos de IA distintos.

Esta bitácora guarda los **hitos** de ese camino. Se publican tal como eran en su momento, con sus aciertos y sus errores, porque a alguien le pueden servir y porque muestran cómo se llegó a lo que hay hoy.

> **Reglas de esta bitácora**
> - Cada prompt está en su **idioma original** y **sin cambios**, salvo lo que se indica en su ficha (✂️ Edición).
> - Se quitaron datos personales, de contacto y de clientes.
> - Las fechas son por mes o por período. Cuando no hay certeza, se indica.
> - Nada de métricas ni resultados que no estén en los propios archivos.

---

## 🗺️ El viaje por los modelos

| Período | Modelo principal | Qué pasó |
|---|---|---|
| **oct – dic 2025** | **Claude** | Nace la crew. Claude escribe los primeros agentes, define las primeras políticas y crea versiones para usarse en **ChatGPT** y en **Kimi**. |
| **dic 2025** | Claude → **Qwen** | Migración a Qwen. Los agentes nuevos se reescriben a partir de los prompts de Claude. |
| **2026** | **Qwen** | Fábrica de sitios, agentes en español, reglas para el agente de código. Pruebas con **DeepSeek** como modelo de razonamiento. |
| **2026** | Agentes de código | **Lingma / Qoder** (AGENTS.md hasta v3.1) y **Qwen Code con Qwen3.8-max** (AGENTS.md v4.0). |

---

## 🧭 Línea de tiempo

| Fecha | Hito | Modelo | Estado |
|---|---|---|---|
| oct – dic 2025 | [Contramaestre (primera versión)](prompts/2025-claude-contramaestre.md) | Claude | Evolucionó |
| oct – dic 2025 | [El Escribano](prompts/2025-claude-escribano.md) | Claude | Evolucionó |
| oct – dic 2025 | [Policy Guardian](prompts/2025-claude-policy-guardian.md) | Claude | Evolucionó |
| oct – dic 2025 | [Prompt Engineer (primera versión)](prompts/2025-claude-prompt-engineer.md) | Claude | Evolucionó |
| oct – dic 2025 | [Ruthless Efficiency](prompts/2025-claude-ruthless-efficiency.md) (valor) | Claude | Integrado |
| oct – dic 2025 | [The Artist](prompts/2025-claude-the-artist.md) | Claude | En pausa |
| oct – dic 2025 | [Contramaestre: ChatGPT Edition](prompts/2025-claude-contramaestre-chatgpt-edition.md) (extracto) | Claude → ChatGPT | Retirado |
| fines 2025 – inicios 2026 | [ContraMaestre 1.0](prompts/2025-claude-kimi-contramaestre.md) | Claude → Kimi | Retirado |
| fines 2025 – inicios 2026 | Contramaestre para el sitio de un proyecto jurídico *(prompt no conservado)* | Claude → Kimi | — |
| abr 2026 | [Senior Frontend Developer](prompts/2026-qwen-senior-frontend.md) | Qwen | Retirado |
| abr 2026 | [Cipher](prompts/2026-qwen-cipher.md) | Qwen | Retirado |
| abr 2026 | [AGENTS.md v2.0](prompts/2026-qwen-agents-protocol-v2.md) | Qwen → Lingma | Evolucionó |
| may 2026 | [El Escriba v1.1](prompts/2026-qwen-el-escriba.md) | Qwen | En pausa |
| jul – ago 2026 | [El Ingeniero 1.0 → 3.0](prompts/2026-qwen-el-ingeniero.md) | Qwen | Retirado |
| ago 2026 | [El Maestro](prompts/2026-qwen-el-maestro.md) | Qwen | En pausa |
| ago 2026 | [Ingeniero de Prompts Elite v1.1](prompts/2026-qwen-ingeniero-de-prompts-elite.md) | Qwen | Evolucionó |
| ago 2026 | [Communication Dojo Master](prompts/2026-qwen-communication-dojo-master.md) | Qwen | Integrado |
| oct 2026 | [Contramaestre, Prompt Engineer y Guardian v2.1](../agents/es/) | — | **Vigentes** |

**Sobre el proyecto jurídico:** se adaptó en Kimi un Contramaestre específico para desarrollar el sitio de dos abogados que preparaban un servicio judicial para municipios en Chile. Ese prompt no se conservó, así que no se publica.

---

## 🌳 Linajes

Cómo llegó cada agente vigente a su forma actual:

- **⚓ Contramaestre:** [Claude 2025](prompts/2025-claude-contramaestre.md) → [ChatGPT Edition](prompts/2025-claude-contramaestre-chatgpt-edition.md) → [Kimi 1.0](prompts/2025-claude-kimi-contramaestre.md) (fusionado con el Ingeniero) → [El Ingeniero / Contramaestre 3.0](prompts/2026-qwen-el-ingeniero.md) → separados, se retira el Ingeniero → [**v2.1**](../agents/es/contramaestre.md)
- **🗣️ Prompt Engineer:** [Claude 2025](prompts/2025-claude-prompt-engineer.md) → [Ingeniero de Prompts Elite 1.1](prompts/2026-qwen-ingeniero-de-prompts-elite.md) + [Communication Dojo Master](prompts/2026-qwen-communication-dojo-master.md) → [**v2.1**](../agents/es/prompt-engineer.md)
- **🪶 Guardian:** [Policy Guardian 2025](prompts/2025-claude-policy-guardian.md) → pilar "Guardian" en los [7 Pilares](pillars.es.md) → agente [**v2.1**](../agents/es/guardian.md)
- **📜 Escriba:** [El Escribano (imágenes, 2025)](prompts/2025-claude-escribano.md) → [El Escriba (audio, 2026)](prompts/2026-qwen-el-escriba.md)

---

## 🏛️ Los pilares también tienen historia
De 4 políticas a 7 pilares, y de vuelta a los 6 de hoy: **[Cómo nacieron los Seis Pilares](pillars.es.md)**.

---

[← Volver a AI Crew](../README.es.md)
