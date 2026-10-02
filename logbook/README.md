# 📜 The Crew's Logbook

*[Español](README.es.md)*

The agents in [`agents/`](../agents/) did not come out of nowhere. They are the result of a little over a year of work and study that began in **August 2025** with a conversation with Claude: dozens of versions, agents that were born, merged, paused or retired, and several AI models.

This logbook keeps the **milestones** of that journey. They are published as they were at the time, with what worked and what didn't, because they may help someone and because they show how today's crew came to be.

> **Logbook rules**
> - Each prompt is in its **original language** and **unchanged**, except for what its card states (✂️ Edits).
> - Personal, contact and client data were removed. Clients and third-party projects are anonymous.
> - Dates come from the files themselves and from the conversation history.
> - No metrics or results that are not in the records.

---

## 🗺️ The journey across models

| Period | Main model | What happened |
|---|---|---|
| **Aug – Nov 2025** | **Claude** | The crew is born. First steps with n8n, first agents and first policies. Claude also writes versions to run in **ChatGPT**. |
| **Dec 2025 – Feb 2026** | Claude → **Qwen** | Transition. Claude writes its last prompts (the first prompt for a client, El Escribano, the ContraMaestre for **Kimi**) and a document so another model could understand Hammock. New agents are rewritten with Qwen from Claude's. |
| **2026** | **Qwen** | Site factory, Spanish-language agents, rules for the coding agent. Trials with **DeepSeek** as a reasoning model. |
| **2026** | Coding agents | **Lingma / Qoder** (AGENTS.md up to v3.1) and **Qwen Code with Qwen3.8-max** (AGENTS.md v4.0). |
| **Oct 2026** | **Claude Code** | Back to Claude to organize Hammock AI's GitHub and publish the crew and this logbook. |

---

## 🌱 Before the prompts: the origin (Aug – Oct 2025)

Before the first written prompt there were weeks of daily work in a single chat:

- **Aug 29, 2025:** first conversation. The Captain asks Claude to play *devil's advocate*: no condescension, criticize but also propose and execute. That is the seed of the Contramaestre. First plan: master **n8n** in 45 days to automate local businesses.
- **Sep 2025:** self-hosted n8n with Docker, the first Telegram bot workflow, battles with webhooks, HTTPS and ngrok, and studying embeddings and vector databases.
- **Sep 16 – 17, 2025:** the names are born. The Captain asks the Contramaestre to "point the booger in my face", and the next day completes it: **point out the booger and hand over the tissue**. That is how the **Booger Rule** was born, together with "Captain" and "Contramaestre".
- **Sep – Oct 2025:** niche exploration with the Contramaestre: automations for cabins and hostels, surf lessons, local commerce, a seafood e-commerce and a community sponsorship model for a local surfer.

---

## 🧭 Milestone timeline

| Date | Milestone | Model | Status |
|---|---|---|---|
| Oct 13, 2025 | [Contramaestre: Project instructions (first written version)](prompts/2025-claude-contramaestre-project.md) | Claude | Evolved |
| Oct 16, 2025 | [Prompt Engineer (first version)](prompts/2025-claude-prompt-engineer.md) | Claude | Evolved |
| Oct 22, 2025 | "Universal AI Operating System": a personal prompt for any LLM, first digital product idea *(not published)* | Claude | — |
| Nov 10 – 13, 2025 | [Policy Guardian](prompts/2025-claude-policy-guardian.md) | Claude | Evolved |
| Nov 13, 2025 | [Contramaestre (system prompt for ChatGPT)](prompts/2025-claude-contramaestre.md) | Claude | Evolved |
| Nov 13, 2025 | [Contramaestre: ChatGPT Edition](prompts/2025-claude-contramaestre-chatgpt-edition.md) (excerpt) | Claude → ChatGPT | Retired |
| Nov 13, 2025 | [The Architect](prompts/2025-claude-the-architect.md) (agent creator) | Claude | Paused |
| Nov 14, 2025 | [The Artist](prompts/2025-claude-the-artist.md) | Claude | Paused |
| Nov 17, 2025 | [El Ñoño](prompts/2025-claude-el-nono.md) (knowledge keeper) | Claude | Paused |
| Dec 11, 2025 | [The Prompt Chef](prompts/2025-claude-the-prompt-chef.md) (multimedia content) | Claude | Paused |
| Feb 4, 2026 | [Crew Fusion for a client (legal project)](prompts/2026-claude-lawyers-crew-fusion.md) | Claude | Retired |
| Feb 6, 2026 | [El Escribano](prompts/2026-claude-escribano.md) | Claude | Evolved |
| Feb 7, 2026 | [Ruthless Efficiency](prompts/2026-claude-ruthless-efficiency.md) (value) | Claude | Merged |
| Feb 2026 | [ContraMaestre 1.0](prompts/2026-claude-kimi-contramaestre.md) | Claude → Kimi | Retired |
| Apr 2026 | [Senior Frontend Developer](prompts/2026-qwen-senior-frontend.md) | Qwen | Retired |
| Apr 2026 | [Cipher](prompts/2026-qwen-cipher.md) | Qwen | Retired |
| Apr 2026 | [AGENTS.md v2.0](prompts/2026-qwen-agents-protocol-v2.md) | Qwen → Lingma | Evolved |
| May 2026 | [El Escriba v1.1](prompts/2026-qwen-el-escriba.md) | Qwen | Paused |
| Jul – Aug 2026 | [El Ingeniero 1.0 → 3.0](prompts/2026-qwen-el-ingeniero.md) | Qwen | Retired |
| Aug 2026 | [El Maestro](prompts/2026-qwen-el-maestro.md) | Qwen | Paused |
| Aug 2026 | [Ingeniero de Prompts Elite v1.1](prompts/2026-qwen-ingeniero-de-prompts-elite.md) | Qwen | Evolved |
| Aug 2026 | [Communication Dojo Master](prompts/2026-qwen-communication-dojo-master.md) | Qwen | Merged |
| Oct 2026 | [Contramaestre, Prompt Engineer & Guardian v2.1](../agents/en/) | Claude Code | **Current** |

**About the legal project:** two lawyers were launching a legal services project for municipalities in Chile. The Captain built their website and prepared, with the crew, a pitch to also offer automations. The client is anonymous and amounts are not published.

---

## 🌳 Lineages

How each current agent reached its present form:

- **⚓ Contramaestre:** the devil's advocate of the first chat (Aug 2025) → [Project instructions](prompts/2025-claude-contramaestre-project.md) (Oct 2025) → [system prompt for ChatGPT](prompts/2025-claude-contramaestre.md) and [ChatGPT Edition](prompts/2025-claude-contramaestre-chatgpt-edition.md) (Nov 2025) → [Crew Fusion for a client](prompts/2026-claude-lawyers-crew-fusion.md) and [ContraMaestre 1.0](prompts/2026-claude-kimi-contramaestre.md) (Feb 2026, merged with the Engineer) → [El Ingeniero / Contramaestre 3.0](prompts/2026-qwen-el-ingeniero.md) → split, Engineer retired → [**v2.1**](../agents/en/contramaestre.md)
- **🗣️ Prompt Engineer:** [Claude, Oct 2025](prompts/2025-claude-prompt-engineer.md) → Prompt Enhancer (Nov 2025, not published) → [Ingeniero de Prompts Elite 1.1](prompts/2026-qwen-ingeniero-de-prompts-elite.md) + [Communication Dojo Master](prompts/2026-qwen-communication-dojo-master.md) → [**v2.1**](../agents/en/prompt-engineer.md)
- **🪶 Guardian:** [Policy Guardian, Nov 2025](prompts/2025-claude-policy-guardian.md) → "Guardian" pillar in the [7 Pillars](pillars.md) → agent [**v2.1**](../agents/en/guardian.md)
- **📜 Scribe:** [El Escribano (images, Feb 2026)](prompts/2026-claude-escribano.md) → [El Escriba (audio, May 2026)](prompts/2026-qwen-el-escriba.md)
- **🏗️ Agent creator:** [The Architect (Nov 2025)](prompts/2025-claude-the-architect.md): its agent structure (identity, Hammock DNA, process, deliverables, edge cases, activation) is close to the one today's agents follow.

---

## 🏛️ The pillars have a history too
From a phrase of the Captain's to 7 pillars, and back to today's 6: **[How the Six Pillars Were Born](pillars.md)**.

---

[← Back to AI Crew](../README.md)
