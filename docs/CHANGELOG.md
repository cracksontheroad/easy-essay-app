# Changelog

This file tracks substantial changes after the v1 build. Versions are
informal — they correspond to logical "phases" of work rather than tagged
releases.

## v2.4 — Phase 2-extras + image compression (current)

**Proactive AI buttons** (premium model when routing is enabled):
- Step 6 Thesis → **Generate strongest counterargument** with accept-into-counter-field button.
- Step 9 Polishing → **Full-draft fallacy scan** (Ch.4 fallacy list).
- Step 9 Polishing → **Argument audit (Booth)** — names the warrant of each body paragraph.
- Step 9 Polishing → **Analysis-vs-summary balance** — runs the local heuristic + an optional AI pass.

**New local checks** (Phase 2D, zero cost):
- **Transition linter** — flags paragraphs that don't open with an explicit transition.

**Structural additions**:
- **Warrant field** in each PEEL paragraph (Booth, Colomb & Williams) — optional sentence stating the unstated principle linking evidence to point.
- **Source type selector** — primary (data / text), secondary (peer-reviewed / trade / news), tertiary (reference / database), opinion, grey-lit, other.
- **Discipline modifier** in Setup — 8 disciplines (humanities, social sci, hard sci, engineering, law, business, medicine, education); a one-line discipline hint is threaded into the coach's system context.

**Asset optimisation**:
- The three NotebookLM PNGs (~13 MB total) re-encoded to 1600 px JPEG q85 (~1.3 MB total — 90% reduction).
- Originals preserved in `assets/infographics/originals/`.

---

## v2.3 — Phase 3: integrity detection (BYO API)

- New `detection.js` with generic adapter for three providers: **Originality.ai** (AI + plagiarism), **GPTZero** (AI), **Copyleaks** (AI + plagiarism).
- Settings card to pick a provider and paste a key.
- "Run Integrity Check" button on Step 11 Final — renders a Turnitin-style report (AI %, similarity %, verdict, per-chunk heatmap, matched-source list).

## v2.2 — Phase 2C: inline AI assistance + reading aids

- **Signal-phrase library** — 8 groups (They Say, I Say refute, concede, signal phrases, transitions × 3, metacommentary), click-to-insert at cursor.
- **AI "Suggest next sentence"** — sends current draft + thesis + RQ to the routed cheap model.
- **Reverse-order proofreader** — splits the draft into sentences last-to-first.
- **Read-aloud helper** — browser speech synthesis (no API call).

## v2.1 — Phase 2B: deeper local checks + claim classifier

- **Citation-style linter** for APA 7, Harvard, MLA 9, IEEE.
- **Reverse-outline generator** — topic sentence of each paragraph.
- **Claim classifier** — heuristic conceptual / practical / evaluative.
- **Motive prompt** in Step 6 Thesis.
- **Pointing-word linter** and **hedging-balance check**.

## v2.0 — Phase 2A: audit against expert systems

- `docs/PHASE-2A-AUDIT.md` — scores the app against Purdue OWL, Harvard Writing Center, They Say/I Say, Booth/Colomb/Williams *Craft of Research*, and the UNC/Yale/MIT writing centres.

## v1.5 — Phase 4: cost-reduction build

- **4.1** Default provider switched to Gemini 2.0 Flash (free tier covers most students); routine-model on each provider is the cheapest competent one.
- **4.2** Task-based model routing — routine tasks → cheap model; premium tasks (thesis critique, fallacy scan, counter-arg) → escalated model. Settings UI for toggles + premium-model picker.
- **4.3** Anthropic prompt caching on the `coachSystem` block (~90% cheaper on cache hits within 5-min TTL).
- **4.4** Conversation-history trimming — coach sends last 6 turns verbatim + 1-line summary of older turns.
- **4.5** Local-first linter (`local-checks.js`) — 7 categories, runs in 50-200 ms client-side, $0 cost.
- **4.6** Per-call cost telemetry — captures `usage` from every provider, computes USD cost using `AI_PRICING` table, sums into `state.current.aiCost`, breaks down by task and model on the Final step.

**Result:** per-essay cost dropped from ~$0.22 (Sonnet 4.5 default) to **~$0–$0.05** (Gemini Flash + routing). 30-student class for a term: ~$26 → **~$0–$1.50**.

## v1.4 — Aesthetic refresh (StudyFlow-inspired)

- Violet/indigo gradient brand, slate text palette, 2xl rounded cards, soft shadows, glow on primary CTAs.
- Dashboard stat cards on Home view.
- All component styling rewritten in `styles.css`.

## v1.3 — Differentiated outlines + sample essays

- New `outlines.js` with templates per academic level: Foundation (simple 5-section), Undergraduate (with Abstract / Lit Review / Discussion / References), Postgraduate (full Masters dissertation frontmatter + 5 numbered chapters), Doctoral (adds Theoretical Framework + Original Contribution chapters).
- New `samples.js` with one fully completed example essay per level.
- New `chapters.js` — rich detail for all 25 chapters; cards on Curriculum tab open a detail modal.
- Outline step now renders the level-appropriate template; subsection plans persist.

## v1.2 — AI Use Declaration

- Final-step generator compiles a structured Markdown declaration from the integrity log: statement of authorship, tools table, summary stats, category breakdown, "what the AI did NOT do" list, last-100-actions table, signature line.

## v1.1 — Flow restructure + NotebookLM visuals

- The essay type is no longer chosen up front. Flow becomes: Setup → Brief Breakdown → Rubric → Research Questions → Essay Type (recommended) → Sources → Thesis → Outline → Drafting → Polishing → Final.
- NotebookLM-generated Master Flowchart, RADAR, and Thesis Formula infographics.
- Curriculum tab now opens a chapter detail modal.

## v1.0 — Initial build

- 11-step workspace flow.
- Anthropic / OpenAI / Gemini coach.
- Notion push.
- Local storage of essays + settings.
