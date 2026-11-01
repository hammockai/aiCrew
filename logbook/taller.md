# 🎭 The Character Workshop: how we create each agent

*[Español](taller.es.md) · October 2026*

Every agent in the crew comes out of the same workshop. It isn't a prompt written in one go: it's a small chain of crafts, where each one does only its part and the next one reviews it.

## The flow
1. **The Captain asks for the agent** and says what real use or product it's for. No real use, no agent: the risk of this method is that creating agents becomes the job instead of doing the work.
2. **The Artist proposes the character:** a name that says what it does, personality, look (pixel art, human or animal + droid) and, above all, **what concrete behavior the character should improve**. The character is a working tool, not decoration.
3. **The sails are calibrated.** The Six Pillars are the shared intent, but each agent carries them with the strength its craft needs:
   - ⛵ **Mainsail:** the core of the craft, always at full.
   - 🪢 **Working sail:** applied as usual.
   - 🌬️ **Flexible sail:** adjusted to the role, always with its limit written down.
   - **The hull** is not a sail and is never lowered: no lying or inventing, no manipulation or fake urgency, no exposing personal data, and the Captain's decisions belong to the Captain.
4. **The Architect designs the agent:** prompt in Spanish and English to the same standard, smoke tests, and a test **with and without the character** to measure whether the character really helps.
5. **Guardian validates** against the sail profile, the values and personal data, with exact fixes (file, current text → new text).
6. **Iterate and use it on real work.** Only what was tested on real work gets published here.

## A real case: The Builder and La Cerrajera
We created them to build our own portfolio of sample sites. What Guardian corrected before installing them says more than the method:
- **Made-up phone numbers in the demos:** a "fictional" number may belong to a real person, and every visitor who tapped the button would message a stranger. New rule: demo buttons never carry made-up numbers.
- **A `noindex` that doesn't work:** if `robots.txt` blocks a page, the search engine can't see its `noindex` and may show it anyway. New rule: demos carry `noindex` and `robots.txt` doesn't block them.
- **Health data:** on a psychologist's site, neither the form nor the prefilled message asks for the reason for the visit, and there are no patient testimonials.
- **Half-masked secrets:** showing "the first 3 and the last 4" of a short password reveals almost all of it. New rule: passwords and short secrets are masked completely.
- **Hosting:** GitHub Pages' terms don't allow it as free hosting for an online business or store, so client sites go on Cloudflare Pages, in the client's name.

Then La Cerrajera audited her own tool and found a gap in the local server: on Windows, short file names let someone request hidden files. It was closed before publishing.

## What we learned
- One agent per craft ("every baker to their cakes"): the one who builds doesn't audit, the one who audits doesn't build.
- Cross-review finds what the author can't see, even when the author is an AI.
- Whatever goes public always goes through Guardian.

*Want us to build it for you? → [hammockai.site](https://hammockai.site)*
