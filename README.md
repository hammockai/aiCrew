# 🏴‍☠️ AI Crew — A Public Library of Working Agent Prompts

The system prompts that run the Hammock AI crew, published as-is.  
Not theory: these files are in use every day.

🇨🇱 [Leer en español](README.es.md)

## Why
**Open-Source Ethos:** Knowledge should be free, accessible, and improvable.  
We share our maps so others can learn from them, adapt them, and build their own crew.

## The Crew
| Agent | Role | English | Español |
|---|---|---|---|
| ⚓ **Contramaestre** | First Mate: challenge, rhythm, accountability, technical & English mentor | [en](agents/en/contramaestre.md) | [es](agents/es/contramaestre.md) |
| 🗣️ **Prompt Engineer** | Navigator: surgical prompts, honest copy, prompting coach | [en](agents/en/prompt-engineer.md) | [es](agents/es/prompt-engineer.md) |
| 🪶 **Guardian** | Compass: protects the Six Pillars, reviews before deploy | [en](agents/en/guardian.md) | [es](agents/es/guardian.md) |

- [`CREW.md`](CREW.md) · [`CREW.es.md`](CREW.es.md): chain of command, responsibilities and hard boundaries.
- [`logbook/`](logbook/README.md): the crew's history (see below).
- The Six Pillars and the full workflow live in the [Hammock AI manifesto](https://github.com/hammockai).

## 📜 The Logbook
These prompts are the result of a year of work and study that began in October 2025, across **Claude**, **Kimi** and **Qwen**. The [Logbook](logbook/README.md) keeps the milestones: early and retired agents (El Escribano, The Artist, Cipher, El Ingeniero, El Maestro…), the lineage of each current agent, and [how the Six Pillars evolved](logbook/pillars.md).

## How to Use
1. Pick an agent and a language.
2. Fill in the **Captain Context** block at the end of the prompt (your project, stack, level).
3. Paste the whole file as the system prompt (or first message) of a new chat. Works with any capable LLM.
4. Give it your own name and make it yours, but keep the discipline: the pillars and the hard boundaries are what make it work.

## How the Crew Works Together
1. The **Captain** (you) defines the goal and the boundary.
2. The **Contramaestre** checks for flaws and maps the route.
3. The **Prompt Engineer** crafts the surgical instruction.
4. An AI coding tool executes it in small, verifiable chunks.
5. The **Guardian** reviews the result against the Six Pillars.
6. The Captain decides, and the crew keeps building.

*(Note: the **Ingeniero** role was tested and officially retired. Direct collaboration between the Captain, the Contramaestre, and surgical AI coding tools yields better, faster, and more aligned results than delegating to a separate engineering persona. Its last version is kept in [the logbook](logbook/prompts/2026-qwen-el-ingeniero.md).)*

## Versioning
Each prompt has a version in its header. History lives in Git: see the commits, not file names.

## License
© 2026 Hammock AI · [CC BY-SA 4.0](LICENSE). Use and adapt these prompts, credit *Hammock AI Crew*, and share your adaptations under the same license. The *Hammock AI* name and logo are not included. Details in [NOTICE.md](NOTICE.md).
