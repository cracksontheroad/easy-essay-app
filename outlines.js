/* ========================================================================
 * OUTLINE TEMPLATES — differentiated by academic level
 *
 * Foundation / Pre-University: simple 5–6 paragraph essay (the curriculum's
 *   default — Intro / Body 1–3 / Counter / Conclusion).
 *
 * Undergraduate: essay-with-research structure (Title, Abstract,
 *   Introduction, Lit Review, Discussion/Argument, Conclusion, References,
 *   optional Appendices).
 *
 * Postgraduate (Masters dissertation): full chapter-based research thesis
 *   with formal frontmatter (certification, abstract, ToC, lists,
 *   abbreviations/glossary) and 5 numbered chapters.
 *
 * Doctoral / PhD: extended thesis structure with theoretical framework,
 *   ethical considerations, contribution to knowledge, and a richer set of
 *   findings / discussion / conclusion chapters.
 *
 * Each section has:
 *   key        — short id
 *   name       — display name
 *   pct        — suggested % of total word count
 *   description — what goes here, in one to three sentences
 *   subsections — optional nested children for thesis-style chapters
 * ====================================================================== */

const OUTLINE_TEMPLATES = {

  /* ============= FOUNDATION / PRE-UNIVERSITY ============= */
  foundation: {
    label: "Foundation / Pre-University essay",
    blurb: "The curriculum's default — a focused 5–6 paragraph essay built around a single arguable thesis.",
    typicalWordCount: { min: 600, max: 1500 },
    sections: [
      { key:"intro",       name:"Introduction",     pct:10, description:"Hook → background → thesis (Topic + Position + Rationale)." },
      { key:"body1",       name:"Body 1",           pct:25, description:"Strongest reason, written as a PEEL paragraph (Point → Evidence → Explanation → Link)." },
      { key:"body2",       name:"Body 2",           pct:25, description:"Second-strongest reason (PEEL)." },
      { key:"body3",       name:"Body 3",           pct:25, description:"Third reason (PEEL)." },
      { key:"counter",     name:"Counterargument",  pct:10, description:"They Say / I Say — acknowledge the strongest opposing view and refute it with evidence." },
      { key:"conclusion",  name:"Conclusion",       pct: 5, description:"Restate the thesis in fresh words, summarise the reasons, leave a final thought." }
    ]
  },

  /* ============= UNDERGRADUATE ============= */
  undergraduate: {
    label: "Undergraduate research essay",
    blurb: "A medium-length essay that integrates a focused literature review with original argument and proper academic apparatus.",
    typicalWordCount: { min: 2000, max: 4000 },
    sections: [
      { key:"title",       name:"Title page",                      pct: 0, description:"Title, your name, student ID, course, tutor, date, word count." },
      { key:"abstract",    name:"Abstract",                        pct: 3, description:"~150–250 words. Question, approach, key findings, conclusion." },
      { key:"toc",         name:"Table of contents",               pct: 0, description:"Headings + page numbers. Generated automatically by your word processor." },
      { key:"intro",       name:"1. Introduction",                 pct:10, description:"Background to the topic, the gap or debate, your research question, thesis statement, and a roadmap of the essay.",
        subsections: [
          { key:"1.1 background", name:"1.1 Background",        description:"Set the scene — why this topic, why now." },
          { key:"1.2 question",   name:"1.2 Research question",  description:"State the question your essay answers." },
          { key:"1.3 thesis",     name:"1.3 Thesis statement",   description:"Your debatable claim (Topic + Position + Rationale)." },
          { key:"1.4 scope",      name:"1.4 Scope & limitations", description:"What is in / out of scope; key delimitations." }
        ] },
      { key:"litreview",   name:"2. Literature review",            pct:25, description:"Thematic synthesis (not summary) of the relevant scholarly conversation — uses the Synthesis Matrix. End with the gap your argument addresses." },
      { key:"discussion",  name:"3. Discussion / Argument",        pct:40, description:"The body of your argument — multiple PEEL paragraphs grouped by claim. Cite RADAR-passed sources.",
        subsections: [
          { key:"3.1 claim-a", name:"3.1 First claim", description:"PEEL block — Point, Evidence, Explanation, Link." },
          { key:"3.2 claim-b", name:"3.2 Second claim", description:"PEEL block." },
          { key:"3.3 claim-c", name:"3.3 Third claim", description:"PEEL block." },
          { key:"3.4 counter", name:"3.4 Counterargument & refutation", description:"They Say / I Say — the strongest opposing view, fairly stated and refuted." }
        ] },
      { key:"conclusion",  name:"4. Conclusion",                   pct:10, description:"Restate the thesis, summarise the contribution, acknowledge limitations, suggest next steps." },
      { key:"references",  name:"References",                      pct: 7, description:"Full bibliography in the assignment's citation style (e.g. APA 7, Harvard, MLA 9)." },
      { key:"appendices",  name:"Appendices (optional)",           pct: 5, description:"Raw data, extra figures, transcripts — anything that supports the argument but interrupts flow." }
    ]
  },

  /* ============= POSTGRADUATE / MASTERS ============= */
  postgraduate: {
    label: "Masters dissertation",
    blurb: "Full chapter-based research thesis with formal frontmatter, methodology chapter, and explicit findings / recommendations.",
    typicalWordCount: { min: 12000, max: 20000 },
    sections: [
      { key:"title",          name:"i. Title page",                          pct: 0, description:"Title, candidate name, qualification, institution, department, supervisor, month / year of submission." },
      { key:"certification",  name:"ii. Certification / Declaration",        pct: 0, description:"Signed statement that the work is your own, has not been submitted elsewhere, and that all sources are acknowledged." },
      { key:"dedication",     name:"iii. Dedication",                        pct: 0, description:"Short personal dedication (optional, ~1 line)." },
      { key:"ack",            name:"iv. Acknowledgements",                   pct: 0, description:"Thanks to supervisor, funders, participants, family — short paragraph." },
      { key:"abstract",       name:"v. Abstract",                            pct: 2, description:"~250–350 words. Context, aim, method, key findings, conclusion. Self-contained — readable without the rest." },
      { key:"toc",            name:"vi. Table of contents",                  pct: 0, description:"Auto-generated; lists chapters, sections, and page numbers." },
      { key:"figures",        name:"vii. List of figures",                   pct: 0, description:"All numbered figures with captions and page numbers." },
      { key:"tables",         name:"viii. List of tables",                   pct: 0, description:"All numbered tables with captions and page numbers." },
      { key:"abbrev",         name:"ix. Abbreviations & Glossary",           pct: 0, description:"Acronyms and key term definitions used in the dissertation.",
        subsections: [
          { key:"abbrev-a", name:"Abbreviations", description:"e.g. NLP — Natural Language Processing." },
          { key:"glossary", name:"Glossary of key terms", description:"Operational definitions of specialised vocabulary." }
        ] },
      { key:"ch1",            name:"Chapter 1: Introduction",                pct:10, description:"Opens the thesis. Sets out the research problem, aims, and structure.",
        subsections: [
          { key:"1.1", name:"1.1 Background of the study",       description:"Wider context and why the problem matters." },
          { key:"1.2", name:"1.2 Research problem",              description:"The specific gap or issue your study addresses." },
          { key:"1.3", name:"1.3 Research aims and objectives",  description:"Overall aim + 3–5 specific objectives." },
          { key:"1.4", name:"1.4 Research questions",            description:"Numbered questions the thesis will answer." },
          { key:"1.5", name:"1.5 Hypotheses",                    description:"Testable predictions (if quantitative)." },
          { key:"1.6", name:"1.6 Significance of the study",     description:"Theoretical and practical contribution." },
          { key:"1.7", name:"1.7 Methodology overview",          description:"Brief preview — details go in Chapter 3." },
          { key:"1.8", name:"1.8 Scope, delimitations & structure of the thesis", description:"What is included and excluded; chapter-by-chapter roadmap." }
        ] },
      { key:"ch2",            name:"Chapter 2: Literature Review",           pct:25, description:"Thematic synthesis of the scholarly conversation. Identify theories, debates, gaps. Uses the Synthesis Matrix.",
        subsections: [
          { key:"2.1", name:"2.1 Introduction",                 description:"Scope and search strategy." },
          { key:"2.2", name:"2.2 Theoretical framework",        description:"The lens(es) used to interpret the data." },
          { key:"2.3", name:"2.3 Thematic review of literature",description:"Organise by theme — not by source." },
          { key:"2.4", name:"2.4 Gap in the literature",        description:"The specific gap your study addresses." },
          { key:"2.5", name:"2.5 Chapter summary",              description:"Recap and bridge to methodology." }
        ] },
      { key:"ch3",            name:"Chapter 3: Research Methodology",        pct:15, description:"How you did the research — replicable detail.",
        subsections: [
          { key:"3.1", name:"3.1 Research philosophy & approach", description:"Positivist / interpretivist / pragmatist; deductive / inductive." },
          { key:"3.2", name:"3.2 Research design",                description:"Quantitative / qualitative / mixed methods." },
          { key:"3.3", name:"3.3 Data collection methods",        description:"Surveys, interviews, archival, experiments — and why." },
          { key:"3.4", name:"3.4 Sampling strategy",              description:"Who / what was sampled, how, sample size and rationale." },
          { key:"3.5", name:"3.5 Data analysis techniques",       description:"Statistical tests, thematic analysis, coding scheme, software." },
          { key:"3.6", name:"3.6 Validity, reliability & trustworthiness", description:"How you ensured rigour." },
          { key:"3.7", name:"3.7 Ethical considerations",         description:"Consent, anonymity, IRB approval, data protection." },
          { key:"3.8", name:"3.8 Limitations of the method",      description:"Honest appraisal." }
        ] },
      { key:"ch4",            name:"Chapter 4: Data Analysis & Findings",    pct:25, description:"Present what you found — neutrally, before interpretation.",
        subsections: [
          { key:"4.1", name:"4.1 Introduction",                  description:"How the chapter is organised." },
          { key:"4.2", name:"4.2 Sample / participant profile",  description:"Descriptive stats about your respondents or dataset." },
          { key:"4.3", name:"4.3 Findings by research question", description:"One subsection per RQ. Tables, figures, quotations." },
          { key:"4.4", name:"4.4 Cross-cutting themes",          description:"Patterns that span multiple RQs." },
          { key:"4.5", name:"4.5 Chapter summary",               description:"Key findings in 5–7 bullets." }
        ] },
      { key:"ch5",            name:"Chapter 5: Conclusions & Recommendations", pct:15, description:"Interpret the findings, state the contribution, recommend action and future research.",
        subsections: [
          { key:"5.1", name:"5.1 Summary of findings",         description:"What the study found, mapped to each RQ." },
          { key:"5.2", name:"5.2 Discussion in light of the literature", description:"How findings compare with prior work." },
          { key:"5.3", name:"5.3 Theoretical contributions",   description:"What this adds to the field." },
          { key:"5.4", name:"5.4 Practical recommendations",   description:"For practitioners, policymakers, or stakeholders." },
          { key:"5.5", name:"5.5 Limitations of the study",    description:"Honest scope and constraints." },
          { key:"5.6", name:"5.6 Suggestions for further research", description:"Where the field goes next." },
          { key:"5.7", name:"5.7 Concluding remarks",           description:"A short, reflective closing." }
        ] },
      { key:"refs",           name:"References",                              pct: 5, description:"Complete bibliography in the required style (APA 7 / Harvard / Chicago / etc.)." },
      { key:"appendices",     name:"Appendices",                              pct: 3, description:"Consent forms, instruments, codebooks, transcripts, extra tables. Labelled A, B, C…" }
    ]
  },

  /* ============= DOCTORAL / PhD ============= */
  doctoral: {
    label: "Doctoral / PhD thesis",
    blurb: "Extended thesis with explicit theoretical framework, original contribution to knowledge, and full chapter-by-chapter argument.",
    typicalWordCount: { min: 60000, max: 100000 },
    sections: [
      { key:"title",         name:"i. Title page",                  pct: 0, description:"Title, candidate name, qualification (PhD), institution, faculty, department, supervisor(s), month / year." },
      { key:"declaration",   name:"ii. Declaration of originality", pct: 0, description:"Signed statement that the work is original and not submitted elsewhere." },
      { key:"dedication",    name:"iii. Dedication",                pct: 0, description:"Short personal dedication." },
      { key:"ack",           name:"iv. Acknowledgements",           pct: 0, description:"Thanks to supervisors, committee, funders, participants, family." },
      { key:"abstract",      name:"v. Abstract",                    pct: 1, description:"~300–500 words. Problem, approach, contribution, conclusion. Standalone." },
      { key:"toc",           name:"vi. Table of contents",          pct: 0, description:"Auto-generated; chapters, sections, sub-sections." },
      { key:"figures",       name:"vii. List of figures",           pct: 0, description:"All numbered figures." },
      { key:"tables",        name:"viii. List of tables",           pct: 0, description:"All numbered tables." },
      { key:"abbrev",        name:"ix. Abbreviations & Glossary",   pct: 0, description:"Acronyms + glossary of key terms." },
      { key:"ch1",           name:"Chapter 1: Introduction",        pct: 8, description:"Problem statement, research questions, contribution claims, and structure of the thesis.",
        subsections: [
          { key:"1.1", name:"1.1 Background and motivation",   description:"" },
          { key:"1.2", name:"1.2 Research problem",            description:"" },
          { key:"1.3", name:"1.3 Aims, objectives & research questions", description:"" },
          { key:"1.4", name:"1.4 Hypotheses (if applicable)",  description:"" },
          { key:"1.5", name:"1.5 Original contribution to knowledge", description:"What is genuinely new here." },
          { key:"1.6", name:"1.6 Significance & impact",       description:"" },
          { key:"1.7", name:"1.7 Scope and delimitations",     description:"" },
          { key:"1.8", name:"1.8 Thesis structure",            description:"Roadmap chapter-by-chapter." }
        ] },
      { key:"ch2",           name:"Chapter 2: Literature Review",   pct:20, description:"Systematic, critical synthesis. Identify the gap your thesis fills.",
        subsections: [
          { key:"2.1", name:"2.1 Review strategy & sources",    description:"Search terms, databases, inclusion / exclusion criteria." },
          { key:"2.2", name:"2.2 Historical development",       description:"How the field arrived at the current debate." },
          { key:"2.3", name:"2.3 Thematic analysis of prior work", description:"Organised by themes / schools / debates." },
          { key:"2.4", name:"2.4 Synthesis & gap",              description:"What is missing — your gap." },
          { key:"2.5", name:"2.5 Chapter summary",              description:"" }
        ] },
      { key:"ch3",           name:"Chapter 3: Theoretical Framework", pct:10, description:"The conceptual lens through which the study analyses its data.",
        subsections: [
          { key:"3.1", name:"3.1 Candidate theories",           description:"Which theories are relevant and why." },
          { key:"3.2", name:"3.2 Selected framework",           description:"The framework adopted, with justification." },
          { key:"3.3", name:"3.3 Operationalisation",           description:"How abstract concepts become measurable variables." },
          { key:"3.4", name:"3.4 Conceptual model & propositions", description:"Diagram + propositions to be tested." }
        ] },
      { key:"ch4",           name:"Chapter 4: Research Methodology", pct:12, description:"Detailed, replicable account of the research design.",
        subsections: [
          { key:"4.1", name:"4.1 Philosophy, paradigm & approach", description:"" },
          { key:"4.2", name:"4.2 Research design",              description:"" },
          { key:"4.3", name:"4.3 Sampling & participants",      description:"" },
          { key:"4.4", name:"4.4 Instruments & data collection",description:"" },
          { key:"4.5", name:"4.5 Data analysis techniques",     description:"" },
          { key:"4.6", name:"4.6 Validity, reliability, rigour",description:"" },
          { key:"4.7", name:"4.7 Ethical considerations",       description:"IRB / ethics board approval, informed consent, data protection." },
          { key:"4.8", name:"4.8 Limitations of the methodology", description:"" }
        ] },
      { key:"ch5",           name:"Chapter 5: Findings (Study 1)",  pct:12, description:"Present results for the first major study or research question." },
      { key:"ch6",           name:"Chapter 6: Findings (Study 2)",  pct:12, description:"Present results for the second major study or research question (delete if N/A)." },
      { key:"ch7",           name:"Chapter 7: Discussion",          pct:13, description:"Interpret the findings in light of the literature; address each RQ; explain unexpected results; defend rigour." },
      { key:"ch8",           name:"Chapter 8: Conclusions, Contributions & Future Work", pct: 9, description:"Headline contributions, theoretical and practical implications, limitations, and a forward research agenda.",
        subsections: [
          { key:"8.1", name:"8.1 Summary of findings",                    description:"" },
          { key:"8.2", name:"8.2 Theoretical contributions",              description:"What the field now knows that it didn't before." },
          { key:"8.3", name:"8.3 Methodological contributions",           description:"New instruments / approaches developed." },
          { key:"8.4", name:"8.4 Practical & policy implications",        description:"" },
          { key:"8.5", name:"8.5 Limitations",                            description:"" },
          { key:"8.6", name:"8.6 Recommendations for future research",    description:"" },
          { key:"8.7", name:"8.7 Concluding remarks",                     description:"" }
        ] },
      { key:"refs",          name:"References",                    pct: 3, description:"Complete bibliography, often hundreds of entries." },
      { key:"appendices",    name:"Appendices",                    pct: 0, description:"Instruments, transcripts, supplementary tables, code, ethics paperwork." }
    ]
  }
};

window.OUTLINE_TEMPLATES = OUTLINE_TEMPLATES;
