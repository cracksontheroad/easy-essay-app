# Easy Essay — University Academic Writing Coach

A standalone, browser-only essay coach built around the **Academic Writing & AI**
curriculum (the 25 chapters in the sibling folder) and informed by
[kimi-easy-essay](https://kimi-easy-essay.netlify.app/)'s project-setup flow.
The essay type is **not** chosen up front — the app guides you through decoding
the brief, picking a research question, and only then recommends the essay form
that best fits.

### Guided flow (11 steps)

1. **Setup** — title, course, degree level, word count, deadline, citation style, brief
2. **Brief Breakdown** — command words, audience, scope, constraints, success criteria
3. **Rubric** — pick a template or paste your own; criteria drive every later check
4. **Research Questions** — AI generates 5 candidates from the brief; you score each on Specificity, Researchability, Significance, Arguability, Scope (0–5) and pick a favourite
5. **Essay Type** — recommended from the wording of your chosen RQ; you can override
6. **Sources (RADAR)** — RADAR-evaluated source list
7. **Thesis** — Topic + Position + Rationale + supporting claims + counterargument
8. **Outline** — type-specific blueprint with word-count allocation per section
9. **Drafting (PEEL)** — intro funnel, PEEL bodies, They Say/I Say counter, conclusion funnel
10. **Polishing** — checklist, fallacy scan, and rubric self-assessment
11. **Final & Export** — Markdown/TXT download, Notion push, Academic Integrity Log

It uses the same frameworks the book teaches:

- **Master Flowchart** — Prewriting → Planning → Writing → Polishing → Submitting
- **PEEL** paragraphs (Point · Evidence · Explanation · Link)
- **RADAR** source evaluation (Relevance, Authority, Date, Appearance, Reason)
- **Thesis Formula** — Topic + Position + Rationale, with the "So what?" test
- **They Say / I Say** for counterargument paragraphs
- **Polishing checklist** covering argument, paragraphs, language, and submission
- 7 essay types: argumentative, comparative, analytical, problem-solution,
  reflective, literature review, research proposal.

The AI Coach calls Anthropic, OpenAI, or Google Gemini — your choice — using a
key stored only in your browser.

---

## Running the app

It's a static site (HTML + CSS + vanilla JS). There is no build step.

### Quickest — open the file
```
open index.html
```
Most features work via `file://`. Some browsers block API calls from `file://`
origins; if you see CORS errors, serve it locally instead.

### Local server (recommended)
From inside this folder:
```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```
or
```bash
npx serve .
```

### Deploy (optional)
Drag-and-drop the folder onto [Netlify](https://app.netlify.com/drop) or
[Vercel](https://vercel.com/new) — no config needed.

---

## Setting up your API keys

Open the **Settings** tab and choose your preferred AI provider:

| Provider  | Where to get a key                                           |
|-----------|---------------------------------------------------------------|
| Anthropic | https://console.anthropic.com/                                |
| OpenAI    | https://platform.openai.com/api-keys                          |
| Gemini    | https://aistudio.google.com/app/apikey                        |

Click **Test AI connection** to confirm the key works. Keys are saved to
`localStorage` only — never sent anywhere except the provider's own endpoint.

### Anthropic browser-direct access
The app sends `anthropic-dangerous-direct-browser-access: true`, which Anthropic
requires for client-side requests. Be aware your key is in the browser — only
use this on machines you trust.

---

## Connecting Notion

1. Create an **internal integration** at
   <https://www.notion.so/profile/integrations> and copy the secret.
2. In Notion, open the page you want essays saved under, click `…` →
   **Connections** → add your integration.
3. Copy that page's ID from its URL (the 32-character hex string at the end).
4. In Settings, paste the token and parent page ID, then click
   **Test Notion connection**.

From the **Final & Export** step in any essay, click **Push to Notion** —
the essay (prompt, thesis, draft, outline, sources) is pushed as a new sub-page.

---

## How the curriculum maps into the app

| Curriculum chapter | App step / feature |
|---|---|
| Ch. 1 — Power of Thinking on Paper, Master Flowchart | Home flowchart modal; Curriculum tab gallery; full chapter card on Curriculum tab |
| Ch. 2 — PEEL Paragraph | Step 9 Drafting (PEEL builders per paragraph, with optional Warrant slot) |
| Ch. 3 — Power of a Question | Step 4 Research Questions (5 candidates + SRSAS scoring) |
| Ch. 4 — Fallacies | Step 10 Polishing local-checks (`fallacy-lite`) + AI Fallacy Scan button |
| Ch. 5 — RADAR | Step 6 Sources with structured source-type selector |
| Ch. 6 — Thesis Engine | Step 7 Thesis (Topic + Position + Rationale) + Motive prompt (Harvard) + Claim classifier (Booth) + AI Counter-argument generator |
| Ch. 7, 13, 16 — Synthesis Matrix, Research, Lit Review | Sources step + literature-review essay type + UG/PG/Doctoral outline templates with Lit Review section |
| Ch. 8 — Argumentative Essay | Argumentative essay-type template |
| Ch. 9, 10, 11, 12 — Comparative / Analytical / Problem-Solution / Reflective | Essay-type templates in Step 5; type recommended from RQ |
| Ch. 14 — Style | Local-checks (concision, voice, hedging, mechanics) |
| Ch. 15 — Intros & Conclusions | Step 9 Drafting (intro/conclusion funnel scaffolds) |
| Ch. 17 — Research Proposal | Essay type "Research Proposal" + PG/Doctoral outline templates |
| Ch. 18 — They Say / I Say | Counterargument paragraph + Signal-phrase library (Step 9) |
| Ch. 19 — Discipline-specific writing | Setup → Discipline modifier (8 disciplines, threaded into coach context) |
| Ch. 20–25 — Capstone, Polishing, Submission | Step 10 Polishing + Step 11 Final (export, Notion push, AI Use Declaration, integrity detection) |

## Key features by category

**Drafting helpers** — PEEL builders, signal-phrase library, AI "suggest next sentence", warrant slot.
**Local linters** ($0 cost) — concision, voice, hedging, mechanics, citation, fallacy-lite, PEEL skeleton, claim classifier, reverse-outline, pointing words, transitions, citation-style validators (APA 7 / Harvard / MLA 9 / IEEE).
**AI deep checks** (premium model) — fallacy scan, argument audit (Booth warrants), analysis-vs-summary balance, counter-argument generator, thesis stress-test, "suggest next sentence".
**Cost control** (Phase 4) — task-based model routing, Anthropic prompt caching, conversation-history trimming, per-call cost telemetry on the Final step.
**Integrity** — AI Use Declaration generator (built from the integrity log), BYO-API similarity / AI-text detection (Originality.ai, GPTZero, Copyleaks).
**Proofreading** — reverse-order proofreader, read-aloud (browser speech synth).

---

## File layout

```
easy-essay-app/
├── index.html           ← entry, view structure
├── styles.css           ← all styling
├── methodology.js       ← curriculum data: essay types, PEEL, RADAR,
│                          thesis formula, checklist, coach system prompt
├── outlines.js          ← differentiated outline templates per academic level
├── samples.js           ← fully-completed example essays per level
├── chapters.js          ← rich detail for every chapter (curriculum modal)
├── local-checks.js      ← deterministic, zero-cost linters (Phase 4.5 + 2B/2D):
│                          concision, voice, hedging, mechanics, citation,
│                          fallacy-lite, PEEL, claim classifier, reverse-outline,
│                          pointing words, transitions, citation-style validators
├── ai-providers.js      ← Anthropic / OpenAI / Gemini chat clients
│                          + pricing table, task routing, prompt caching,
│                          history-trim, usage extraction (Phase 4)
├── detection.js         ← BYO API adapter (Originality.ai / GPTZero / Copyleaks)
├── notion.js            ← Notion REST client + essay → blocks conversion
├── app.js               ← app state, navigation, step rendering, persistence,
│                          AI use declaration, cost telemetry, all step wirings
├── assets/infographics/ ← compressed JPGs of NotebookLM-generated visuals
│                          (originals preserved in originals/ subdirectory)
├── docs/                ← engineering docs (audit, changelog)
└── README.md            ← this file
```

---

## Data & privacy

Everything (drafts, settings, keys, Notion tokens) is stored in your browser's
`localStorage`. The app sends data only to:

- the AI provider you choose (when you press a coach button), and
- `api.notion.com` (when you click "Push to Notion").

Use **Settings → Wipe everything** to clear all local state.

---

## Customising the methodology

All curriculum content lives in [`methodology.js`](methodology.js). You can edit:

- `essayTypes` — add/edit essay types and their structures
- `peel`, `radar`, `thesis`, `polishChecklist` — the frameworks
- `coachSystem` — the system prompt the AI Coach uses
- `steps` — the 6-step workspace flow

After editing, just refresh the page.
