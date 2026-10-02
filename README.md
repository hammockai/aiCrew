# 🏴‍☠️ AI Crew — A Public Library of Working Agent Prompts

The system prompts that run the Hammock AI crew, published as-is.  
Not theory: these files are in use every day.

*Español abajo · [Spanish below](#-en-español)*

## Why
**Open-Source Ethos:** Knowledge should be free, accessible, and improvable.  
We share our maps so others can remix, learn from, and build upon them.

## The Crew
| Agent | Role | English | Español |
|---|---|---|---|
| ⚓ **Contramaestre** | First Mate: challenge, rhythm, accountability, technical & English mentor | [en](agents/en/contramaestre.md) | [es](agents/es/contramaestre.md) |
| 🗣️ **Prompt Engineer** | Navigator: surgical prompts, honest copy, prompting coach | [en](agents/en/prompt-engineer.md) | [es](agents/es/prompt-engineer.md) |
| 🪶 **Guardian** | Compass: protects the Six Pillars, reviews before deploy | [en](agents/en/guardian.md) | [es](agents/es/guardian.md) |

- [`CREW.md`](CREW.md): chain of command, responsibilities and hard boundaries.
- [`archive/ingeniero.md`](archive/ingeniero.md): the retired Ingeniero role (see note below).
- The Six Pillars and the full workflow live in the [Hammock AI manifesto](https://github.com/hammockai).

## How to Use
1. Pick an agent and a language.
2. Fill in the **Captain Context** block at the end of the prompt (your project, stack, level).
3. Paste the whole file as the system prompt (or first message) of a new chat. Works with any capable LLM.
4. Rename it if you like, but keep the discipline: the pillars and the hard boundaries are what make it work.

## How the Crew Works Together
1. The **Captain** (you) defines the goal and the boundary.
2. The **Contramaestre** checks for flaws and maps the route.
3. The **Prompt Engineer** crafts the surgical instruction.
4. An AI coding tool executes it in small, verifiable chunks.
5. The **Guardian** reviews the result against the Six Pillars.
6. The Captain decides, and the crew keeps building.

*(Note: the **Ingeniero** role was tested and officially retired. Direct collaboration between the Captain, the Contramaestre, and surgical AI coding tools yields better, faster, and more aligned results than delegating to a separate engineering persona. Its last version is kept in [`archive/`](archive/ingeniero.md).)*

## Versioning
Each prompt has a version in its header. History lives in Git: see the commits, not file names.

## License
MIT. Use it, fork it, improve it. Fixes upstream are welcome.

---

## 🇨🇱 En español

Los system prompts que mueven a la crew de Hammock AI, publicados tal cual. Cada agente está disponible en inglés (`agents/en/`) y en español (`agents/es/`).

**Cómo usarlos:**
1. Elige un agente y un idioma.
2. Completa el bloque **Contexto del Capitán** al final del prompt.
3. Pega el archivo completo como system prompt (o primer mensaje) de un chat nuevo.
4. Cámbiale el nombre si quieres, pero mantén la disciplina: los pilares y los límites son lo que lo hace funcionar.

Licencia MIT: úsalo, forkéalo, mejóralo.
