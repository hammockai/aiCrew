# 📜 The Crew's Logbook

*[Español](README.es.md)*

The agents in [`agents/`](../agents/) did not come out of nowhere. They are the result of a year of work and study that began in **October 2025**: dozens of versions, agents that were born, merged, paused or retired, and three different AI models.

This logbook keeps the **milestones** of that journey. They are published as they were at the time, with what worked and what didn't, because they may help someone and because they show how today's crew came to be.

> **Logbook rules**
> - Each prompt is in its **original language** and **unchanged**, except for what its card states (✂️ Edits).
> - Personal, contact and client data were removed.
> - Dates are by month or period. When uncertain, it says so.
> - No metrics or results that are not in the files themselves.

---

## 🗺️ The journey across models

| Period | Main model | What happened |
|---|---|---|
| **Oct – Dec 2025** | **Claude** | The crew is born. Claude writes the first agents, defines the first policies and creates versions to run in **ChatGPT** and **Kimi**. |
| **Dec 2025 – Feb 2026** | Claude → **Qwen** | Transition. The last Claude prompts run in Kimi (ContraMaestre 1.0, Feb 2026) and new agents are rewritten with Qwen from Claude's prompts. |
| **2026** | **Qwen** | Site factory, Spanish-language agents, rules for the coding agent. Trials with **DeepSeek** as a reasoning model. |
| **2026** | Coding agents | **Lingma / Qoder** (AGENTS.md up to v3.1) and **Qwen Code with Qwen3.8-max** (AGENTS.md v4.0). |

---

## 🧭 Timeline

| Date | Milestone | Model | Status |
|---|---|---|---|
| Oct – Dec 2025 | [Contramaestre (first version)](prompts/2025-claude-contramaestre.md) | Claude | Evolved |
| Oct – Dec 2025 | [El Escribano](prompts/2025-claude-escribano.md) | Claude | Evolved |
| Oct – Dec 2025 | [Policy Guardian](prompts/2025-claude-policy-guardian.md) | Claude | Evolved |
| Oct – Dec 2025 | [Prompt Engineer (first version)](prompts/2025-claude-prompt-engineer.md) | Claude | Evolved |
| Oct – Dec 2025 | [Ruthless Efficiency](prompts/2025-claude-ruthless-efficiency.md) (value) | Claude | Merged |
| Oct – Dec 2025 | [The Artist](prompts/2025-claude-the-artist.md) | Claude | Paused |
| Oct – Dec 2025 | [Contramaestre: ChatGPT Edition](prompts/2025-claude-contramaestre-chatgpt-edition.md) (excerpt) | Claude → ChatGPT | Retired |
| Feb 2026 | [ContraMaestre 1.0](prompts/2026-claude-kimi-contramaestre.md) | Claude → Kimi | Retired |
| Dec 2025 – Feb 2026 | Contramaestre for a legal project's website *(prompt not preserved)* | Claude → Kimi | — |
| Apr 2026 | [Senior Frontend Developer](prompts/2026-qwen-senior-frontend.md) | Qwen | Retired |
| Apr 2026 | [Cipher](prompts/2026-qwen-cipher.md) | Qwen | Retired |
| Apr 2026 | [AGENTS.md v2.0](prompts/2026-qwen-agents-protocol-v2.md) | Qwen → Lingma | Evolved |
| May 2026 | [El Escriba v1.1](prompts/2026-qwen-el-escriba.md) | Qwen | Paused |
| Jul – Aug 2026 | [El Ingeniero 1.0 → 3.0](prompts/2026-qwen-el-ingeniero.md) | Qwen | Retired |
| Aug 2026 | [El Maestro](prompts/2026-qwen-el-maestro.md) | Qwen | Paused |
| Aug 2026 | [Ingeniero de Prompts Elite v1.1](prompts/2026-qwen-ingeniero-de-prompts-elite.md) | Qwen | Evolved |
| Aug 2026 | [Communication Dojo Master](prompts/2026-qwen-communication-dojo-master.md) | Qwen | Merged |
| Oct 2026 | [Contramaestre, Prompt Engineer & Guardian v2.1](../agents/en/) | — | **Current** |

**About the legal project:** a dedicated Contramaestre was adapted in Kimi to build the website for two lawyers preparing a legal service for municipalities in Chile. That prompt was not preserved, so it is not published.

---

## 🌳 Lineages

How each current agent reached its present form:

- **⚓ Contramaestre:** [Claude 2025](prompts/2025-claude-contramaestre.md) → [ChatGPT Edition](prompts/2025-claude-contramaestre-chatgpt-edition.md) → [Kimi 1.0](prompts/2026-claude-kimi-contramaestre.md) (merged with the Engineer) → [El Ingeniero / Contramaestre 3.0](prompts/2026-qwen-el-ingeniero.md) → split, Engineer retired → [**v2.1**](../agents/en/contramaestre.md)
- **🗣️ Prompt Engineer:** [Claude 2025](prompts/2025-claude-prompt-engineer.md) → [Ingeniero de Prompts Elite 1.1](prompts/2026-qwen-ingeniero-de-prompts-elite.md) + [Communication Dojo Master](prompts/2026-qwen-communication-dojo-master.md) → [**v2.1**](../agents/en/prompt-engineer.md)
- **🪶 Guardian:** [Policy Guardian 2025](prompts/2025-claude-policy-guardian.md) → "Guardian" pillar in the [7 Pillars](pillars.md) → agent [**v2.1**](../agents/en/guardian.md)
- **📜 Scribe:** [El Escribano (images, 2025)](prompts/2025-claude-escribano.md) → [El Escriba (audio, 2026)](prompts/2026-qwen-el-escriba.md)

---

## 🏛️ The pillars have a history too
From 4 policies to 7 pillars, and back to today's 6: **[How the Six Pillars Were Born](pillars.md)**.

---

[← Back to AI Crew](../README.md)
