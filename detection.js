/* ========================================================================
 * INTEGRITY DETECTION — PHASE 3
 *
 * Generic adapter for similarity / AI-text detection services. Pick one
 * in Settings, paste your API key, and the Final-step "Run Integrity
 * Check" button submits the draft and renders a Turnitin-style report.
 *
 * Currently supported (browser-side fetch with CORS):
 *   • Originality.ai   — AI detection + plagiarism, single call, JSON.
 *   • GPTZero          — AI detection only.
 *   • Copyleaks        — AI detection + plagiarism, async (poll).
 *
 * All three return a normalised report:
 *   {
 *     overallAI:        0..1,         // probability content is AI-generated
 *     overallSimilarity: 0..1 | null,  // 0..1 share matched against corpora
 *     verdict:          "human" | "mixed" | "ai" | "unknown",
 *     perChunk: [{ start, end, aiScore, sources?[] }],
 *     matchedSources?:  [{ url, score, excerpt }],
 *     provider, model?, raw
 *   }
 *
 * NOTE: provider endpoints may change. If a call fails with CORS, the
 * provider does not support browser-side calls — user must proxy.
 * ====================================================================== */

const Detection = (function() {

  const PROVIDERS = {

    "originality.ai": {
      label: "Originality.ai",
      docsUrl: "https://docs.originality.ai/",
      keyLabel: "API key (X-OAI-API-KEY)",
      supportsPlagiarism: true,
      async run({ apiKey, text }) {
        const res = await fetch("https://api.originality.ai/api/v1/scan/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-OAI-API-KEY": apiKey
          },
          body: JSON.stringify({ content: text, title: "easy-essay submission", aiModelVersion: "lite" })
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Originality ${res.status}: ${t.slice(0, 200)}`);
        }
        const data = await res.json();
        const aiScore = (data.score?.ai ?? data.ai ?? 0);
        return normalise({
          overallAI: aiScore,
          overallSimilarity: data.score?.plagiarism ?? null,
          provider: "originality.ai",
          raw: data
        });
      }
    },

    "gptzero": {
      label: "GPTZero",
      docsUrl: "https://gptzero.me/docs",
      keyLabel: "API key (x-api-key)",
      supportsPlagiarism: false,
      async run({ apiKey, text }) {
        const res = await fetch("https://api.gptzero.me/v2/predict/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
          },
          body: JSON.stringify({ document: text, multilingual: false })
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`GPTZero ${res.status}: ${t.slice(0, 200)}`);
        }
        const data = await res.json();
        const doc = (data.documents && data.documents[0]) || {};
        const aiScore = (doc.class_probabilities?.ai ?? doc.completely_generated_prob ?? 0);
        const perSentence = (doc.sentences || []).map(s => ({
          start: s.startIndex ?? 0,
          end:   s.endIndex   ?? 0,
          aiScore: s.generated_prob ?? 0
        }));
        return normalise({
          overallAI: aiScore,
          overallSimilarity: null,
          perChunk: perSentence,
          provider: "gptzero",
          raw: data
        });
      }
    },

    "copyleaks": {
      label: "Copyleaks",
      docsUrl: "https://api.copyleaks.com/documentation/v3",
      keyLabel: "API key (Bearer)",
      supportsPlagiarism: true,
      // Copyleaks is async — submit, then poll. The browser-side variant
      // is the AI-Content endpoint which is synchronous.
      async run({ apiKey, text }) {
        const res = await fetch("https://api.copyleaks.com/v2/writer-detector/" + encodeURIComponent("easy-essay-" + Date.now()) + "/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({ text })
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`Copyleaks ${res.status}: ${t.slice(0, 200)}`);
        }
        const data = await res.json();
        const aiScore = (data.summary?.ai ?? 0) / 100; // 0..100 → 0..1
        const perChunk = (data.results || []).map(r => ({
          start: r.start, end: r.end, aiScore: (r.probability ?? 0) / 100
        }));
        return normalise({
          overallAI: aiScore,
          overallSimilarity: null,
          perChunk,
          provider: "copyleaks",
          raw: data
        });
      }
    }
  };

  function normalise(r) {
    const ai = clamp01(r.overallAI ?? 0);
    return {
      overallAI: ai,
      overallSimilarity: r.overallSimilarity != null ? clamp01(r.overallSimilarity) : null,
      verdict: ai < 0.15 ? "human" : ai > 0.7 ? "ai" : "mixed",
      perChunk: r.perChunk || [],
      matchedSources: r.matchedSources || [],
      provider: r.provider,
      raw: r.raw
    };
  }

  function clamp01(v) { return Math.max(0, Math.min(1, Number(v) || 0)); }

  return { PROVIDERS, normalise };
})();

window.Detection = Detection;
