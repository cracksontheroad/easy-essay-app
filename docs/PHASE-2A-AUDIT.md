# Phase 2A — Audit against expert essay-writing systems

Each row scores the current easy-essay-app on a four-level scale:

| Code | Meaning |
|---|---|
| `✅` | **Covered** — the system's concept maps cleanly to a feature in the app |
| `🟡` | **Partial** — concept is acknowledged but not enforced / not surfaced proactively |
| `🟠` | **Reactive only** — user can ask the coach but the app does not surface or scaffold it |
| `❌` | **Missing** — no implementation today |

---

## 1. Purdue OWL — General Writing & Research

Source: <https://owl.purdue.edu/owl/general_writing/>

| OWL concept | Coverage | Where in app / Gap |
|---|---|---|
| Understanding the assignment (decoding command words) | ✅ | Step 1.5 Brief Breakdown |
| Audience awareness | ✅ | Step 1.5 audience field |
| Pre-writing strategies (brainstorming, freewriting, mapping) | 🟠 | Reactive — no in-app brainstorming canvas |
| Thesis statement (Topic + Position + Rationale) | ✅ | Step 6 Thesis formula |
| Paragraph construction (topic sentence, unity, coherence) | ✅ | Step 8 PEEL boxes |
| Transitions between paragraphs | 🟠 | Coach only; no transition linter |
| Introductions (funnel: hook → background → thesis) | ✅ | Curriculum Ch.15; example essays show it |
| Conclusions (reverse funnel, no new evidence) | ✅ | Curriculum Ch.15 + checklist row |
| Counterargument / refutation | ✅ | Step 8 has counter slot; Ch.18 They Say/I Say |
| Active vs passive voice | ✅ | **Phase 4.5 local-check** flags passive |
| Concision / removing wordiness | ✅ | **Phase 4.5 local-check** flags "in order to", zombie nouns |
| Citation styles (APA, MLA, Chicago, Harvard, IEEE) | 🟡 | Step 1 setup field; no per-style linter |
| Common citation errors (missing page, wrong author format) | ❌ | No citation-style validator |
| Quotation integration (signal phrases) | ❌ | No support |
| Paraphrasing vs quoting vs summarising | ❌ | Not addressed |
| Common ESL issues (article use, prepositions) | ❌ | Browser spell-check only |
| Writing for different disciplines (humanities, sciences, social sciences) | 🟡 | Ch.19 in curriculum; no per-discipline scaffold |

**Recommended additions:**
- **Citation linter** per style (APA 7, Harvard, MLA 9 at minimum) — see Phase 2B.
- **Transition linter** that scans for paragraph-to-paragraph signposting.
- **Signal-phrase library** ("According to Smith (2023)…", "Smith (2023) argues that…").
- **Discipline-selector** that adapts the outline template to IMRaD vs thematic structure.

---

## 2. Harvard Writing Center — "Strategies for Essay Writing"

Source: <https://writingcenter.fas.harvard.edu/>

| Harvard concept | Coverage | Where in app / Gap |
|---|---|---|
| **Motive** — why this essay is worth writing | ❌ | App has thesis but no "motive paragraph" prompt |
| **Thesis** — focused, arguable, specific | ✅ | Step 6 formula + SRSAS scoring on questions |
| **Evidence** — close-reading vs data-driven | ✅ | RADAR + PEEL Evidence slot |
| **Analysis** — interpreting evidence | ✅ | PEEL Explanation slot; Analysis Ladder Ch.10 |
| **Structure** — claim → evidence → analysis sequencing | ✅ | PEEL + outline |
| **Sources** — choosing & integrating | 🟡 | RADAR present but no integration scaffold |
| **Counterargument** — naysayer's strongest objection | ✅ | They Say / I Say (Ch.18) |
| **Conclusion** — implications, "so what?" test | ✅ | "So what?" prompt in thesis step + Ch.15 |
| **Stitching/cohesion** — explicit roadmap + transitions | 🟡 | Outline has roadmap; no transition check |
| **Common errors** — listing evidence without analysis; thesis-by-numbers | 🟠 | Coach can catch but not proactive |

**Recommended additions:**
- **Motive prompt** in Step 6 — "Why does this thesis matter? What does the field gain from your argument?"
- **Analysis-vs-summary detector** — when a paragraph is >70% evidence/quotation and <30% interpretation, flag it.
- **"So what?" automatic check** after Thesis is saved — confirm the user can answer it in one sentence.

---

## 3. They Say / I Say (Graff & Birkenstein)

Source: 5th edition, W. W. Norton.

| TSIS concept | Coverage | Where in app / Gap |
|---|---|---|
| Writing is conversation — start with what others say | ✅ | Ch.18 in curriculum, counter slot in PEEL |
| Templates for introducing what "they say" | 🟡 | Coach has preset, but no in-line library |
| Templates for "I say" — agreeing, disagreeing, both | 🟡 | Same |
| Naysayer integration — concession + rebuttal | ✅ | Counter slot |
| Pointing words ("this", "such", "these") used wisely | ❌ | No check |
| Tying it all together — return-to-point sentences | ❌ | Not surfaced |
| Metacommentary — explaining your own argument's significance | ❌ | Not surfaced |
| Voice — academic register without stuffiness | 🟡 | Hedging check (Phase 4.5) helps |

**Recommended additions:**
- **Template library** as a side panel in Step 8 — click to insert "Critics of this position argue that…" etc.
- **Pointing-word linter** — flag bare "this" / "these" without referent.
- **Metacommentary prompt** — "What does this essay's argument *do* for the reader?"

---

## 4. Booth, Colomb & Williams — *The Craft of Research*

Source: 4th edition, University of Chicago Press.

| Craft-of-Research concept | Coverage | Where in app / Gap |
|---|---|---|
| Three steps: Topic → Question → Problem | ✅ | Question Funnel (Ch.3) |
| Practical vs conceptual problems | ❌ | Not explicit in app |
| **"So what?" test for the research problem** | ✅ | SRSAS Significance score |
| Sources — primary, secondary, tertiary | 🟡 | Step 5 doesn't distinguish |
| Reading sources critically (RADAR-equivalent) | ✅ | Step 5 RADAR |
| Making claims: kinds (conceptual, practical, evaluative) | ❌ | App doesn't classify claims |
| Acknowledging limitations | 🟡 | Polishing checklist has rubric self-assessment; no explicit limitations prompt |
| Warrants — connecting evidence to claim | ❌ | Not addressed; PEEL's "Explanation" gestures toward this but doesn't name the warrant |
| Drafting strategy — write the body first, conclusion before intro | 🟡 | Curriculum mentions it (Ch.15); not enforced |
| Revision strategy — reverse outlining | ❌ | Not implemented |

**Recommended additions:**
- **Practical vs conceptual problem** toggle on the research question step.
- **Claim classifier** — when the user saves the thesis, label it as Conceptual / Practical / Evaluative (heuristic) and explain what evidence each type needs.
- **Warrant prompt** in PEEL — between Evidence and Explanation: "What principle connects this evidence to your point?"
- **Reverse-outline generator** in the Polishing step — produces a one-line summary of each paragraph for the user to check coherence.

---

## 5. UNC / Yale / MIT Writing Centers (composite)

Sources: <https://writingcenter.unc.edu/>, <https://poorvucenter.yale.edu/>, <https://cmsw.mit.edu/writing-and-communication-center/>

| Writing-centre concept | Coverage | Where in app / Gap |
|---|---|---|
| Paragraph unity — single topic per paragraph | ✅ | PEEL Point + topic sentence |
| Sentence-level variety (length, structure) | ✅ | **Phase 4.5** sentence-length stats |
| Strong verbs over weak nouns | ✅ | **Phase 4.5** zombie-noun detector |
| Avoiding "filler" (very, really, basically) | ✅ | **Phase 4.5** concision linter |
| Hedging vs over-hedging | 🟡 | Hedging *detection* in Phase 4.5; no balance check |
| Common ESL / grammar issues | ❌ | Not addressed |
| Proofreading techniques (read aloud, reverse order) | 🟡 | Checklist mentions it, no in-app reverse-reader |
| Writing process management — set deadlines, accept the rough draft | 🟡 | Library shows progress but no calendar |
| Peer review structure | ✅ | Ch.22 + rubric self-assessment |
| Common organisational pitfalls — listing not arguing | 🟠 | Coach can catch |

**Recommended additions:**
- **Reverse-order proofreader** in Polishing — display the draft sentence-by-sentence, last to first, so the eye breaks the narrative flow.
- **Hedging balance check** — flag both over-hedged ("may possibly suggest…") and under-hedged ("proves that…") writing.
- **Read-aloud helper** — browser speech-synthesis on selected text.

---

## Audit summary — what to build next

By system, the most impactful additions are:

| Concept | Source | Priority | Phase to land in |
|---|---|---|---|
| Citation linter (APA 7, Harvard, MLA 9) | OWL | High | 2B |
| Signal-phrase library | OWL + TSIS | High | 2B |
| Motive prompt + "So what?" stress test | Harvard | High | 2B |
| Analysis-vs-summary balance detector | Harvard | Medium | 2B |
| Reverse-outline generator | Booth | Medium | 2B |
| Claim classifier (conceptual/practical/evaluative) | Booth | Medium | 2B |
| Warrant prompt between E and E in PEEL | Booth | Low | 2C |
| Template library (side panel, click-to-insert) | TSIS | High | 2C |
| Pointing-word linter | TSIS | Medium | 2B (local) |
| Reverse-order proofreader | UNC | Low | 2C |
| Hedging *balance* (not just presence) | UNC | Medium | 2B |
| Read-aloud helper | UNC | Low | 2C |
| Discipline-selector (IMRaD vs thematic) | OWL | Low | 2C |

**Phase 2B will tackle the High-priority items** (citation linter, signal phrases, motive prompt, analysis-vs-summary, reverse-outline) — all of which extend the **Phase 4.5 local-check engine** so they remain $0-cost where possible, escalating to the premium model only when judgement is genuinely required.

**Phase 2C will add the inline-suggestion UI** plus the template library, reverse-order proofreader, and read-aloud helper.
