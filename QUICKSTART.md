# Easy Essay — Quick Start (for Students)

A guided essay workflow that walks you from blank brief → submitted draft using
the **Academic Writing & AI** curriculum (PEEL, RADAR, They Say/I Say, the
Thesis Formula, and more). Runs entirely in your browser. Your essay drafts
and API keys never leave your machine.

---

## What you need

1. A **modern web browser** — Chrome, Edge, Safari, or Firefox (last 2 years).
2. **Python 3** *(only for the local-server option; macOS and most Linux already have it)*.
3. **One AI provider API key** — pick whichever you have or want:
   - **Google Gemini** — *recommended for students*. Free tier covers most essay-writing usage. Get a key at <https://aistudio.google.com/app/apikey>
   - **Anthropic Claude** — paid only. Get a key at <https://console.anthropic.com/>
   - **OpenAI** — paid only. Get a key at <https://platform.openai.com/api-keys>

---

## Set up in 60 seconds

### Step 1. Download

Download the ZIP your tutor sent you and unzip it anywhere — Desktop, Downloads, a USB stick. The folder will be called `easy-essay-app/`.

### Step 2. Start the app

**Option A — Easiest (macOS / Linux):**

Open Terminal, drag the `easy-essay-app` folder into it, press Enter, then run:

```bash
./start.sh
```

Then open <http://localhost:8000> in your browser.

**Option B — Windows or no terminal:**

Double-click `index.html` in the folder. Most features work this way; if the AI coach errors out with a CORS message, use Option A instead.

**Option C — Cloud (no install):**

Drag the entire `easy-essay-app` folder onto <https://app.netlify.com/drop>. You'll get a URL within seconds. (Your keys still stay on **your** browser; Netlify hosts only the static HTML/CSS/JS.)

### Step 3. Add your API key

1. Click the **Settings** tab.
2. Choose your provider (Gemini / Anthropic / OpenAI).
3. Paste your API key into the matching field.
4. Click **Save settings**.
5. Click **Test AI connection** — you should see "✓ Connected".

### Step 4. Start an essay

1. Click **Home** → **Start a New Essay**.
2. Fill in: title, course, degree level, word count, citation style, **discipline**.
3. Paste your assignment brief.
4. Walk through the 11 steps left-to-right. The side rail tracks your progress.

That's it. Every step saves automatically to your browser. Close the tab and your work is still there next time.

---

## Cost expectations

The default settings keep AI cost very low:

| Provider | Per-essay cost | Notes |
|---|---|---|
| **Gemini 2.0 Flash** | **~$0** | Free-tier usage normally covers everything |
| Claude Haiku 4.5 | ~$0.07 | Anthropic, cheapest tier |
| GPT-4o-mini | ~$0.01 | OpenAI, cheapest tier |
| Claude Sonnet 4.5 | ~$0.22 | Anthropic, premium |

The **Final** step of each essay shows you a running total of what your AI calls have cost. There are no surprise charges — the app only calls the AI when **you** click a coach button.

---

## What's in the app

Eleven guided steps, with cost-free local checks at every stage and AI assistance only when you ask for it:

1. **Setup** — title, course, level, word count, citation style, discipline.
2. **Brief Breakdown** — decode command words, audience, scope.
3. **Rubric** — pick a template or paste your own.
4. **Research Questions** — generate 5 candidates with the AI, then pick a winner using SRSAS scoring.
5. **Essay Type** — automatically recommended from your question; override if you want.
6. **Sources** — RADAR-evaluated source list (Relevance, Authority, Date, Appearance, Reason).
7. **Thesis** — Topic + Position + Rationale formula, with claim classifier and AI counter-argument generator.
8. **Outline** — full chapter-based outline if you're at UG / Masters / Doctoral level; simple 5-section for pre-university.
9. **Drafting** — PEEL paragraphs (Point, Evidence, **Warrant**, Explanation, Link) + signal-phrase library + "✨ Suggest next sentence" button.
10. **Polishing** — instant local checks (concision, voice, hedging, citations) + AI deep checks (fallacy scan, argument audit, analysis-vs-summary balance) + reverse-order proofreader + read-aloud.
11. **Final** — export as Markdown / TXT, push to Notion, AI Use Declaration generator, optional integrity report (BYO Originality.ai / GPTZero / Copyleaks key).

Plus:

- **Examples tab** — fully completed sample essays at four academic levels (Foundation / Undergraduate / Postgraduate / Doctoral).
- **Curriculum tab** — every chapter as a clickable card with full content + visual frameworks gallery.

---

## Privacy

| Where your data goes | What goes there |
|---|---|
| Your browser's `localStorage` | Drafts, settings, API keys |
| Your chosen AI provider | Coach prompts you send (only when **you** click a coach button) |
| Notion (optional) | Final essay, only when **you** click "Push to Notion" |
| Integrity provider (optional) | Final draft, only when **you** click "Run Integrity Check" |

Nothing else leaves your machine. There is no analytics or telemetry — open the browser DevTools and watch the network tab if you want to verify.

---

## Troubleshooting

**"No API key set" toast** — go to Settings, paste your key, save.

**"Anthropic 401" or "OpenAI 401"** — your key is wrong. Re-copy it from the provider's dashboard. No extra spaces.

**"CORS error" when opening with double-click** — use the local-server option (`./start.sh`) or deploy to Netlify Drop instead.

**Coach reply is very short / cut off** — increase your word count target, or wait for the API quota to reset (Gemini's free tier has per-minute caps).

**I want to wipe everything and start fresh** — Settings → Wipe everything.

---

## Asking for help

Bring screenshots of the **AI cost panel** on the Final step (Step 11) when asking your tutor for help — it shows which model, which task, and how many tokens were spent on each call. That's usually enough to diagnose any issue.

---

*Easy Essay is a free, open, browser-only learning tool. It is not affiliated with any AI provider.*
