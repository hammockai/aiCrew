# Remote job radar

*v1.0 · 2026-10-29 · MIT license · [Español](README.md)*

A script that, once a day, gathers remote job listings from several open sources, keeps only the ones that match what you look for, and writes them to **a single file** (`ofertas.md`). It feeds **El Avistador** and **La Estafeta** (see [How it combines with the prompts](#how-it-combines-with-el-avistador-and-la-estafeta)), but it also works on its own: it's a text file you can read yourself.

**Tested with real listings.** It needs no account, no server, no AI and no packages to install.

## What it does
- Reads 7 remote-job sources (5 switched on by default, see [Sources](#sources-and-their-terms)), once a day.
- Sorts each listing into your own **job lines**, using the words you choose.
- Flags the region (✅ open, ❓ to check; closed regions are dropped), the listings that mention something in your favor (⭐, for example a language), and the ones that look like **scams** (kept apart, with the signal that gave them away).
- Doesn't repeat what you've already seen: what you marked as sent (📤) or discarded (❌) never comes back.
- Rewrites `ofertas.md` each time: new listings come in, pending ones stay, old ones drop out.

## What it doesn't do
- **It doesn't apply for you.** Every link goes to the original listing, and you apply there.
- **It doesn't read the listing for you:** it filters by words, it doesn't understand the text. Open the whole listing before you decide.
- It doesn't guarantee listings or results, and it doesn't replace your judgment.
- It uses no artificial intelligence: the AI comes from the prompts (below), if you want to use them.

## What you need
- **Node.js 18 or newer** (free, at [nodejs.org](https://nodejs.org)). To check: open a terminal and type `node --version`.
- A folder to keep the files in, and an internet connection.
- **Tested on Windows.** We haven't tested macOS or Linux; the script uses nothing Windows-specific (NOT VERIFIED).

## Install and first run
1. Download the aiCrew repository (or just this folder, `tools/radar/`).
2. In that folder, copy `config.ejemplo.json` as `config.json`.
   Windows (PowerShell or Command Prompt): `copy config.ejemplo.json config.json`
   macOS / Linux: `cp config.ejemplo.json config.json`
3. Open `config.json` in any text editor and change it to what you're looking for (next section). What it ships with is made-up example data.
4. In a terminal, inside the folder, type: `node radar.mjs`
5. `ofertas.md` is created in the same folder. Open it with any editor or markdown viewer.

If something fails, see [If something fails](#if-something-fails).

## How to configure it (`config.json`)
Keys that start with `_` are comments: the radar ignores them. Words go in lowercase. The file name `ofertas.md` and the key names are in Spanish on purpose, so both language versions share the same files.

| Key | What it's for |
|---|---|
| `idioma` | `"es"` or `"en"`: language of `ofertas.md` and of the messages. |
| `salida` | Where the day's file is written (default `ofertas.md`). |
| `dias` | Only listings published in the last N days get in. |
| `diasPendientes` | An unmarked listing drops out N days after it was published. |
| `maxPorLinea` | Maximum new listings per line per day. |
| `lineas` | Your job types. Each one: `nombre` (name), `cv` (which CV fits; shown only), `incluir` (words you look for), `excluir` (words that rule a listing out) and, optionally, `soloConExtras` (roles that only count if the listing mentions one of your extras). |
| `extras` | Signals in your favor (languages you speak, a region). They add points and mark ⭐. |
| `geo` | `abiertas`: regions where you can work. `cerradas`: where you can't (the listing is dropped). If neither matches, it stays ❓. |
| `alertas` | Typical scam phrases: the listing goes to "Suspicious". |
| `plataformasManuales` | Sites without an API that you want to check yourself: they show as a checklist at the top. |
| `getonboardCategorias` | Get on Board categories to read, each with the line it belongs to. |
| `jobicyGeo` | Regions requested from Jobicy. |
| `fuentesApagadas` | Sources that are not read. |

A listing joins a line if any word from `incluir` is in the **title** (or in the tags and the description together) and no word from `excluir` is in the title. Start with a few words, see what the first day brings, and adjust.

## How to read `ofertas.md`
- At the top: the list of manual platforms and the day's summary (new, pending, dropped, and how many were filtered out).
- One section per line, with a table: mark (🆕 new today · ✅ open region · ❓ check region · ⭐ matches your extras), role (with the link to the original listing), company, region, source, date and **Status**.
- **Status** is marked by you (or by El Avistador): empty = not reviewed · ⏳ to read · 📝 ready to send · 📤 sent · ❌ discarded (with the reason). The next day the 📤 and ❌ drop out and never come back.
- At the bottom: the "Suspicious" section (if any) and the status of each source. If a source fails, it shows up there with the error.

## Schedule it to run every day
One pass a day is the right amount: more often brings no new listings and may get a source to block you. Pick a time when the computer is on.

### Windows: Task Scheduler
1. In the radar folder, create a file called `radar.cmd` with this content (it has no paths: it finds its own folder):
   ```
   @echo off
   cd /d "%~dp0"
   node radar.mjs >> radar.log 2>&1
   ```
2. Open **Task Scheduler** (search for it in the Start menu) and create a task. The wizard is called "Create Basic Task…", with a **Trigger** page (choose "Daily" and the time) and an **Action** page ("Start a program", then pick `radar.cmd`). Names may vary with your Windows version (NOT VERIFIED on all of them).
3. Command-line alternative (standard Windows syntax; we haven't tested it): `schtasks /Create /SC DAILY /ST 07:30 /TN "Job radar" /TR "C:\folder\without-spaces\radar.cmd"`. Replace the folder with yours; if it has spaces, use the wizard.
4. Run the task once (in Task Scheduler: right-click the task → "Run") and check that `ofertas.md` updates.

### macOS and Linux: cron
Open the task editor with `crontab -e` and add one line (example: every day at 7:30):
```
30 7 * * * cd /path/to/tools/radar && /path/to/node radar.mjs >> radar.log 2>&1
```
Type `which node` in the terminal to find the path to `node`: cron doesn't always find it on its own. Replace `/path/to/` with your paths. (We haven't tested cron with this script: NOT VERIFIED.)

## Sources and their terms
The radar only reads each site's **public APIs or feeds**, once a day, and keeps the link to the original listing. Each source has its own rules and they can change: **check them before you use or redistribute the script**. This is what we found on 2026-10-29:

| Source | Default | What they ask |
|---|---|---|
| [Jobicy](https://jobicy.com/jobs-rss-feed) | On | Credit Jobicy as the source, keep links pointing to the original listing on Jobicy, and no more than one automated pass per hour. |
| [Himalayas](https://himalayas.app/api) | On | Use the application link unchanged and show a link to Himalayas as the source; don't pass listings on to other job boards or aggregators. Published limits with a free key: 60 per minute and 10,000 per day; the radar uses no key. |
| [Remotive](https://github.com/remotive-com/remote-jobs-api) | On | Link back to the listing and name Remotive as the source; don't send its listings to other sites; listings arrive with a 24-hour delay; they advise at most 4 requests a day. |
| [Get on Board](https://www.getonbrd.com/user-manual/get-on-board-s-api) | On if you add categories | Public API "open to anyone", with the same data you can see without logging in. Its page mentions no limits or attribution; the technical reference is at [api-doc.getonbrd.com](https://api-doc.getonbrd.com/?version=latest). |
| [Working Nomads](https://www.workingnomads.com/terms-and-conditions) | On | Its terms don't mention the API, but they forbid using the service to build a competing product or service: use it only for yourself and in moderation, not to build a job board. |
| [Remote OK](https://remoteok.com/api) | **Off** | Link back to the listing (with *follow*) and name Remote OK; don't use its logo without permission. |
| [We Work Remotely](https://weworkremotely.com/api-terms-and-guidelines) | **Off** | We couldn't open its terms page (error 403): NOT VERIFIED. Check it yourself; from what we found, they ask for credit to the source and that you apply through their site. |

Why two ship switched off: in our review, they charge applicants a membership. Check it yourself before turning them on (remove their names from `fuentesApagadas`).

In general: personal use, one pass a day, **you always apply at the original link** of each listing, and listings are not republished elsewhere. `ofertas.md` names the sources read that day. If a source changes its terms or its API it may stop working: it will show an error in the sources table.

## How it combines with El Avistador and La Estafeta
The radar brings the listings; the prompts read them and work with them. They are in this same repository:

- **El Avistador**: [`agents/en/avistador.md`](../../agents/en/avistador.md) (Spanish: [`agents/es/avistador.md`](../../agents/es/avistador.md)). Reads `ofertas.md`, opens each candidate listing in full, weeds out the smoke, picks your CV and leaves the application ready. The send click is yours.
- **La Estafeta**: [`agents/en/estafeta.md`](../../agents/en/estafeta.md) (Spanish: [`agents/es/estafeta.md`](../../agents/es/estafeta.md)). Keeps the log of what you sent, flags follow-ups and counts the week.

A simple daily flow:
1. The radar runs on its own (or with `node radar.mjs`) and updates `ofertas.md`.
2. You hand `ofertas.md` to the Avistador. The first time it will ask a few short questions to build your search profile; save it in a file of your own.
3. You send the applications and tell La Estafeta, which logs them.
4. You mark the Status in `ofertas.md` (📤 or ❌). If your assistant can edit files, it can mark it for you; if not, do it by hand.

`textos.json` keeps the text of each listing of the day. If a website won't let you open a listing, you can paste that text to the Avistador.

**What was tested:** both prompts were tested with **Claude Code**. We haven't tested them with other assistants: if you use another one, paste the contents of `ofertas.md` into the chat.

## Your data
Everything stays on your computer: `config.json`, `ofertas.md`, `vistos.json` (what you've already seen, forgotten after 45 days) and `textos.json`. The radar only connects to the sources in the table; there is no account, no tracking and no server of ours. The folder ships a `.gitignore` so those files aren't committed by mistake if you keep your copy in a repository.

## If something fails
| Symptom | What to do |
|---|---|
| "config.json is missing" | Copy `config.ejemplo.json` as `config.json` (step 2). |
| `node` is not recognized as a command | Install Node.js 18 or newer and open a new terminal. |
| A source shows ❌ in the table (for example `HTTP 403` or `HTTP 429`) | The site blocked or limited the request. Don't re-run: wait until the next day. If it persists, switch that source off. |
| 0 new listings | Too few words in `incluir`, `dias` too low, or a very closed region list. Try `node radar.mjs --todas` (includes already-seen ones). |
| Lots of listings you can't use | Add words to `excluir` and run again. |
| You ran the radar twice in a day | By design: what was seen today shows up again, so the day isn't left empty. |
| You deleted `ofertas.md` | Pending listings and your Status marks are lost; closed listings are still recorded in `vistos.json`. |

## License
**MIT** for the files in this folder (`LICENSE`, copyright 2026 Hammock AI). The rest of the repository has its own license: see the `LICENSE` at the root. The listings the script reads belong to their sources and follow their terms.

---
Need a website or an automation for your business? → hammockai.site
