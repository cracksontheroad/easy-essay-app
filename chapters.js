/* ========================================================================
 * CHAPTER CONTENT — distilled from the 25-chapter "Academic Writing & AI"
 * curriculum. Each entry contains:
 *   n            chapter number
 *   part         which part of the course
 *   title        chapter title
 *   tool         the master visual / tool introduced
 *   goal         one-sentence chapter goal (the "Your Goal" line)
 *   keyConcepts  array of headline ideas
 *   framework    object describing the chapter's master visual
 *   workedExample short worked example
 *   apply        one-paragraph "how to use this now" guidance
 *   homework     one-line homework task
 *   chineseAnnotation  the bilingual gloss used in the curriculum (kept for ESL learners)
 * ====================================================================== */

const CHAPTERS = [
  {
    n: 1,
    part: "Part I: Foundation",
    title: "The Power of Thinking on Paper",
    tool: "Master Flowchart",
    infographic: "master-flowchart",
    goal: "Change how you see writing and equip you with the tools you will use all year — writing as the physical architecture of thought.",
    chineseAnnotation: "纸上思考的力量 (Zhǐ shàng sīkǎo de lìliàng)",
    keyConcepts: [
      "Writing is organised thinking — we don't just write to demonstrate what we know; we write to discover what we think.",
      "The architect metaphor: the best writing is a strong, well-designed structure, not a pile of ideas.",
      "AI as a collaborative tool: a brainstorming partner, a research assistant, and an editorial helper — never a ghostwriter.",
      "Critical thinking is always applied to AI output: students must evaluate, refine, and take ownership of every idea."
    ],
    framework: {
      name: "The Master Flowchart",
      description: "The big-picture map for the entire writing process. Five sequential steps, each subdivided into concrete actions.",
      steps: [
        "Step 1 — Prewriting: understand key terms, brainstorm ideas, research & evaluate sources with RADAR.",
        "Step 2 — Planning: craft thesis, create outline, organise evidence.",
        "Step 3 — Writing: introduction, PEEL body paragraphs, conclusion.",
        "Step 4 — Polishing: check argument & logic, paragraphs, language, proofread.",
        "Step 5 — Submitting: formatting check, bibliography, plagiarism scan, submit."
      ]
    },
    workedExample: "Topic: 'Should schools have uniforms?'\nManual brainstorm: a teacher asks the class; ideas trickle out slowly.\nAI brainstorm: the same question to DeepSeek — ideas appear in seconds.\nKey takeaway: AI gives you raw clay. You are the sculptor — your job is to shape those ideas into something that is genuinely yours.",
    apply: "At the start of every essay, identify which step of the Master Flowchart you are on. This reduces anxiety and breaks the daunting task of 'write an essay' into a sequence of clear, manageable actions. Pin the flowchart somewhere visible while you work.",
    homework: "Set up the digital toolbelt (Quillbot, Notion, an AI tool) and create a Notion school page with sub-pages for every subject."
  },

  {
    n: 2,
    part: "Part I: Foundation",
    title: "The Power of a Single Paragraph",
    tool: "PEEL Diagram",
    infographic: "peel",
    goal: "Master the building block of every essay — the PEEL paragraph — so that every paragraph proves a single point with evidence and links forward.",
    chineseAnnotation: "段落的力量 (Duànluò de lìliàng)",
    keyConcepts: [
      "The paragraph is the smallest unit of meaning in academic prose.",
      "Every body paragraph in every essay type is a PEEL paragraph.",
      "Most weak student essays fail at the explanation step — they assume the reader can make the connection between evidence and point.",
      "Topic sentences are not flexible: a paragraph must prove exactly what its first sentence claims."
    ],
    framework: {
      name: "PEEL Paragraph",
      description: "Four moves that together make one body paragraph.",
      steps: [
        "(P) Point — the topic sentence. 'This is what this paragraph proves.' Must directly support the thesis.",
        "(E) Evidence — a fact, quote, statistic, or example from a credible source. Introduce and cite it.",
        "(E) Explanation — 'This shows that…' Connect the evidence back to your point and the thesis. Never assume the reader makes the connection.",
        "(L) Link — to the next paragraph or back to the thesis. 'This not only shows X, but also introduces Y…'"
      ]
    },
    workedExample: "Point: Social media disrupts adolescent sleep.\nEvidence: A 2023 UK cohort study found 70% of teens used phones after bedtime; those who did averaged 47 fewer minutes of sleep (RCPCH, 2023).\nExplanation: This shows the design of platforms — push notifications, autoplay — interferes with the developmental need for 9 hours of sleep.\nLink: Disrupted sleep is one channel for harm; the next paragraph examines the second.",
    apply: "Before writing any body paragraph, write the four PEEL boxes on paper or on screen and fill them in one at a time. Only when all four are present and strong do you join them into prose.",
    homework: "Choose a body paragraph from a published article. Box out its P, E, E, and L. Then rewrite a weaker paragraph of your own using the same template."
  },

  {
    n: 3,
    part: "Part I: Foundation",
    title: "The Power of a Question",
    tool: "Question Funnel",
    goal: "Move from a broad topic to a single, focused, researchable question — the engine that will drive the rest of your writing.",
    chineseAnnotation: "提问的力量 (Tíwèn de lìliàng)",
    keyConcepts: [
      "Most essay failures begin upstream — at the question, not the prose.",
      "A good research question is Specific, Researchable, Significant, Arguable, and within Scope (SRSAS).",
      "Command words (analyse, compare, evaluate, argue) dictate the essay type before you write a word.",
      "Epistemology matters: knowing what kind of question you are asking changes what counts as a good answer."
    ],
    framework: {
      name: "The Question Funnel",
      description: "Narrow a vague topic into a question that can actually be answered with evidence.",
      steps: [
        "Topic — the broad subject (e.g. social media).",
        "Aspect — the part of the topic you care about (e.g. effect on adolescents).",
        "Angle — the specific debate or mechanism (e.g. algorithmic feeds and sleep).",
        "Question — single-sentence, question-marked, answerable within the word count."
      ]
    },
    workedExample: "Topic: AI in education.\nAspect: Use of large-language models for essay writing.\nAngle: Effect on students' independent reasoning.\nQuestion: 'To what extent does habitual use of generative AI for essay drafting weaken first-year undergraduates' independent reasoning skills?'",
    apply: "Whenever you receive an essay brief, run the topic through the funnel before doing anything else. A clear question saves hours of misdirected research.",
    homework: "Take a topic you care about; write five candidate research questions; score each on SRSAS; pick the strongest."
  },

  {
    n: 4,
    part: "Part I: Foundation",
    title: "The Power of Good Logic",
    tool: "Fallacy Flashcards",
    goal: "Recognise the most common logical fallacies in your own writing and in the sources you cite — and avoid them.",
    chineseAnnotation: "良好逻辑的力量",
    keyConcepts: [
      "A logically valid argument is one in which the conclusion follows from the premises.",
      "Most popular argument is logically faulty — the goal is not to win arguments but to think clearly.",
      "Fallacy detection is a habit, not a one-off skill: train it on every paragraph you write."
    ],
    framework: {
      name: "The Fallacy Flashcards",
      description: "A pack of named fallacies to recognise and reject. The most common in student writing:",
      steps: [
        "Hasty Generalisation — drawing a broad conclusion from too little evidence.",
        "Loaded Words — emotionally charged language used to manipulate rather than persuade.",
        "Either/Or (False Dichotomy) — presenting only two options when more exist.",
        "Ad Hominem — attacking the person rather than the argument.",
        "Straw Man — misrepresenting an opposing view to make it easier to attack.",
        "Appeal to Authority — citing someone whose authority is irrelevant to the claim."
      ]
    },
    workedExample: "Faulty: 'Three of my classmates think AI is bad, so AI is bad.' (Hasty generalisation.)\nFixed: 'A peer-reviewed survey of 1,200 students (Smith, 2024) found 62% reporting concern about AI in education, suggesting a sizeable but not universal disquiet.'",
    apply: "After drafting any paragraph, scan it for the six common fallacies. If you find one, rewrite the paragraph with stronger evidence or a more honest framing.",
    homework: "Find one news editorial. Identify at least two fallacies; rewrite one paragraph to fix them."
  },

  {
    n: 5,
    part: "Part I: Foundation",
    title: "The Power of Sound Logic II & RADAR",
    tool: "RADAR Checklist",
    infographic: "radar",
    goal: "Evaluate every source with RADAR before deciding to use it — because the evidence in your argument can only be as strong as the source it comes from.",
    chineseAnnotation: "可靠论证与RADAR (Kěkào lùnzhèng yǔ RADAR)",
    keyConcepts: [
      "Fallacy detection (Ch.4) makes your own logic sound; RADAR makes your sources sound.",
      "A perfectly logical argument built on bad sources is still a bad argument.",
      "Source evaluation is a decision flow, not a vibe check — RADAR is the checklist."
    ],
    framework: {
      name: "RADAR — Source Evaluation",
      description: "Five gates every source must pass before you use it.",
      steps: [
        "R — Relevance: does the source directly address your question?",
        "A — Authority: is the author qualified? Who published it?",
        "D — Date: is the publication date suitable for the topic?",
        "A — Appearance: is it professional, well-written, with citations?",
        "R — Reason for writing: to inform/teach, or to sell/persuade/entertain? Can you identify bias?"
      ]
    },
    workedExample: "Source A: peer-reviewed paper in Journal of Adolescent Research.\nRelevance: directly addresses topic ✓\nAuthority: tenured academic ✓\nDate: 2023 ✓\nAppearance: full citations, journal formatting ✓\nReason: to inform ✓ → APPROVED.\n\nSource B: opinion blog post by anonymous author, 2018.\nRelevance ✓; Authority ✗; Date borderline; Reason: persuasion → REJECT.",
    apply: "Run every source through RADAR before adding it to your bibliography. Keep a one-line RADAR note next to each source in your reference manager.",
    homework: "Compare a peer-reviewed article and a viral op-ed on the same topic; run both through RADAR and explain which you would cite and why."
  },

  {
    n: 6,
    part: "Part I: Foundation",
    title: "The Thesis — The Engine of All Essays",
    tool: "Thesis Templates",
    infographic: "thesis-formula",
    goal: "Craft a strong, arguable thesis using the formula Topic + Position + Rationale — the central argument that controls every paragraph that follows.",
    chineseAnnotation: "论文陈述：所有文章的核心 (Lùnwén chénshù: Suǒyǒu wénzhāng de héxīn)",
    keyConcepts: [
      "A thesis is not a fact; it is an arguable claim that the rest of the essay defends.",
      "The formula: Topic + Position + Rationale = Strong Thesis.",
      "Different essay types require different thesis shapes — the command word in the prompt tells you which.",
      "Every thesis must pass the 'So what?' test."
    ],
    framework: {
      name: "Thesis Generator",
      description: "Build a thesis from three components.",
      steps: [
        "Topic — what are you writing about?",
        "Position — your debatable stance.",
        "Rationale — the three key reasons (these become body paragraphs).",
        "Combine — one or two sentences with transitions."
      ]
    },
    workedExample: "Topic: social media + adolescents.\nPosition: net harmful.\nRationale: social comparison, cyberbullying, sleep disruption.\nThesis: 'While social media connects people, it ultimately harms teenage mental health because it promotes unrealistic comparisons, enables cyberbullying, and disrupts sleep patterns.'",
    apply: "Before writing any essay, generate three candidate theses using the formula and choose the strongest. If your thesis answers 'So what?' with 'Because it matters that…' — you're ready to outline.",
    homework: "Write five thesis statements, each for a different essay type (argumentative, comparative, analytical, problem-solution, reflective)."
  },

  {
    n: 7,
    part: "Part I: Foundation",
    title: "Research & Note-Taking for Synthesis",
    tool: "Synthesis Matrix",
    goal: "Move from collecting quotes to synthesising sources — the difference between a summary and a literature review.",
    chineseAnnotation: "研究与综合 (Yánjiū yǔ zōnghé)",
    keyConcepts: [
      "Summary lists what sources say; synthesis shows how sources relate to one another.",
      "The Synthesis Matrix is a grid: rows = sources, columns = themes.",
      "Cornell-style notes split each page into source, key idea, your reaction.",
      "Annotated bibliographies are the rough-draft form of a literature review."
    ],
    framework: {
      name: "Synthesis Matrix",
      description: "A 2-D grid that surfaces where sources agree, disagree, or leave gaps.",
      steps: [
        "List your sources down the left column.",
        "List your themes / claims across the top.",
        "Fill each cell with a one-line note: what does this source say about this theme?",
        "Read columns down: now you can see the conversation.",
        "Use this directly to draft thematic paragraphs."
      ]
    },
    workedExample: "Sources: Twenge et al. (2018), Bail (2021), Cinelli et al. (2021).\nThemes: Effect on mental health | Polarisation | Mechanism.\nFilling the grid reveals that all three address mechanism but only Cinelli addresses polarisation specifically — that gap may become a paragraph in your essay.",
    apply: "Build a synthesis matrix in Notion or Google Sheets for every literature-heavy essay. Each row is a source; each column is a theme from your thesis.",
    homework: "Choose 5 sources on a topic; build a synthesis matrix with at least 3 themes; identify one gap."
  },

  {
    n: 8,
    part: "Part II: Application",
    title: "The Argumentative Essay",
    tool: "Argument Outline",
    goal: "Synthesise every skill so far — thesis, logic, sources, paragraphs — into a complete, persuasive argumentative essay.",
    chineseAnnotation: "议论文 (Yìlùnwén)",
    keyConcepts: [
      "An argumentative essay is your chance to be a lawyer for your ideas.",
      "Four moves: state a clear position; present your evidence; acknowledge the opposition; refute it.",
      "The goal is not to 'win' but to persuade through respectful, evidence-based reasoning."
    ],
    framework: {
      name: "Argument Outline",
      description: "The blueprint for every argumentative essay.",
      steps: [
        "Introduction with thesis (Topic + Position + Rationale).",
        "Body 1 — strongest reason (PEEL).",
        "Body 2 — second reason (PEEL).",
        "Body 3 — third reason (PEEL).",
        "Counterargument — They Say / I Say.",
        "Conclusion — restate, summarise, final thought."
      ]
    },
    workedExample: "See the foundation-level sample essay in the Examples tab. The whole structure — intro funnel, three PEEL bodies, They Say / I Say counter, conclusion — is precisely the model from this chapter.",
    apply: "Use the Outline Workshop template in Step 8 of the app. Fill in the thesis, the three points, and the counterargument before writing a word of prose.",
    homework: "Deconstruct an op-ed: find its thesis, points, and counterargument. Then build an outline of your own argumentative essay."
  },

  {
    n: 9,
    part: "Part II: Application",
    title: "The Comparative Essay",
    tool: "Block vs Point-by-Point Comparison Diagrams",
    infographic: "comparative",
    goal: "Highlight key similarities and differences between two subjects using a structure that fits the topic — not just listing facts.",
    chineseAnnotation: "比较类文章 (Bǐjiào lèi wénzhāng)",
    keyConcepts: [
      "Comparative essays must have a clear ground for comparison — why these two subjects?",
      "Two structures: Block (all of A, then all of B) or Point-by-Point (point 1: A vs B; point 2: A vs B…).",
      "Block is fine for short or simple comparisons; Point-by-Point forces deeper analysis.",
      "The conclusion must synthesise — never just list what you compared."
    ],
    framework: {
      name: "Block vs Point-by-Point",
      description: "Two structural choices for organising a comparative essay.",
      steps: [
        "Block — Intro with thesis → all about Subject A (points 1, 2, 3) → all about Subject B (points 1, 2, 3) → Conclusion (synthesise).",
        "Point-by-Point — Intro with thesis → Body 1 (Point 1: A vs B) → Body 2 (Point 2: A vs B) → Body 3 (Point 3: A vs B) → Conclusion."
      ]
    },
    workedExample: "Comparing classical and operant conditioning, Point-by-Point: Body 1: stimulus type (paired vs consequence-based); Body 2: timing of association; Body 3: applied examples (Pavlov vs Skinner).",
    apply: "Choose structure based on complexity: if you can compare on a single feature at a time, Point-by-Point. Otherwise Block.",
    homework: "Write a comparative thesis. Sketch outlines for both Block and Point-by-Point. Choose which fits better and justify in one sentence."
  },

  {
    n: 10,
    part: "Part II: Application",
    title: "The Analytical Essay",
    tool: "Analysis Ladder",
    infographic: "analysis-ladder",
    goal: "Move beyond summary to analysis — break down a text, idea, or dataset to reveal how it works and what it means.",
    chineseAnnotation: "分析类文章 (Fēnxī lèi wénzhāng)",
    keyConcepts: [
      "Summary tells the reader what something says; analysis tells them what it means.",
      "The Analysis Ladder has three rungs: Description → Analysis → Significance.",
      "Description without significance is journalism; significance without description is unsupported claim."
    ],
    framework: {
      name: "The Analysis Ladder",
      description: "Climb every paragraph through three levels.",
      steps: [
        "Description — what does the text/data/idea actually do or contain?",
        "Analysis — how does it do it? What patterns, structures, or choices are at work?",
        "Significance — why does this matter? What does it tell us about the bigger picture?"
      ]
    },
    workedExample: "Analysing The Great Gatsby's symbolism of the green light.\nDescription: Gatsby reaches toward a green light at the end of Daisy's dock.\nAnalysis: The light is geographically across water, recurring at moments of yearning, and switches off when Gatsby is in Daisy's presence.\nSignificance: Fitzgerald uses the light to symbolise the structural impossibility of the American Dream — visible, unreachable, illusory.",
    apply: "For every body paragraph in an analytical essay, ensure you climb all three rungs. If a paragraph stops at description, it's incomplete.",
    homework: "Pick one symbol or motif from a text you know well. Write a single PEEL paragraph that climbs all three rungs of the Analysis Ladder."
  },

  {
    n: 11,
    part: "Part II: Application",
    title: "The Problem-Solution Essay",
    tool: "Problem-Solution Outline",
    goal: "Define a real problem with evidence and propose a viable, feasible solution.",
    chineseAnnotation: "问题解决类文章 (Wèntí jiějué lèi wénzhāng)",
    keyConcepts: [
      "Half the work is defining the problem precisely — scope, causes, who is affected.",
      "Evaluate existing attempts before proposing your own solution.",
      "A good solution is specific, feasible, and supported by evidence of effectiveness elsewhere."
    ],
    framework: {
      name: "Problem-Solution Outline",
      description: "A four-part structure that earns its proposed solution.",
      steps: [
        "Introduction — establish the problem and your thesis with proposed solution.",
        "Define the problem — scope, causes, impacts (with evidence).",
        "Evaluate existing solutions — what has been tried; why it falls short.",
        "Propose your solution — what it is, why it works, evidence of feasibility.",
        "Conclusion — call to action; next steps."
      ]
    },
    workedExample: "Problem: restaurant food waste.\nExisting: portion-control software has reduced waste by 8% in trials but is expensive.\nProposal: combine composting programmes with variable portion sizing — addresses both supply and demand, low capital cost, evidence from Copenhagen pilot (2022).",
    apply: "Use the Problem-Solution outline template in Step 8 of the app. Allocate twice as many words to the problem and your proposed solution as to existing attempts.",
    homework: "Pick a problem at your school. Define it in three sentences; identify two existing attempts and their limits; propose your solution in one PEEL paragraph."
  },

  {
    n: 12,
    part: "Part II: Application",
    title: "The Reflective Essay",
    tool: "Reflection Model",
    goal: "Use metacognition and the language of reflection to examine an experience — what happened, what it means, what you learned.",
    chineseAnnotation: "反思类文章 (Fǎnsī lèi wénzhāng)",
    keyConcepts: [
      "Reflective writing is the opposite of recount — the experience is the prompt, not the point.",
      "The Reflection Model: Description → Analysis → Significance → Forward action.",
      "Reflective essays use 'I' and active voice — but never become diary entries."
    ],
    framework: {
      name: "The Reflection Model",
      description: "A four-stage structure for reflective essays.",
      steps: [
        "Description — what happened, briefly and concretely.",
        "Analysis — why this matters. Connect to a theory, course concept, or reading.",
        "Significance — what does this reveal about you, your assumptions, your context?",
        "Forward action — what will you do differently, and why?"
      ]
    },
    workedExample: "Description: I led the group science project; we missed the deadline.\nAnalysis: I rushed to delegate before checking strengths; in Tuckman's framework we never reached the 'norming' stage.\nSignificance: I had assumed leadership was direction, not listening.\nForward action: In the next project I will run a 20-minute strengths-mapping session before any task allocation.",
    apply: "Avoid the trap of pure recount — for every paragraph, ask 'so what does this mean?' before moving on.",
    homework: "Pick a recent task that did not go as expected. Write one reflective paragraph hitting all four stages."
  },

  {
    n: 13,
    part: "Part II: Application",
    title: "Advanced Research Techniques",
    tool: "Research Flowchart",
    goal: "Move from a Google search to a structured research process — Boolean operators, citation chaining, database literacy.",
    chineseAnnotation: "高级研究技巧 (Gāojí yánjiū jìqiǎo)",
    keyConcepts: [
      "Boolean operators (AND, OR, NOT, quotation marks, wildcards) narrow and broaden searches deliberately.",
      "Citation chaining — backwards (the references in a key paper) and forwards (papers that cite it) — finds the conversation around a key source.",
      "Specialist databases (JSTOR, Google Scholar, PubMed, Web of Science) outperform open web for academic work."
    ],
    framework: {
      name: "The Research Flowchart",
      description: "Five steps from question to vetted reading list.",
      steps: [
        "Translate the question into 3–5 key search terms.",
        "Combine with Boolean operators.",
        "Run on at least 2 academic databases.",
        "Skim abstracts; bookmark the 5 most relevant.",
        "Chain backwards (their references) and forwards (who cited them)."
      ]
    },
    workedExample: "Question: algorithmic feeds and adolescents.\nTerms: (algorithm* OR 'recommender system') AND ('social media' OR 'feed*') AND (adolescen* OR teen*) AND ('mental health' OR depress*).\nDatabases: Google Scholar + Web of Science.",
    apply: "Spend 60 minutes on focused database search before writing any literature review. The two extra databases reliably surface sources you would not find through web search alone.",
    homework: "For your current research question, build the Boolean string and run it across two databases. Save the top 5 results to your synthesis matrix."
  },

  {
    n: 14,
    part: "Part II: Application",
    title: "Writing with Style",
    tool: "Editing Checklist",
    goal: "Tighten your prose — concision, clarity, strong verbs, and the difference between academic register and stuffiness.",
    chineseAnnotation: "风格写作 (Fēnggé xiězuò)",
    keyConcepts: [
      "Strong verbs do work that weak nouns can't: 'analyse' is better than 'do an analysis of'.",
      "Concision is not the same as brevity — every word should earn its place.",
      "Academic register hedges (suggests, indicates, may) where the evidence warrants it.",
      "Read your prose aloud — most awkward sentences reveal themselves to the ear."
    ],
    framework: {
      name: "Editing Checklist",
      description: "A pass through your draft hunting eight habits.",
      steps: [
        "Remove 'in order to', 'the fact that', 'due to the fact that'.",
        "Replace 'shows' / 'is' chains with stronger verbs.",
        "Cut every 'very', 'really', 'quite'.",
        "Replace passive voice with active where it adds clarity.",
        "Hedge claims that exceed the evidence.",
        "Vary sentence length — short sentences land hard; long sentences carry nuance.",
        "Check signposting between paragraphs.",
        "Read aloud — fix anything you stumble on."
      ]
    },
    workedExample: "Before: 'Due to the fact that there has been a significant increase in the use of social media by adolescents, it is highly important to do an analysis of its effects.'\nAfter: 'Adolescents' growing use of social media demands serious analysis of its effects.'",
    apply: "Run the editing checklist on every paragraph the day after you draft it — distance makes the habits easier to spot.",
    homework: "Pick a 200-word paragraph from your current draft. Apply the full checklist. Track how many words you cut without losing meaning."
  },

  {
    n: 15,
    part: "Part II: Application",
    title: "Introductions & Conclusions",
    tool: "Intro/Conclusion Map",
    goal: "Open and close essays in a way that earns the reader's attention and locks in your contribution.",
    chineseAnnotation: "引言与结论 (Yǐnyán yǔ jiélùn)",
    keyConcepts: [
      "The introduction is a funnel: hook → background → thesis.",
      "The conclusion is a reverse funnel: restate thesis → summarise reasons → final thought.",
      "Avoid two failure modes: 'In this essay I will…' (telling rather than doing) and the abrupt cut-off conclusion.",
      "Conclusions never introduce new evidence."
    ],
    framework: {
      name: "Intro/Conclusion Map",
      description: "Mirrored funnels.",
      steps: [
        "Intro — Hook (vivid example, surprising fact, provocative question).",
        "Intro — Background (one paragraph orienting the reader).",
        "Intro — Thesis (Topic + Position + Rationale).",
        "Conclusion — Restate thesis in fresh words.",
        "Conclusion — Summarise the main reasons (not new evidence).",
        "Conclusion — Final thought: zoom out to the 'So what?'"
      ]
    },
    workedExample: "Intro hook: 'In 2021, Facebook's own researchers concluded that Instagram made body-image issues worse for one in three teenage girls.'\nConclusion final thought: 'The cost of inaction is being absorbed, daily, by the young people the platforms most aggressively pursue.'",
    apply: "Write your conclusion before your introduction, then revise the introduction to set up exactly what the conclusion delivers.",
    homework: "Find an essay you admire. Box out its hook, thesis, and final thought. Note what each element does."
  },

  {
    n: 16,
    part: "Part II: Application",
    title: "The Literature Review",
    tool: "Synthesis Matrix",
    goal: "Synthesise — not summarise — multiple sources to map a scholarly conversation around a research question.",
    chineseAnnotation: "文献综述 (Wénxiàn zōngshù)",
    keyConcepts: [
      "A literature review is organised by theme, never by source.",
      "Every paragraph should make a claim about the field, not about a single paper.",
      "The end of the review identifies the gap your essay or study fills.",
      "Use signposting language: 'Three strands organise the literature…'; 'A persistent debate…'; 'The literature establishes that… but does not address…'"
    ],
    framework: {
      name: "Synthesis Matrix (revisited)",
      description: "The same tool from Ch.7, now used at scale.",
      steps: [
        "Define 3–5 themes that cut across the field.",
        "List sources down the left, themes across the top.",
        "Each cell: one-line note on what the source says about that theme.",
        "Each row becomes a citation; each column becomes a paragraph.",
        "End with the gap — the column or cell with the fewest entries is often the gap."
      ]
    },
    workedExample: "Three themes: exposure narrowing | affective polarisation | mechanism. Cinelli (2021) and Bakshy (2015) fill the first; Bail (2021) and Iyengar (2019) fill the second; Pennycook (2022) starts the third — which is the gap.",
    apply: "Before writing a literature review, build the matrix. Write paragraphs by reading down columns, not across rows.",
    homework: "For your current essay, build a synthesis matrix with 5 sources and 3 themes. Use one column to draft one literature-review paragraph."
  },

  {
    n: 17,
    part: "Part II: Application",
    title: "The Research Proposal",
    tool: "Proposal Template",
    goal: "Pose a research question, review the literature, and outline a methodology to investigate it — the pre-cursor to a dissertation.",
    chineseAnnotation: "研究计划 (Yánjiū jìhuà)",
    keyConcepts: [
      "A proposal is forward-looking: you are not reporting findings, you are arguing for a future study.",
      "Three claims must be defended: the question matters, the method will work, the contribution is original.",
      "Research proposals are the genre university students most often misjudge — they overpromise on findings and underplay methodology."
    ],
    framework: {
      name: "Research Proposal Template",
      description: "Six standard sections.",
      steps: [
        "Title + abstract — one-paragraph snapshot.",
        "Research question — specific, answerable, significant.",
        "Brief literature review — establishes the gap.",
        "Methodology — how you will gather and analyse data.",
        "Expected outcomes & timeline — what you hope to find, when.",
        "Ethical considerations & limitations."
      ]
    },
    workedExample: "See the postgraduate-level sample in the Examples tab — Chapters 1, 2, and 3 of a Masters dissertation are essentially an expanded research proposal.",
    apply: "Write a research proposal even when not formally required — it forces clarity on question, method, and contribution before drafting begins.",
    homework: "Draft a 500-word research proposal on a question you care about. Hit every section above."
  },

  {
    n: 18,
    part: "Part II: Application",
    title: "The 'They Say / I Say' Model",
    tool: "They Say / I Say Templates",
    infographic: "they-say",
    goal: "Enter the academic conversation — acknowledge the views of others and respond to them, rather than writing in a vacuum.",
    chineseAnnotation: "他们说/我说 (Tāmen shuō / Wǒ shuō)",
    keyConcepts: [
      "Academic writing is a conversation, not a monologue.",
      "Every claim has a 'They Say' (the existing view) and an 'I Say' (your response).",
      "Concessions strengthen, not weaken, arguments — 'Although it is true that X, my point is more important because Y'.",
      "Templates are not crutches; they are the shapes of disciplined academic prose."
    ],
    framework: {
      name: "They Say / I Say Templates",
      description: "Sentence frames for entering and responding to academic conversation.",
      steps: [
        "They Say (introducing): 'Critics of this position argue that…' / 'Some people might contend that…' / 'A common concern about this solution is…'",
        "I Say (refuting): 'However, this view overlooks…' / 'While this concern is valid, it fails to account for…' / 'The evidence, however, suggests otherwise.'",
        "Conceding: 'Although it is true that X, Y is more important because…' / 'I grant that X, but nevertheless Y.'"
      ]
    },
    workedExample: "They Say: 'Some argue that a four-day school week is too short and will lead to less learning.'\nI Say: 'However, studies from districts that have adopted this model show that restructured class time and improved teacher morale lead to more focused instruction and even improved test scores (Parker, 2023).'",
    apply: "Open every counterargument paragraph with a They Say sentence. Use the templates until the pattern is automatic; then make them your own.",
    homework: "Find one essay you admire and identify three They Say / I Say moves. Then write your own counterargument paragraph using two different templates."
  },

  {
    n: 19,
    part: "Part II: Application",
    title: "Discipline-Specific Writing",
    tool: "Discipline Samples",
    goal: "Recognise that writing conventions differ between disciplines — and learn to read your field for them.",
    chineseAnnotation: "学科特定写作 (Xuékē tèdìng xiězuò)",
    keyConcepts: [
      "Sciences typically use IMRaD structure (Introduction, Methods, Results, Discussion); humanities use thematic structure.",
      "Citation conventions differ: APA, MLA, Harvard, Chicago, IEEE, Vancouver, OSCOLA.",
      "Even the use of 'I' varies — common in humanities, contested in social sciences, rare in hard sciences.",
      "Read three highly-cited papers in your field before writing in it."
    ],
    framework: {
      name: "Discipline Samples",
      description: "A quick comparison across fields.",
      steps: [
        "Humanities: thematic structure, longer paragraphs, 'I' acceptable, MLA/Chicago.",
        "Social sciences: hybrid structure, hedged claims, 'I' contested, APA / Harvard.",
        "Hard sciences: IMRaD, short paragraphs, 'I' rare, IEEE / Vancouver.",
        "Law: footnote-heavy, OSCOLA, particular conventions around precedent.",
        "Business: executive-summary-first, action-oriented, mixed styles."
      ]
    },
    workedExample: "An English essay on Macbeth opens with a thematic claim. A psychology study on guilt opens with hypothesis and method. Same topic — incompatible structures.",
    apply: "Before writing in a new discipline, read 3 highly-cited papers in it. Note structure, citation style, use of 'I', and length of paragraphs.",
    homework: "Pick two disciplines you might study at university. Read one paper from each and write a 200-word comparison of their writing conventions."
  },

  {
    n: 20,
    part: "Part III: Mastery",
    title: "Capstone Project Launch",
    tool: "Capstone Proposal",
    goal: "Choose between two tracks — Research Paper (~2,500 words) or Portfolio & Reflection — and draft a proposal for the chosen track.",
    chineseAnnotation: "顶点项目启动 (Dǐngdiǎn xiàngmù qǐdòng)",
    keyConcepts: [
      "The capstone is the integration test — every prior chapter is on the table.",
      "Track 1 (Research Paper) tests synthesis, argument, and research depth.",
      "Track 2 (Portfolio + Reflection) tests metacognition and growth over time.",
      "Choose the track that stretches you, not the one that is easier."
    ],
    framework: {
      name: "Capstone Proposal",
      description: "A 500-word document committing you to the work.",
      steps: [
        "Working title.",
        "Track (1 or 2).",
        "Research question or portfolio focus.",
        "Three goals + a one-line success measure for each.",
        "Methodology / curation plan.",
        "Timeline across four weeks."
      ]
    },
    workedExample: "Track 1 capstone: 'How do algorithmic feeds reshape political opinion formation among UK 18–25-year-olds?' — see the undergraduate sample in the Examples tab for what it looks like fully written.",
    apply: "Submit your proposal early; the supervisor's feedback is worth more in week 1 than in week 4.",
    homework: "Draft the capstone proposal. Have a peer review it for clarity of question and feasibility."
  },

  {
    n: 21,
    part: "Part III: Mastery",
    title: "Capstone Work I — Research & Drafting",
    tool: "Research & drafting workshop",
    goal: "Move from proposal to first draft — research deeply, build the synthesis matrix, write the first cut.",
    chineseAnnotation: "顶点工作 I (Dǐngdiǎn gōngzuò)",
    keyConcepts: [
      "First drafts are exploratory — they exist to be revised.",
      "Build the synthesis matrix before writing prose.",
      "Aim for a complete-but-rough first draft by the end of week 2 of the capstone — every section present, none polished."
    ],
    framework: {
      name: "Drafting Plan",
      description: "Daily and weekly cadence.",
      steps: [
        "Day 1–3: research sprint — 10–15 sources, RADAR-evaluated.",
        "Day 4: build synthesis matrix.",
        "Day 5–10: draft by section, in any order.",
        "Day 11: read top to bottom; identify weakest paragraph.",
        "Day 12+: targeted revision."
      ]
    },
    workedExample: "Trying to perfect the introduction before drafting the body is the most common failure mode. Draft body first; rewrite intro last.",
    apply: "Block calendar time for drafting. Treat the first draft as a sketch — quantity over quality at this stage.",
    homework: "Produce a complete first draft of your capstone (all sections, however rough) by the end of week 2."
  },

  {
    n: 22,
    part: "Part III: Mastery",
    title: "Capstone Work II — Peer Review",
    tool: "Peer Review Rubric",
    goal: "Give and receive structured peer feedback — the single highest-leverage activity for improving a draft.",
    chineseAnnotation: "顶点工作 II (Dǐngdiǎn gōngzuò II)",
    keyConcepts: [
      "Peer feedback is more useful when structured against a rubric than when free-form.",
      "Compliments are useless without specifics; criticisms are useless without alternatives.",
      "Give feedback you would want to receive: specific, kind, actionable."
    ],
    framework: {
      name: "Peer Review Rubric",
      description: "Five criteria peer-reviewers rate 0–5 with one-line evidence.",
      steps: [
        "Thesis — clear, arguable, passes 'So what?'.",
        "Evidence — RADAR-passed, integrated, cited.",
        "Paragraph craft — PEEL throughout.",
        "Counterargument — strongest opposing view fairly stated and refuted.",
        "Style & mechanics — concise, hedged, clean."
      ]
    },
    workedExample: "Useful peer comment: 'Body 2's evidence is strong but the Explanation step is missing — the reader has to infer the connection. Add one sentence: This shows that…'",
    apply: "Conduct two structured peer-review sessions per major essay. Use the rubric in the Polishing step of the app.",
    homework: "Peer-review a classmate's capstone draft using the rubric. Provide written comments tied to specific paragraphs."
  },

  {
    n: 23,
    part: "Part III: Mastery",
    title: "Capstone Work III — Editing & Polishing",
    tool: "Final Checklist",
    goal: "Apply the full polishing checklist plus formatting and citation accuracy — the final mile of a capstone.",
    chineseAnnotation: "顶点工作 III (Dǐngdiǎn gōngzuò III)",
    keyConcepts: [
      "Polishing has three layers: argument, paragraph, language.",
      "Citation accuracy matters disproportionately at this level — a single missing reference can change a grade.",
      "Always do a final read-aloud pass.",
      "Document any AI assistance honestly."
    ],
    framework: {
      name: "Final Checklist",
      description: "The closeout pass.",
      steps: [
        "Argument & Logic — thesis clarity, evidence support, counterargument, fallacies.",
        "Paragraphs — PEEL, topic sentences, transitions.",
        "Language & Style — concise, hedged, citations.",
        "Submission — formatting, bibliography, plagiarism / AI declaration."
      ]
    },
    workedExample: "See the Polishing step of the app — every item in the Final Checklist is a tickable row, grouped by category.",
    apply: "Reserve a full day for the polishing pass. Do not write new content on the last day before submission.",
    homework: "Run the Final Checklist on your capstone. Submit only when every row is ticked."
  },

  {
    n: 24,
    part: "Part III: Mastery",
    title: "Presentation Skills",
    tool: "Presentation Rubric",
    goal: "Present research findings effectively — orally — including structure, slides, voice, and Q&A.",
    chineseAnnotation: "展示技巧 (Zhǎnshì jìqiǎo)",
    keyConcepts: [
      "Presentations are not essays read aloud — they are a different medium with different conventions.",
      "Slides support the talk; they don't replace it. One idea per slide; few words.",
      "Practise the opening 30 seconds and the closing 30 seconds until they are muscle memory.",
      "Q&A is part of the presentation — anticipate the three hardest questions."
    ],
    framework: {
      name: "Presentation Rubric",
      description: "Five things examiners measure.",
      steps: [
        "Structure — clear opening, body, close.",
        "Slide design — minimal, supportive, readable.",
        "Voice — pace, volume, eye contact.",
        "Content — accurate, specific, relevant.",
        "Q&A — listening, brevity, intellectual honesty."
      ]
    },
    workedExample: "Strong opening (30s): 'In 2021, Facebook's own researchers concluded that one in three teenage girls' body-image issues were made worse by Instagram. The question of this talk is: should governments act?'",
    apply: "Rehearse a presentation three times: once in front of a mirror, once with a friend, once on video. Watch the video — fix what you would tell a friend to fix.",
    homework: "Prepare and rehearse a 7-minute talk on your capstone. Have one classmate ask you three difficult questions."
  },

  {
    n: 25,
    part: "Part III: Mastery",
    title: "Course Wrap-up & Future-Proofing",
    tool: "Portfolio Guide",
    goal: "Articulate transferable skills, curate a portfolio of your best work, and plan how you will keep writing at university and beyond.",
    chineseAnnotation: "课程总结与未来准备 (Kèchéng zǒngjié yǔ wèilái zhǔnbèi)",
    keyConcepts: [
      "The course's real product is not the essays — it is the habits.",
      "Articulating transferable skills helps universities, employers, and your future self understand what you can do.",
      "A portfolio is curation, not collection — choose 3–5 pieces that show range and growth.",
      "Future-proofing means continuing to write after the course ends."
    ],
    framework: {
      name: "Portfolio Guide",
      description: "Four sections.",
      steps: [
        "Pick 3–5 pieces of your best writing.",
        "For each, write a 100-word reflection: what it taught you, how it would be different now.",
        "Add a one-page 'transferable skills' summary.",
        "End with a future-writing plan — one essay a term, a journal, a blog, whatever fits."
      ]
    },
    workedExample: "Transferable skill: 'I can take a vague brief, decode the command words, build a focused research question, and produce a peer-reviewable argument in two weeks' — far more useful than 'I can write essays.'",
    apply: "Update your portfolio at the end of every term. Keep it light — curating an evolving record is easier than building one from scratch later.",
    homework: "Build your portfolio. Share it with a tutor, mentor, or parent for feedback."
  }
];

window.CHAPTERS = CHAPTERS;
