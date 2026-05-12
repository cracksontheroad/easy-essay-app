/* ========================================================================
 * METHODOLOGY — extracted from "Academic Writing & AI" curriculum
 * 25 chapters distilled into actionable scaffolds the app uses
 * ====================================================================== */

const METHODOLOGY = {

  /* -------- Essay types (Chapter 6, 8, 9, 10, 11, 12, 16, 17) -------- */
  essayTypes: [
    {
      id: "argumentative",
      title: "Argumentative Essay",
      chapter: 8,
      badge: "Persuade",
      summary: "Take a debatable position, support it with evidence, address counterarguments using 'They Say / I Say.'",
      keywords: ["should", "must", "ought to", "despite", "although"],
      thesisExample: "Despite claims of economic benefit, plastic water bottles should be banned because they are a major source of pollution and waste valuable resources.",
      structure: [
        { name: "Introduction", what: "Hook → background → thesis (Topic + Position + Rationale)" },
        { name: "Body 1", what: "Strongest reason (PEEL)" },
        { name: "Body 2", what: "Second reason (PEEL)" },
        { name: "Body 3", what: "Third reason (PEEL)" },
        { name: "Counterargument", what: "They Say… I Say… — acknowledge & refute the strongest opposing view" },
        { name: "Conclusion", what: "Restate thesis, summarise reasons, leave a final thought" }
      ]
    },
    {
      id: "comparative",
      title: "Comparative Essay",
      chapter: 9,
      badge: "Compare & Contrast",
      summary: "Highlight key similarities and differences between two subjects using Block or Point-by-Point structure.",
      keywords: ["whereas", "while", "both", "however", "compared to"],
      thesisExample: "While both classical and operant conditioning are learning processes, classical conditioning pairs stimuli whereas operant conditioning associates behaviour with consequences.",
      structure: [
        { name: "Introduction", what: "Introduce both subjects, state thesis with grounds for comparison" },
        { name: "Choose structure", what: "Block (all of A, then all of B) OR Point-by-Point (Point 1: A vs B, Point 2: A vs B, …)" },
        { name: "Body paragraphs", what: "Cover the same criteria for each subject" },
        { name: "Conclusion", what: "Synthesise — what does the comparison reveal? Don't just list." }
      ]
    },
    {
      id: "analytical",
      title: "Analytical Essay",
      chapter: 10,
      badge: "Analyse",
      summary: "Break down a text, idea, or dataset to reveal how it works and what it means — go beyond summary.",
      keywords: ["reveals", "demonstrates", "examines", "through", "by"],
      thesisExample: "In 'The Great Gatsby,' Fitzgerald reveals the corruption of the American Dream by examining the empty lives of the wealthy elite.",
      structure: [
        { name: "Introduction", what: "Introduce the subject + analytical claim" },
        { name: "Body paragraphs", what: "Analysis Ladder per point: Description → Analysis → Significance" },
        { name: "Conclusion", what: "What does the analysis reveal about the bigger picture?" }
      ]
    },
    {
      id: "problem-solution",
      title: "Problem-Solution Essay",
      chapter: 11,
      badge: "Solve",
      summary: "Define a real problem with evidence and propose a viable, feasible solution.",
      keywords: ["problem", "solution", "address", "solve", "effective way"],
      thesisExample: "The problem of food waste in restaurants can be solved by implementing composting programs and offering variable portion sizes to customers.",
      structure: [
        { name: "Introduction", what: "Establish the problem + thesis with proposed solution" },
        { name: "Define the problem", what: "Scope, causes, impacts — with evidence" },
        { name: "Evaluate solutions", what: "Existing attempts and their gaps" },
        { name: "Proposed solution", what: "Feasibility, evidence of effectiveness" },
        { name: "Conclusion", what: "Call to action, next steps" }
      ]
    },
    {
      id: "reflective",
      title: "Reflective Essay",
      chapter: 12,
      badge: "Reflect",
      summary: "Use metacognition and the language of reflection to examine an experience and what you learned.",
      keywords: ["I realised", "in hindsight", "this experience taught"],
      thesisExample: "Volunteering at the local food bank taught me that effective leadership relies less on directing others and more on listening carefully.",
      structure: [
        { name: "Introduction", what: "Introduce experience + insight (thesis)" },
        { name: "Description", what: "What happened — concrete details" },
        { name: "Analysis", what: "Why it matters — connect to ideas or readings" },
        { name: "Significance", what: "What you'd do differently / next" },
        { name: "Conclusion", what: "Forward-looking reflection" }
      ]
    },
    {
      id: "literature-review",
      title: "Literature Review",
      chapter: 16,
      badge: "Synthesise",
      summary: "Synthesise — don't summarise — multiple sources to map a scholarly conversation around a research question.",
      keywords: ["scholars argue", "the literature suggests", "a gap exists"],
      thesisExample: "While recent literature converges on the cognitive benefits of bilingualism, significant disagreement remains about its long-term effect on executive function in adults.",
      structure: [
        { name: "Introduction", what: "Define the research question and scope" },
        { name: "Thematic body", what: "Organise by theme (not by source). Use a Synthesis Matrix." },
        { name: "Gap & conclusion", what: "Identify the gap your research will address" }
      ]
    },
    {
      id: "research-proposal",
      title: "Research Proposal",
      chapter: 17,
      badge: "Propose",
      summary: "Pose a research question, review the literature, and outline a methodology to investigate it.",
      keywords: ["this study will investigate", "the methodology", "expected outcomes"],
      thesisExample: "This study will investigate how short-form video platforms affect adolescent attention spans by combining a 6-week classroom observation with self-reported attention surveys.",
      structure: [
        { name: "Title & abstract", what: "One-paragraph snapshot" },
        { name: "Research question", what: "Specific, answerable, significant" },
        { name: "Lit review", what: "Brief synthesis showing the gap" },
        { name: "Methodology", what: "How you will gather and analyse data" },
        { name: "Expected outcomes & timeline", what: "What you hope to find and when" }
      ]
    }
  ],

  /* -------- The Master Flowchart (Chapter 1, Syllabus) -------- */
  masterFlow: {
    asciiArt: `
      +----------------------+
      |  Essay Prompt /      |
      |  Question            |
      +----------+-----------+
                 |
                 v
      +----------------------+      Step 1: Prewriting
      |  Understand Key Terms| ---> (Define, Compare, Analyse?)
      +----------+-----------+
                 |
                 v
      +----------------------+
      |  Brainstorm Ideas    |  (mind map → thesis)
      +----------+-----------+
                 |
                 v
      +----------------------+
      |  Research & Evaluate |  (RADAR Check)
      |  Sources             |
      +----------+-----------+
                 |
                 v
      ============ Step 2: Planning ============
      Craft Thesis -> Create Outline -> Organise Evidence
                 |
                 v
      ============ Step 3: Writing =============
      Intro (Hook, Background, Thesis)
        -> Body PEEL Paragraphs
        -> Conclusion (Restate, Summarise, Final Thought)
                 |
                 v
      ============ Step 4: Polishing ===========
      Check Argument & Logic
        -> Check Paragraphs (PEEL, transitions)
        -> Check Language & Proofread
                 |
                 v
      ============ Step 5: Submitting ==========
      Formatting Check -> Bibliography -> Plagiarism Scan -> 📝 Submit
    `
  },

  /* -------- PEEL Paragraph Builder (Chapter 2) -------- */
  peel: {
    P: { label: "Point",       hint: "The topic sentence. 'This is what this paragraph proves.' Must directly support your thesis." },
    E1: { label: "Evidence",   hint: "A fact, quote, statistic, or example from a credible source. Introduce & cite it." },
    E2: { label: "Explanation", hint: "'This shows that…' Connect the evidence back to your point and overall thesis. Do not assume the reader makes the connection." },
    L:  { label: "Link",       hint: "Link to the next paragraph or back to the thesis. 'This not only shows X, but also introduces Y…' Creates flow and cohesion." }
  },

  /* -------- RADAR Source Evaluation (Chapter 5) -------- */
  radar: [
    { letter: "R", label: "Relevance",  question: "Does the source directly address your topic and question?" },
    { letter: "A", label: "Authority",  question: "Is the author an expert or qualified? Who published it?" },
    { letter: "D", label: "Date",       question: "Is the publication date suitable for your topic?" },
    { letter: "A", label: "Appearance", question: "Is it professional, well-written, with citations?" },
    { letter: "R", label: "Reason",     question: "Why was it written — to inform/teach, or to sell/persuade/entertain? Can you identify bias?" }
  ],

  /* -------- Thesis Formula (Chapter 6) -------- */
  thesis: {
    formula: "Topic + Position + Rationale = Strong Thesis",
    weakExample: "This paper is about social media.",
    strongExample: "While social media connects people, it ultimately harms teenage mental health because it promotes unrealistic comparisons, enables cyberbullying, and disrupts sleep patterns.",
    soWhatTest: "Ask yourself: 'So what?' Why does your argument matter? If the answer is obvious and important, you have a strong thesis."
  },

  /* -------- "They Say / I Say" Sentence Starters (Chapter 8 & 18) -------- */
  theySayISay: {
    theySay: [
      "Critics of this position argue that…",
      "Some people might contend that…",
      "A common concern about this solution is…",
      "It is often claimed that…"
    ],
    iSay: [
      "However, this view overlooks…",
      "While this concern is valid, it fails to account for…",
      "The evidence, however, suggests otherwise. For example…",
      "Although it is true that [opposing point], [my point] is more important because…"
    ]
  },

  /* -------- Logical Fallacies to Avoid (Chapters 4 & 5) -------- */
  fallacies: [
    { name: "Hasty Generalisation", warn: "Drawing a broad conclusion from too little evidence." },
    { name: "Loaded Words",         warn: "Using emotionally charged language to manipulate, not persuade." },
    { name: "Slippery Slope",       warn: "Claiming one small step will inevitably lead to a catastrophic outcome." },
    { name: "Either/Or (False Dichotomy)", warn: "Presenting only two options when more exist." },
    { name: "Ad Hominem",           warn: "Attacking the person instead of the argument." },
    { name: "Straw Man",            warn: "Misrepresenting an opposing view to make it easier to attack." }
  ],

  /* -------- Polishing Checklist (Master Flowchart Step 4) -------- */
  polishChecklist: [
    { id: "argClear",      group: "Argument & Logic",   text: "My thesis is clear, debatable, and passes the 'So what?' test." },
    { id: "evidenceSup",   group: "Argument & Logic",   text: "Every body paragraph supports the thesis with specific evidence." },
    { id: "counter",       group: "Argument & Logic",   text: "I have acknowledged and refuted the strongest counterargument." },
    { id: "noFallacy",     group: "Argument & Logic",   text: "I have checked for logical fallacies (hasty generalisation, slippery slope, etc.)." },

    { id: "peelEach",      group: "Paragraphs",         text: "Every body paragraph follows the PEEL structure." },
    { id: "transitions",   group: "Paragraphs",         text: "Transition phrases create flow between paragraphs." },
    { id: "topicSent",     group: "Paragraphs",         text: "Each topic sentence is a single, focused claim." },

    { id: "concise",       group: "Language & Style",   text: "I have removed wordy phrases and weak verbs (Ch. 14)." },
    { id: "hedging",       group: "Language & Style",   text: "Academic hedging language is used where appropriate (suggests, indicates, may)." },
    { id: "citations",     group: "Language & Style",   text: "Every quotation, paraphrase, and statistic is cited." },
    { id: "proofread",     group: "Language & Style",   text: "I have proofread (or used a checker) for grammar, spelling, and punctuation." },

    { id: "format",        group: "Submission",         text: "Formatting matches the assignment brief (margins, font, spacing)." },
    { id: "biblio",        group: "Submission",         text: "Bibliography / reference list is complete and consistent." },
    { id: "plagiarism",    group: "Submission",         text: "I have run a plagiarism / AI-use check and documented any AI assistance." }
  ],

  /* -------- 25-chapter Curriculum (overview) -------- */
  curriculum: [
    { part: "Part I: Foundation", n: 1,  title: "The Power of Thinking on Paper",   tool: "Master Flowchart" },
    { part: "Part I: Foundation", n: 2,  title: "The Power of a Single Paragraph",  tool: "PEEL Diagram" },
    { part: "Part I: Foundation", n: 3,  title: "The Power of a Question",          tool: "Question Funnel" },
    { part: "Part I: Foundation", n: 4,  title: "The Power of Good Logic",          tool: "Fallacy Flashcards" },
    { part: "Part I: Foundation", n: 5,  title: "Sound Logic II & RADAR",           tool: "RADAR Checklist" },
    { part: "Part I: Foundation", n: 6,  title: "The Thesis: Engine of All Essays", tool: "Thesis Templates" },
    { part: "Part I: Foundation", n: 7,  title: "Research & Note-Taking for Synthesis", tool: "Synthesis Matrix" },

    { part: "Part II: Application", n: 8,  title: "The Argumentative Essay",   tool: "Argument Outline" },
    { part: "Part II: Application", n: 9,  title: "The Comparative Essay",     tool: "Comparison Diagrams" },
    { part: "Part II: Application", n: 10, title: "The Analytical Essay",      tool: "Analysis Ladder" },
    { part: "Part II: Application", n: 11, title: "The Problem-Solution Essay", tool: "Problem-Solution Outline" },
    { part: "Part II: Application", n: 12, title: "The Reflective Essay",      tool: "Reflection Model" },
    { part: "Part II: Application", n: 13, title: "Advanced Research Techniques", tool: "Research Flowchart" },
    { part: "Part II: Application", n: 14, title: "Writing with Style",        tool: "Editing Checklist" },
    { part: "Part II: Application", n: 15, title: "Introductions & Conclusions", tool: "Intro/Conclusion Map" },
    { part: "Part II: Application", n: 16, title: "The Literature Review",     tool: "Synthesis Matrix" },
    { part: "Part II: Application", n: 17, title: "The Research Proposal",     tool: "Proposal Template" },
    { part: "Part II: Application", n: 18, title: "The 'They Say / I Say' Model", tool: "They Say/I Say Templates" },
    { part: "Part II: Application", n: 19, title: "Discipline-Specific Writing", tool: "Discipline Samples" },

    { part: "Part III: Mastery", n: 20, title: "Capstone Project Launch", tool: "Capstone Proposal" },
    { part: "Part III: Mastery", n: 21, title: "Capstone Work I",          tool: "Research workshop" },
    { part: "Part III: Mastery", n: 22, title: "Capstone Work II",          tool: "Peer Review Rubric" },
    { part: "Part III: Mastery", n: 23, title: "Capstone Work III",         tool: "Final Checklist" },
    { part: "Part III: Mastery", n: 24, title: "Presentation Skills",       tool: "Presentation Rubric" },
    { part: "Part III: Mastery", n: 25, title: "Course Wrap-up & Future-Proofing", tool: "Portfolio Guide" }
  ],

  /* -------- AI Coach system prompt (used for all providers) -------- */
  coachSystem: `You are the Easy Essay Coach, modelled on the "Academic Writing & AI" curriculum for university-bound students.

Core philosophy: Writing is organised thinking. The essay is the architecture of an idea.

You must always:
- Reference the curriculum's frameworks when relevant: Master Flowchart (Prewriting → Planning → Writing → Polishing → Submitting), PEEL paragraph (Point, Evidence, Explanation, Link), RADAR source evaluation (Relevance, Authority, Date, Appearance, Reason), Thesis formula (Topic + Position + Rationale), the "So what?" test, "They Say / I Say" for counterarguments, and the Analysis Ladder (Description → Analysis → Significance).
- Coach, do not ghostwrite. Generate possibilities, examples, and critique, but push the student to make the final choices. Critical thinking is always applied to AI output.
- Be specific and actionable. When critiquing, point to the exact sentence or paragraph and the specific principle being violated.
- Use plain academic English suitable for a B2/C1 ESL learner. Make implicit academic conventions explicit. Hedge appropriately.
- Watch for and call out logical fallacies (hasty generalisation, slippery slope, either/or, ad hominem, straw man, loaded words).
- When students draft, ask reflective metacognitive questions ("why this evidence? what does it prove?") before giving the answer.

Format your responses with short paragraphs and clear sub-headings when helpful. Cite the chapter or framework you are applying.`,

  /* -------- Step content (rendered in the workspace stage) -------- */
  steps: [
    { key:"setup",     title:"1 · Project Setup",       tag:"Brief",        summary:"Capture the assignment basics: title, course, degree level, word count, deadline, citation style, and the essay brief itself.", chapters:[1] },
    { key:"brief",     title:"2 · Brief Breakdown",     tag:"Decode",       summary:"Decode the brief — command words, audience, scope, constraints, and success criteria.",                                         chapters:[1,3] },
    { key:"rubric",    title:"3 · Rubric & Criteria",   tag:"Standards",    summary:"Paste your marking rubric (or pick a template). The criteria drive every later check.",                                       chapters:[1,25] },
    { key:"questions", title:"4 · Research Questions",  tag:"Inquiry",      summary:"Turn the brief and your initial idea into 3–6 candidate research questions. Score and pick a favourite.",                    chapters:[3] },
    { key:"type",      title:"5 · Essay Type",          tag:"Form",         summary:"Based on your chosen research question, the app recommends the essay type that best fits. Confirm or override.",             chapters:[6,8,9,10,11,12,16,17] },
    { key:"sources",   title:"6 · Sources (RADAR)",     tag:"Evidence",     summary:"Add candidate sources. Run each through the RADAR checklist before deciding to use it.",                                       chapters:[5,7,13] },
    { key:"thesis",    title:"7 · Thesis",              tag:"Engine",       summary:"Build a strong thesis: Topic + Position + Rationale. Run the 'So what?' test.",                                                chapters:[6] },
    { key:"outline",   title:"8 · Outline",             tag:"Blueprint",    summary:"Lay out the architecture of the essay with word-count allocation per section.",                                              chapters:[6,8,9,10,11,12,15] },
    { key:"writing",   title:"9 · Drafting (PEEL)",     tag:"Compose",      summary:"Write the introduction, PEEL body paragraphs, They Say / I Say counterargument, and conclusion.",                            chapters:[2,8,15,18] },
    { key:"polishing", title:"10 · Polishing",          tag:"Refine",       summary:"Run the polishing checklist — argument, paragraphs, language, fallacies, citations.",                                         chapters:[4,14] },
    { key:"final",     title:"11 · Final & Export",     tag:"Submit",       summary:"Final submission checks. Download, copy, or push to Notion. Integrity log included.",                                         chapters:[25] }
  ],

  /* -------- Degree levels (from kimi-easy-essay) -------- */
  degreeLevels: [
    { id: "foundation",    label: "Foundation / Pre-University" },
    { id: "undergraduate", label: "Undergraduate" },
    { id: "postgraduate",  label: "Postgraduate (Masters)" },
    { id: "doctoral",      label: "Doctoral / PhD" }
  ],

  /* -------- Citation styles -------- */
  citationStyles: [
    "APA 7th", "MLA 9th", "Harvard", "Chicago 17th",
    "IEEE", "Vancouver", "OSCOLA", "Other"
  ],

  /* -------- Brief-breakdown framework (Ch.1, Ch.3) -------- */
  briefBreakdown: {
    commandWords: [
      { word: "Argue / Persuade",       maps: "argumentative" },
      { word: "Compare / Contrast",     maps: "comparative" },
      { word: "Analyse / Examine",      maps: "analytical" },
      { word: "Evaluate",               maps: "argumentative" },
      { word: "Discuss / Explore",      maps: "analytical" },
      { word: "Define / Describe",      maps: "analytical" },
      { word: "How can we / Propose",   maps: "problem-solution" },
      { word: "Reflect / Recount",      maps: "reflective" },
      { word: "Review the literature",  maps: "literature-review" },
      { word: "Propose / Investigate",  maps: "research-proposal" }
    ],
    fields: [
      "Command words you spotted",
      "Audience (who reads this?)",
      "Scope (timeframe, geography, discipline)",
      "Constraints (word count, banned sources, format)",
      "Success criteria (what does 'top mark' look like?)"
    ]
  },

  /* -------- Rubric templates -------- */
  rubricTemplates: [
    {
      id: "generic-uk-ug",
      label: "Generic UK Undergraduate (1st–3rd)",
      criteria: [
        { name: "Argument & Thesis",        weight: 25, descriptor: "Clear, original, debatable thesis with a developed line of argument." },
        { name: "Evidence & Use of Sources", weight: 25, descriptor: "Wide range of credible sources, integrated with critical commentary, fully cited." },
        { name: "Analysis & Synthesis",     weight: 20, descriptor: "Goes beyond description to analyse and synthesise across sources." },
        { name: "Structure & Coherence",    weight: 15, descriptor: "Logical structure, clear paragraphs (PEEL), signposting and transitions." },
        { name: "Style & Mechanics",        weight: 15, descriptor: "Academic register, accurate grammar, consistent citation style." }
      ]
    },
    {
      id: "ib-extended-essay",
      label: "IB Extended Essay (paraphrased)",
      criteria: [
        { name: "Focus & Method",     weight: 17, descriptor: "Clear research question and appropriate methodology." },
        { name: "Knowledge & Understanding", weight: 17, descriptor: "Demonstrates subject knowledge and contextual awareness." },
        { name: "Critical Thinking",  weight: 33, descriptor: "Research, analysis, discussion, and evaluation." },
        { name: "Presentation",       weight: 13, descriptor: "Layout, citation, formatting." },
        { name: "Engagement",         weight: 20, descriptor: "Process reflection (RPPF-style)." }
      ]
    },
    {
      id: "argumentative-essay-rubric",
      label: "Argumentative Essay (curriculum default)",
      criteria: [
        { name: "Thesis & Position",  weight: 20, descriptor: "Topic + Position + Rationale; passes 'So what?' test." },
        { name: "Evidence",           weight: 25, descriptor: "Specific, credible, well-cited; RADAR-evaluated." },
        { name: "Counterargument",    weight: 20, descriptor: "Strongest opposing view fairly stated and refuted (They Say / I Say)." },
        { name: "Paragraph Craft",    weight: 20, descriptor: "Every body paragraph follows PEEL." },
        { name: "Style & Mechanics",  weight: 15, descriptor: "Concise, hedged, academic register." }
      ]
    },
    {
      id: "comparative-essay-rubric",
      label: "Comparative Essay (curriculum default)",
      criteria: [
        { name: "Grounds for Comparison", weight: 20, descriptor: "Clear reason for comparing the two subjects." },
        { name: "Balanced Coverage",      weight: 25, descriptor: "Each subject receives equivalent attention across the same criteria." },
        { name: "Synthesis",              weight: 20, descriptor: "Conclusion synthesises rather than lists." },
        { name: "Structure",              weight: 20, descriptor: "Block vs Point-by-Point used purposefully." },
        { name: "Style & Mechanics",      weight: 15, descriptor: "Comparative language used precisely." }
      ]
    },
    {
      id: "analytical-essay-rubric",
      label: "Analytical Essay (curriculum default)",
      criteria: [
        { name: "Analytical Claim",   weight: 20, descriptor: "Goes beyond summary to make an analytical claim." },
        { name: "Description→Analysis→Significance", weight: 25, descriptor: "Each section climbs the Analysis Ladder." },
        { name: "Evidence",           weight: 20, descriptor: "Close reading, with specific textual or data evidence." },
        { name: "Coherence",          weight: 20, descriptor: "Sub-claims connect to the overall analytical thesis." },
        { name: "Style & Mechanics",  weight: 15, descriptor: "Precise, hedged academic prose." }
      ]
    }
  ],

  /* -------- Research-question scoring (kimi-style 5 criteria) -------- */
  rqCriteria: [
    { id: "specificity",   label: "Specificity",   help: "Is the question precise about who, what, where, and when?" },
    { id: "researchability", label: "Researchability", help: "Could you actually find evidence to answer it within the timeframe?" },
    { id: "significance",  label: "Significance",  help: "Does it matter? Does it survive the 'So what?' test?" },
    { id: "arguability",   label: "Arguability",   help: "Could a reasonable person disagree? Is there a debate to enter?" },
    { id: "scope",         label: "Scope",         help: "Is it narrow enough for the word count, broad enough for analysis?" }
  ],

  /* -------- Question-type heuristics for essay-type recommendation -------- */
  // Each rule has a regex tested against the chosen research question.
  // First match wins (rules are ordered most-specific first).
  typeHeuristics: [
    { rx: /\b(literature|state of the field|what does the literature say)\b/i,                       type: "literature-review", why: "The question is asking what the existing literature already says." },
    { rx: /\b(propose|design a study|investigate.*using|methodology|hypothesi[sz]e)\b/i,             type: "research-proposal", why: "The question is proposing a study or method rather than answering one." },
    { rx: /\b(reflect|what did I learn|recount|my experience|in hindsight)\b/i,                      type: "reflective",        why: "The question centres on personal experience and learning." },
    { rx: /\b(how can|how could|what should be done|address|solve|reduce|fix|combat)\b/i,            type: "problem-solution",  why: "The question frames a problem and asks for a solution." },
    { rx: /\b(compare|contrast|versus|vs\.?|differ|similar|how do .* and .* differ)\b/i,             type: "comparative",       why: "The question asks for comparison or contrast between two or more subjects." },
    { rx: /\b(should|must|ought to|is it ethical|is it justifiable|to what extent.*right|justify)\b/i, type: "argumentative",    why: "The question invites a debatable position." },
    { rx: /\b(analy[sz]e|examine|how does|what role|to what extent|in what ways|why does)\b/i,       type: "analytical",        why: "The question asks for analysis — breaking down to reveal meaning." },
    { rx: /\b(discuss|explore|consider|evaluate)\b/i,                                                type: "argumentative",     why: "Open prompts most often want a developed position with evaluation." }
  ],

  /* -------- Integrity-log action labels -------- */
  integrityActions: {
    BRIEF_PARSE:  "Brief decoded",
    RUBRIC_SET:   "Rubric saved",
    RQ_GENERATE:  "Research questions generated (AI)",
    RQ_SELECT:    "Research question selected",
    TYPE_RECOMMEND:"Essay type recommended",
    TYPE_OVERRIDE:"Essay type overridden",
    SOURCE_ADD:   "Source added",
    SOURCE_RADAR: "Source RADAR-evaluated",
    THESIS_SAVE:  "Thesis saved",
    OUTLINE_SAVE: "Outline saved",
    PEEL_SAVE:    "PEEL paragraph saved",
    COACH_CALL:   "AI coach consulted",
    EXPORT_LOCAL: "Exported locally",
    EXPORT_NOTION:"Pushed to Notion"
  }
};

/* ========================================================================
 * Helper: recommend an essay type from a research question
 * Returns { typeId, why } — falls back to 'argumentative' if nothing matches.
 * ====================================================================== */
function recommendEssayType(question) {
  if (!question || !question.trim()) return null;
  for (const rule of METHODOLOGY.typeHeuristics) {
    if (rule.rx.test(question)) {
      const t = METHODOLOGY.essayTypes.find(x => x.id === rule.type);
      return { typeId: rule.type, type: t, why: rule.why };
    }
  }
  const fallback = METHODOLOGY.essayTypes.find(x => x.id === "argumentative");
  return { typeId: "argumentative", type: fallback, why: "No strong signal in the question — defaulting to an argumentative form, which can accommodate most open prompts." };
}
window.recommendEssayType = recommendEssayType;
