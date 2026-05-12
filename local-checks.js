/* ========================================================================
 * LOCAL-FIRST WRITING CHECKS  (PHASE 4.5)
 *
 * Deterministic, zero-cost linters that run before the AI coach is asked
 * for help. Each finding has shape:
 *   { id, severity: "info"|"warn"|"flag", line, col, excerpt, suggestion, category }
 *
 * Categories map onto the curriculum:
 *   "concision"  — Ch.14 zombie nouns, "in order to", "the fact that"
 *   "voice"      — Ch.14 passive voice
 *   "hedging"    — Ch.14 hedging language presence
 *   "mechanics"  — repeated words
 *   "citation"   — uncited statistics / quotes
 *   "fallacy-lite" — Ch.4 keyword tripwires
 *   "peel"       — Ch.2 paragraph skeleton
 *
 * These are HEURISTICS — fast and deterministic, not a substitute for
 * human or AI review. Severity "flag" should usually trigger a fix;
 * "warn" is worth checking; "info" is FYI.
 * ====================================================================== */

const LocalChecks = (function() {

  /* ---------- concision (Ch.14) ---------- */
  const CONCISION_PHRASES = [
    { rx: /\bin order to\b/gi,                  fix: "to",       msg: "“in order to” → “to”" },
    { rx: /\bthe fact that\b/gi,                fix: "that",     msg: "“the fact that” → “that” (or rephrase)" },
    { rx: /\bdue to the fact that\b/gi,         fix: "because",  msg: "“due to the fact that” → “because”" },
    { rx: /\bin spite of the fact that\b/gi,    fix: "although", msg: "“in spite of the fact that” → “although”" },
    { rx: /\bat this point in time\b/gi,        fix: "now",      msg: "“at this point in time” → “now”" },
    { rx: /\bin the event that\b/gi,            fix: "if",       msg: "“in the event that” → “if”" },
    { rx: /\bfor the purpose of\b/gi,           fix: "to",       msg: "“for the purpose of” → “to”" },
    { rx: /\bit is important to note that\b/gi, fix: "",         msg: "Drop “It is important to note that” — let the claim stand." },
    { rx: /\bbasically\b/gi,                    fix: "",         msg: "Drop “basically” — usually filler." },
    { rx: /\bessentially\b/gi,                  fix: "",         msg: "Drop “essentially” — usually filler." },
    { rx: /\bvery\s+\w+/gi,                     fix: null,       msg: "Replace “very + adjective” with a stronger single word." },
    { rx: /\breally\s+\w+/gi,                   fix: null,       msg: "“Really + adjective” weakens prose — pick a stronger adjective." }
  ];

  const ZOMBIE_NOUNS = [
    { rx: /\b(?:do|make|conduct|perform)\s+an?\s+(\w+ation|\w+ment|\w+ence|\w+ance)\s+of\b/gi,
      msg: "Zombie noun — turn the noun back into a verb (e.g. “do an analysis of” → “analyse”)." }
  ];

  // Passive-voice heuristic: be-verb + past participle.
  const PASSIVE_RX = /\b(is|are|was|were|be|been|being)\s+(\w+ed|written|done|made|shown|seen|said|taken|given|known|found|chosen|driven|broken|spoken)\b/gi;

  const HEDGING_RX = /\b(suggest|suggests|suggested|indicate|indicates|indicated|appear|appears|appeared|may|might|could|tends to|tend to|seems? to|implies?|imply)\b/gi;

  const FALLACY_TRIPWIRES = [
    { rx: /\b(?:everyone|nobody|always|never|all)\s+(?:knows|agrees|believes|thinks)\b/gi,
      name: "Hasty generalisation",
      msg: "Sweeping claim — qualify it (“most studies find…”) or cite specific evidence." },
    { rx: /\b(?:either)\b[^.?!]{0,80}\bor\b/gi,
      name: "False dichotomy",
      msg: "Either/or framing — are there really only two options?" },
    { rx: /\b(?:obvious(?:ly)?|clearly|of course|undoubtedly|without (?:a )?doubt)\b/gi,
      name: "Loaded language / assumed agreement",
      msg: "Avoid claiming something is “obvious” — let the evidence carry it." },
    { rx: /\b(?:proven|proved)\b(?!\s+(?:wrong|false))/gi,
      name: "Strong proof claim",
      msg: "Empirical research rarely “proves” — prefer “indicates”, “demonstrates”, “provides evidence that”." },
    { rx: /\bcommon sense\b/gi,
      name: "Appeal to common sense",
      msg: "“Common sense” isn’t an argument — substitute the actual reason." }
  ];

  // Helper: iterate every regex match in a string without the .exec API.
  function eachMatch(rx, s, fn) {
    const flags = rx.flags.includes("g") ? rx.flags : (rx.flags + "g");
    const re = new RegExp(rx.source, flags);
    for (const m of s.matchAll(re)) fn(m);
  }

  function findUncitedClaims(text) {
    const out = [];
    const lines = text.split(/\n/);
    let lineNum = 0;
    const pats = [
      /\b\d{1,3}(?:\.\d+)?\s*(?:per cent|percent|%)/g,
      /\b(?:in|by|since)\s+\d{4}\b/g,
      /"([^"]{15,})"/g
    ];
    for (const line of lines) {
      lineNum++;
      for (const pat of pats) {
        for (const m of line.matchAll(pat)) {
          const start = m.index;
          const end   = start + m[0].length;
          const window = line.slice(Math.max(0, start - 80), Math.min(line.length, end + 80));
          const hasCite = /\([A-Z][a-zA-Z'\-]+(?:\s+(?:et al\.?|and|&)\s+[A-Z][a-zA-Z'\-]+)?(?:,?\s+\d{4})\)/.test(window)
                       || /\[\d+\]/.test(window)
                       || /\bp\.\s?\d+/.test(window);
          if (!hasCite) {
            out.push({
              id: "citation-missing", severity: "flag", category: "citation",
              line: lineNum, col: start,
              excerpt: line.slice(Math.max(0, start - 20), Math.min(line.length, end + 20)).trim(),
              suggestion: "Statistic, year, or quote without a nearby citation — add (Author, Year) or a footnote."
            });
          }
        }
      }
    }
    return out;
  }

  function findRepeats(text) {
    const out = [];
    const lines = text.split(/\n/);
    let lineNum = 0;
    for (const line of lines) {
      lineNum++;
      for (const m of line.matchAll(/\b(\w{4,})\s+\1\b/gi)) {
        out.push({
          id: "repeat", severity: "warn", category: "mechanics",
          line: lineNum, col: m.index, excerpt: m[0],
          suggestion: `Repeated word: “${m[0]}” — typo?`
        });
      }
    }
    return out;
  }

  function sentenceStats(text) {
    const sents = (text || "").replace(/\s+/g, " ").split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    if (sents.length === 0) return null;
    const lens = sents.map(s => s.split(/\s+/).length);
    const avg = lens.reduce((a,b)=>a+b,0) / lens.length;
    const variance = lens.reduce((a,b)=>a+(b-avg)*(b-avg),0) / lens.length;
    const sd = Math.sqrt(variance);
    return { count: sents.length, avg, sd, min: Math.min(...lens), max: Math.max(...lens) };
  }

  function peelGaps(paragraph) {
    const out = [];
    const text = (paragraph || "").trim();
    if (!text) return out;
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length < 2) {
      out.push({ id: "peel-too-short", severity: "warn", category: "peel",
        line: 1, col: 0, excerpt: sentences[0] || "",
        suggestion: "A PEEL paragraph needs at least Point + Evidence + Explanation; this looks like 1 sentence." });
      return out;
    }
    const hasEvidence = /\d|"|\(\s?[A-Z][a-z]+|et al\.|\bsource\b|\baccording to\b/i.test(text);
    if (!hasEvidence) {
      out.push({ id: "peel-no-evidence", severity: "flag", category: "peel",
        line: 1, col: 0, excerpt: sentences[0],
        suggestion: "Cannot find evidence (stat, quote, citation, or named source) — add the E in PEEL." });
    }
    const hasExplain = /\b(?:this\s+(?:shows|suggests|indicates|demonstrates|reveals)|the\s+significance|what\s+this\s+(?:means|shows))\b/i.test(text);
    if (!hasExplain) {
      out.push({ id: "peel-no-explain", severity: "warn", category: "peel",
        line: 1, col: 0, excerpt: sentences[sentences.length-1],
        suggestion: "No explicit “this shows that…” move — add an Explanation step linking evidence back to the Point." });
    }
    const lastSent = sentences[sentences.length-1] || "";
    const hasLink = /\b(?:therefore|thus|hence|this\s+(?:not\s+only|leads|points|sets)|the\s+next\s+(?:paragraph|section)|moreover|consequently)\b/i.test(lastSent);
    if (!hasLink) {
      out.push({ id: "peel-no-link", severity: "info", category: "peel",
        line: 1, col: 0, excerpt: lastSent,
        suggestion: "Optional: end with a Link sentence pointing to the next paragraph or back to the thesis." });
    }
    return out;
  }

  function lint(text, { categories } = {}) {
    if (!text || !text.trim()) return [];
    const findings = [];
    const lines = text.split(/\n/);

    function applyRules(rules, category, severityIfMatched = "warn") {
      lines.forEach((line, i) => {
        for (const rule of rules) {
          eachMatch(rule.rx, line, (m) => {
            findings.push({
              id: rule.name || rule.msg.slice(0, 30),
              severity: severityIfMatched,
              category,
              line: i + 1,
              col: m.index,
              excerpt: m[0],
              suggestion: rule.msg + (rule.fix !== undefined && rule.fix !== null
                ? ` (replacement: ${rule.fix ? "“" + rule.fix + "”" : "remove"})`
                : "")
            });
          });
        }
      });
    }

    applyRules(CONCISION_PHRASES, "concision");
    applyRules(ZOMBIE_NOUNS,      "concision");
    applyRules(FALLACY_TRIPWIRES, "fallacy-lite", "flag");

    lines.forEach((line, i) => {
      eachMatch(PASSIVE_RX, line, (m) => {
        findings.push({
          id: "passive-voice", severity: "info", category: "voice",
          line: i + 1, col: m.index, excerpt: m[0],
          suggestion: "Possible passive voice — consider an active alternative."
        });
      });
    });

    findings.push(...findUncitedClaims(text));
    findings.push(...findRepeats(text));

    if (categories) return findings.filter(f => categories.includes(f.category));
    return findings;
  }

  function summary(findings) {
    const c = { flag: 0, warn: 0, info: 0 };
    const byCat = {};
    for (const f of findings) {
      c[f.severity] = (c[f.severity] || 0) + 1;
      byCat[f.category] = (byCat[f.category] || 0) + 1;
    }
    return { total: findings.length, ...c, byCat };
  }

  /* ========================================================================
   * PHASE 2B — Citation-style validators
   *
   * Each validator returns an array of findings with the same shape.
   * Validators recognise the most common formatting errors per style;
   * they do not pretend to fully parse a bibliography.
   * ====================================================================== */

  const CITATION_VALIDATORS = {

    "APA 7th": function(text) {
      const out = [];
      const lines = text.split(/\n/);
      lines.forEach((line, i) => {
        // (Author 2023) — APA 7 requires comma: (Author, 2023)
        for (const m of line.matchAll(/\(([A-Z][a-zA-Z'\-]+(?:\s+(?:and|&)\s+[A-Z][a-zA-Z'\-]+)?)\s+(\d{4})\)/g)) {
          out.push({ id:"apa-no-comma", severity:"flag", category:"citation",
            line:i+1, col:m.index, excerpt:m[0],
            suggestion:"APA 7 in-text: comma between author and year — “("+m[1]+", "+m[2]+")”." });
        }
        // "Author et al, 2023" — APA wants "et al."
        for (const m of line.matchAll(/\b([A-Z][a-zA-Z'\-]+)\s+et\s+al\s+\d{4}\b/g)) {
          out.push({ id:"apa-etal-no-period", severity:"warn", category:"citation",
            line:i+1, col:m.index, excerpt:m[0],
            suggestion:"APA: “et al.” takes a period and is followed by comma + year: “"+m[1]+" et al., 2023”." });
        }
      });
      return out;
    },

    "Harvard": function(text) {
      const out = [];
      const lines = text.split(/\n/);
      lines.forEach((line, i) => {
        // Harvard: (Author 2023, p.45) — should be (Author, 2023, p.45) OR
        // some institutions accept (Author 2023). We'll just flag both styles
        // mixed in the same doc.
        // Detect "(Author, 2023, p 45)" missing dot/colon after p.
        for (const m of line.matchAll(/\([A-Z][a-zA-Z'\-]+,?\s*\d{4},?\s*p\s+\d+\)/g)) {
          out.push({ id:"harv-page-style", severity:"info", category:"citation",
            line:i+1, col:m.index, excerpt:m[0],
            suggestion:"Harvard page citation usually uses “p. 45” (with period and space)." });
        }
      });
      return out;
    },

    "MLA 9th": function(text) {
      const out = [];
      const lines = text.split(/\n/);
      lines.forEach((line, i) => {
        // MLA 9 — no comma, just (Author 45)
        for (const m of line.matchAll(/\(([A-Z][a-zA-Z'\-]+),\s+(\d+)\)/g)) {
          out.push({ id:"mla-spurious-comma", severity:"warn", category:"citation",
            line:i+1, col:m.index, excerpt:m[0],
            suggestion:"MLA 9: no comma between author and page — “("+m[1]+" "+m[2]+")”." });
        }
      });
      return out;
    },

    "Chicago": function(text) {
      // Chicago author-date is similar to APA; notes-and-bibliography uses
      // footnotes. Too style-dependent to lint usefully without ToC. Return [].
      return [];
    },

    "IEEE": function(text) {
      const out = [];
      const lines = text.split(/\n/);
      lines.forEach((line, i) => {
        // IEEE uses [1], [2], …; flag (Author, 2023) as wrong style.
        for (const m of line.matchAll(/\([A-Z][a-zA-Z'\-]+,?\s+\d{4}\)/g)) {
          out.push({ id:"ieee-author-date", severity:"flag", category:"citation",
            line:i+1, col:m.index, excerpt:m[0],
            suggestion:"IEEE uses numeric citations like [1] — author-date is the wrong style." });
        }
      });
      return out;
    },

    "OSCOLA": function(text) {
      // OSCOLA = footnotes. Lint only obvious wrong forms.
      return [];
    }
  };

  function lintCitations(text, style) {
    if (!style || !CITATION_VALIDATORS[style]) return [];
    return CITATION_VALIDATORS[style](text || "");
  }

  /* ========================================================================
   * PHASE 2B — Analysis-vs-summary balance
   * A body paragraph should be at most ~50% evidence + ~50% analysis.
   * Heuristic: count words inside quotes vs total words.
   * ====================================================================== */

  function analysisBalance(paragraph) {
    const text = (paragraph || "").trim();
    if (!text) return null;
    const totalWords = text.split(/\s+/).filter(Boolean).length;
    const quoted = (text.match(/"[^"]+"/g) || []).join(" ").split(/\s+/).filter(Boolean).length;
    // "According to…" / "Smith argues that…" — count as evidence-leaning text
    const evidenceLead = (text.match(/\b(according to|argues? that|states? that|writes? that|claims? that)\b/gi) || []).length;
    const ratio = totalWords ? quoted / totalWords : 0;
    return {
      totalWords, quoted, evidenceLead,
      quotedRatio: ratio,
      verdict: ratio > 0.45 ? "evidence-heavy"
             : ratio < 0.05 && evidenceLead === 0 ? "unsupported"
             : "balanced"
    };
  }

  /* ========================================================================
   * PHASE 2B — Pointing-word linter (They Say / I Say)
   * Flag sentence-initial "This"/"These"/"That" without a noun referent.
   * ====================================================================== */

  function pointingWordCheck(text) {
    const out = [];
    const lines = text.split(/\n/);
    lines.forEach((line, i) => {
      // sentence-starting pointing words followed by a verb (no noun)
      for (const m of line.matchAll(/(?:^|\.\s+|!\s+|\?\s+)((This|These|That|Those)\s+(?:is|are|was|were|shows|reveals|suggests|indicates|means|implies)\b)/g)) {
        out.push({ id:"bare-pointing-word", severity:"warn", category:"mechanics",
          line:i+1, col:m.index + (m[0].length - m[1].length),
          excerpt:m[1],
          suggestion:"Bare “"+m[2]+"” at start of sentence — add a noun: “"+m[2]+" finding / argument / pattern…”." });
      }
    });
    return out;
  }

  /* ========================================================================
   * PHASE 2B — Hedging balance
   * Both over-hedging ("may possibly indicate that…") and under-hedging
   * ("proves that all X…") weaken academic prose.
   * ====================================================================== */

  function hedgingBalance(text) {
    const out = [];
    if (!text) return out;
    const lines = text.split(/\n/);
    lines.forEach((line, i) => {
      // Stacked hedges — 3+ within 60 chars
      for (const m of line.matchAll(/((?:may|might|could|possibly|perhaps|seems?|suggests?|appears?|tends? to)\s+){3,}/gi)) {
        out.push({ id:"over-hedged", severity:"warn", category:"hedging",
          line:i+1, col:m.index, excerpt:m[0],
          suggestion:"Stacked hedges — pick one. “may possibly suggest” → “suggests”." });
      }
      // Under-hedged absolutes
      for (const m of line.matchAll(/\b(?:proves|prove|definitively|undoubtedly|certainly|without\s+doubt)\b/gi)) {
        out.push({ id:"under-hedged", severity:"info", category:"hedging",
          line:i+1, col:m.index, excerpt:m[0],
          suggestion:"Strong claim — does the evidence really support certainty? Hedge to “indicates / suggests / demonstrates”." });
      }
    });
    return out;
  }

  /* ========================================================================
   * PHASE 2B — Claim classifier (Booth/Colomb/Williams)
   * Heuristic: classify a thesis sentence as conceptual / practical /
   * evaluative based on lexical signals.
   * ====================================================================== */

  function classifyClaim(thesis) {
    if (!thesis || !thesis.trim()) return null;
    const t = thesis.toLowerCase();
    const scores = { conceptual:0, practical:0, evaluative:0 };
    if (/\b(should|ought|must|need to|recommend|propose|advocate)\b/.test(t)) scores.practical += 2;
    if (/\b(better|worse|preferable|superior|inferior|effective|ineffective|valid|invalid|inadequate|justified|unjustified|fair|unfair|right|wrong|moral|ethical|good|bad|harmful|beneficial)\b/.test(t)) scores.evaluative += 2;
    // No \b at the end of these stems so reshap-es / restructur-ing match.
    if (/\b(because|since|owing to|result[s]? from|cause[sd]?|lead[s]? to|reshap\w*|restructur\w*|mechanism|process)\b/.test(t)) scores.conceptual += 2;
    if (/\b(explain|account for|understand|reveal|show that|demonstrate|describe how)\b/.test(t)) scores.conceptual += 1;
    if (/\b(implement|design|build|develop|introduce|adopt|regulate|require|enforce)\b/.test(t)) scores.practical += 1;
    const best = Object.entries(scores).sort((a,b) => b[1]-a[1])[0];
    if (best[1] === 0) return { type:"conceptual", confidence:"low", scores,
      guidance:"Default — describes a relationship or mechanism. Needs evidence + analysis." };
    const guidance = {
      conceptual: "Conceptual claim — explains a mechanism or relationship. Strongest support: causal evidence + named theory.",
      practical:  "Practical claim — recommends action or change. Strongest support: feasibility evidence + comparison to existing solutions.",
      evaluative: "Evaluative claim — judges value or quality. Strongest support: explicit criteria + comparison + acknowledged opposing values."
    };
    return { type:best[0], confidence: best[1] >= 2 ? "high" : "medium",
             scores, guidance: guidance[best[0]] };
  }

  /* ========================================================================
   * PHASE 2D — Transition linter
   * Flags body paragraphs whose first sentence has no explicit transition
   * marker — a common cohesion failure mode.
   *
   * Returns one finding per paragraph (other than the first) that opens
   * with a noun without a transition phrase.
   * ====================================================================== */

  const TRANSITION_HEADS = /^(?:Moreover|Furthermore|In addition|Additionally|However|On the other hand|By contrast|Nevertheless|Therefore|Thus|Hence|Consequently|As a result|First|Second|Third|Finally|In conclusion|Taken together|Crucially|Significantly|Critically|Yet|Although|Even so|Beyond this|What is more|Building on|In light of|To extend|Returning to)\b/i;

  function transitionCheck(draft) {
    const out = [];
    const paragraphs = (draft || "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    paragraphs.forEach((p, i) => {
      if (i === 0) return; // intro paragraph: no transition expected
      const firstSent = p.split(/(?<=[.!?])\s+/)[0] || "";
      if (!TRANSITION_HEADS.test(firstSent.trim())) {
        out.push({
          id: "no-transition", severity: "warn", category: "mechanics",
          line: i + 1, col: 0,
          excerpt: firstSent.slice(0, 80),
          suggestion: `Paragraph ${i+1} doesn't open with an explicit transition — consider “Moreover”, “However”, “By contrast”, “In light of”, etc.`
        });
      }
    });
    return out;
  }

  /* ========================================================================
   * PHASE 2B — Reverse-outline generator
   * Extracts the topic sentence (first sentence) of each paragraph.
   * Lets the user see the bones of their argument.
   * ====================================================================== */

  function reverseOutline(draft) {
    const paragraphs = (draft || "")
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);
    return paragraphs.map((p, i) => {
      const firstSent = p.split(/(?<=[.!?])\s+/)[0] || p.slice(0, 120);
      const wordCount = p.split(/\s+/).filter(Boolean).length;
      return {
        index: i + 1,
        topicSentence: firstSent.length > 200 ? firstSent.slice(0, 200) + "…" : firstSent,
        wordCount
      };
    });
  }

  return {
    lint, peelGaps, sentenceStats, summary,
    lintCitations, analysisBalance, pointingWordCheck,
    hedgingBalance, classifyClaim, reverseOutline,
    transitionCheck,
    CITATION_VALIDATORS
  };
})();

window.LocalChecks = LocalChecks;
