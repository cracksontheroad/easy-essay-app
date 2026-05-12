# Wix landing page for `sailedu.co/essay-writing-tool`

This page is a **marketing page** that lives inside your Wix site. Its job is
to introduce the tool and send visitors to the real app at
`https://essay.sailedu.co`. The actual workflow app is hosted on Cloudflare
Pages, not inside Wix — Wix doesn't host custom JavaScript apps, only embeds.

## How to create it in Wix

1. In the Wix Editor, **Add → Page → Blank**. Name it **"Essay Writing Tool"**, URL slug **`essay-writing-tool`**.
2. **Page SEO**: set the title to *"University Essay Writing Tool Kit — SAILedu"* and the description to one of the lines from the embed copy below.
3. On the new page, **Add → Embed Code → Embed HTML** (or **Add → More → HTML iFrame**).
4. Resize the embed to fill the page width. Paste the HTML block from `embed.html` (below) into the embed's code area.
5. Save and publish.

> **Tip:** if you want a Wix-native version with editable text blocks instead of one HTML embed, copy the wording from `embed.html` into Wix's normal text + button elements. The single-embed version below is the fastest path.

---

## `embed.html` — paste this into the Wix HTML Embed element

```html
<style>
  .ee-card {
    font-family: 'Inter', -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    max-width: 880px;
    margin: 40px auto;
    padding: 48px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(15,23,42,0.08), 0 4px 8px rgba(15,23,42,0.04);
    text-align: center;
  }
  .ee-eyebrow {
    display: inline-block;
    background: #ede9fe;
    color: #6d28d9;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 5px 14px;
    border-radius: 100px;
    text-transform: uppercase;
  }
  .ee-title {
    font-size: clamp(1.8rem, 5vw, 2.6rem);
    line-height: 1.15;
    font-weight: 800;
    color: #1e293b;
    margin: 18px 0 8px;
    letter-spacing: -0.02em;
  }
  .ee-title .hl {
    background: linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .ee-sub {
    font-size: 1.05rem;
    color: #475569;
    margin: 0 auto 28px;
    max-width: 640px;
    line-height: 1.55;
  }
  .ee-byline { color: #64748b; font-style: italic; }
  .ee-cta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #8b5cf6 0%, #4f46e5 100%);
    color: #fff;
    font: 600 1.05rem 'Inter', sans-serif;
    text-decoration: none;
    padding: 14px 28px;
    border-radius: 12px;
    box-shadow: 0 6px 18px rgba(139,92,246,0.28);
    transition: filter .15s, transform .1s;
  }
  .ee-cta:hover { filter: brightness(1.06); }
  .ee-cta:active { transform: translateY(1px); }
  .ee-secondary {
    display: inline-block;
    margin-left: 12px;
    color: #6d28d9;
    text-decoration: none;
    font-weight: 600;
    padding: 14px 18px;
  }
  .ee-features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin-top: 40px;
    text-align: left;
  }
  .ee-feat {
    padding: 18px 20px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
  }
  .ee-feat-title {
    font-weight: 700;
    color: #1e293b;
    font-size: 0.98rem;
    margin-bottom: 4px;
  }
  .ee-feat-desc {
    color: #64748b;
    font-size: 0.88rem;
    line-height: 1.5;
  }
  .ee-footnote {
    margin-top: 32px;
    color: #94a3b8;
    font-size: 0.85rem;
  }
</style>

<div class="ee-card">
  <span class="ee-eyebrow">SAILedu · 2nd Edition</span>
  <h1 class="ee-title">
    University <span class="hl">Essay Writing</span> Tool Kit
    <br/>English &amp; Chinese
  </h1>
  <p class="ee-sub">
    Getting ready for university. ESL guide to AI Prompt Engineering and Academic Writing for Chinese students.
    <br/><span class="ee-byline">by Carl Simon Alston, MA Edu.</span>
  </p>

  <a class="ee-cta" href="https://essay.sailedu.co" target="_blank" rel="noopener">
    Launch the tool →
  </a>
  <a class="ee-secondary" href="https://essay.sailedu.co/QUICKSTART.md" target="_blank" rel="noopener">
    Read the quick-start
  </a>

  <div class="ee-features">
    <div class="ee-feat">
      <div class="ee-feat-title">11-step guided process</div>
      <div class="ee-feat-desc">From brief decoding to submitted essay. Every step has its own scaffolds.</div>
    </div>
    <div class="ee-feat">
      <div class="ee-feat-title">25 chapters of curriculum</div>
      <div class="ee-feat-desc">PEEL, RADAR, They Say/I Say, Thesis Formula — all there as readable chapters.</div>
    </div>
    <div class="ee-feat">
      <div class="ee-feat-title">Notion sync</div>
      <div class="ee-feat-desc">Your essays live in your own Notion. Switch devices, never lose work.</div>
    </div>
    <div class="ee-feat">
      <div class="ee-feat-title">Bring your own AI</div>
      <div class="ee-feat-desc">Gemini free tier covers most students. Anthropic / OpenAI also supported.</div>
    </div>
  </div>

  <p class="ee-footnote">
    Works in any modern browser. Installable to phone / desktop as a free PWA.
    Your work stays on your device + your Notion — nothing is collected by us.
  </p>
</div>
```

## What this gives you

- A page at **`sailedu.co/essay-writing-tool`** with branded marketing copy.
- A big violet **Launch the tool →** button that takes visitors to `https://essay.sailedu.co` (opens in a new tab so they don't lose the SAILedu navigation).
- A "Read the quick-start" link to the in-app documentation.
- Four feature tiles describing what the tool does.
- A privacy / install footnote.

## Customise

- **Change the URL**: replace `https://essay.sailedu.co` with whichever subdomain we end up using.
- **Add screenshots**: insert a Wix image element above or below the embed.
- **Translate to Chinese**: copy the embed, add a Chinese version under the English one, or create a Wix language switcher and put each version on a localised URL.
- **A/B test**: try different button copy ("Start writing →", "Open Easy Essay", "Begin my essay") and see which gets more clicks via Wix's analytics.
