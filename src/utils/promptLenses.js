/**
 * Built-in Prompt Lenses Catalog for Bhavya's AI Assistant
 * Includes Educational, Visual Perspective, Strategic & Engineering prompts.
 * Now equipped with rich aliases & fuzzy command parsing.
 */

export const PROMPT_LENSES = [
  // ── 🎓 Educational & Study Lenses ─────────────────────────────
  {
    id: 'handwritten_notes',
    command: '/HANDWRITTEN_NOTES',
    aliases: ['/HANDWRITING', '/HANDWRITTEN', '/NOTES', '/CORNELL', '/STUDENT_NOTES', '/HANDWRITE', '/NOTEBOOK'],
    title: 'Cornell Handwritten Notes',
    desc: 'Visual student notebook with diagrams, tables, charts, callout boxes & recap',
    icon: '📝',
    category: 'Education',
    directive: (topic) => `Act as an elite educator, visual note-taking master (Sketchnote / Cornell style), and diagram specialist.
Transform the following lesson into an engaging, visual, reader-friendly "Master Student Notebook" for:
"${topic}"

CRITICAL DESIGN MANDATES (DO NOT MAKE IT LOOK LIKE A DRY RESEARCH PAPER):
1. Use visual emoji badges, GitHub-style callouts ([!NOTE], [!TIP], [!IMPORTANT], [!WARNING]), tables, and renderable Mermaid diagrams.
2. Structure the notes cleanly with scannable headers, bold anchor terms, and visual containers.
3. If numeric or categorical comparison is relevant, include a Markdown table with numbers (which automatically renders an interactive Bar/Line/Pie chart button in the UI!).

STRUCTURE TO FOLLOW STRICTLY:
# 📓 [TOPIC TITLE]
> [!NOTE]
> **Subject:** [Domain/Field] | **Level:** [Beginner / Intermediate / Advanced] | **Estimated Study Time:** [X mins] | **Key Takeaway:** [1-sentence punchy bottom line]

---

### 🗺️ VISUAL CONCEPT MAP / FLOWCHART
Provide a clean, valid \`\`\`mermaid flowchart TD or flowchart LR diagram visualizing how the main components or stages connect together.

---

### 📌 HIGH-YIELD CUE COLUMN & FLASH TRIGGERS
| ❓ Exam / Core Questions | 💡 1-Line Mental Model / Mnemonic | ⚠️ Deadliest Traps |
| :--- | :--- | :--- |
| [Question 1] | [Anchor mnemonic] | [Trap to avoid] |
| [Question 2] | [Anchor mnemonic] | [Trap to avoid] |
| [Question 3] | [Anchor mnemonic] | [Trap to avoid] |

---

### 📝 MAIN NOTES: DEEP-DIVE WITH VISUAL CARDS
Break down the topic into 2-3 logical sub-modules. For EACH sub-module, include:
- **Core Concept & Intuition:** Explain in direct, engaging conversational language.
- **Visual Callouts:**
  > [!TIP]
  > **Real-World Analogy:** [Relatable everyday physical analogy, e.g. cars, plumbing, kitchen]
  > [!IMPORTANT]
  > **The Golden Rule / Formula:** [Clear LaTeX equation $...$ or bedrock rule]
  > [!WARNING]
  > **Common Pitfall:** [What students or engineers frequently mess up]

- **Data / Comparative Metric Table (if applicable):** Provide a markdown table comparing metrics, features, or speeds with actual numbers (e.g. Columns: Component, Latency (ms), Throughput, Accuracy %).

---

### 📦 30-SECOND MASTER SYNTHESIS & RECAP
Provide a 3-bullet golden takeaway box for lightning-fast revision before an exam or interview.`
  },
  {
    id: 'flowchart',
    command: '/FLOWCHART',
    aliases: ['/FLOW', '/DIAGRAM', '/DECISION_TREE', '/TREE', '/WORKFLOW', '/CHART'],
    title: 'Visual Flowchart & Decision Tree',
    desc: 'Renderable Mermaid.js flowchart with condition branches, failure paths & checklist',
    icon: '🔀',
    category: 'Education',
    directive: (topic) => `Act as a Visual Systems Architect and Curriculum Designer.
Generate a comprehensive, visual step-by-step flowchart, architectural diagram, and decision tree for:
"${topic}"

CRITICAL PRESENTATION REQUIREMENTS:
1. **Interactive Mermaid.js Diagram:** Provide a rich, 100% valid, renderable \`\`\`mermaid flowchart TD code block showing:
   - Clear starting node and ending states.
   - Decision diamond condition branches (\`{Is condition met?}\`).
   - Distinct paths for **Yes/Success** vs **No/Failure/Fallback**.
   - Distinct styled subgraphs or clusters if multi-stage.
2. **Visual Flow Breakdown Table:**
   | Step # | Action / Stage | Condition Evaluated | If YES / Success | If NO / Failure | Fallback Strategy |
   | :--- | :--- | :--- | :--- | :--- | :--- |
   | 1 | ... | ... | ... | ... | ... |
3. **Key Architecture & Decision Notes:**
   > [!TIP]
   > **Pro Tip:** Critical optimization shortcut at Stage X.
   > [!WARNING]
   > **Bottleneck Warning:** The single most common failure point in this entire flow and how to guard against it.
4. **Actionable 5-Step Execution Checklist:** A clean, ordered checklist summarizing the golden path.`
  },
  {
    id: 'mindmap',
    command: '/MINDMAP',
    aliases: ['/MIND', '/MAP', '/BRAINSTORM', '/CONCEPT_MAP', '/CONCEPTMAP'],
    title: 'Hierarchical Mind Map',
    desc: 'Multi-tiered conceptual tree showing interconnectivity & Mermaid mindmap',
    icon: '🧠',
    category: 'Education',
    directive: (topic) => `Act as a Cognitive Learning Specialist and Visual Information Architect.
Generate an exhaustive, highly visual, interconnected Mind Map and Concept Tree for:
"${topic}"

FORMAT TO FOLLOW STRICTLY:
# 🧠 [TOPIC TITLE] - Visual Concept Map

### 🌐 INTERACTIVE MERMAID MINDMAP
Provide a valid, beautifully formatted \`\`\`mermaid mindmap diagram illustrating the Central Root, Tier 1 Pillars, Tier 2 Sub-Branches, and Tier 3 Leaves.

### 🌳 EXPANDED HIERARCHICAL TREE (ASCII & Explanations)
Display a clean indented ASCII tree structure:
\`\`\`text
Central Core Topic
├── 🏛️ Pillar 1: [Name]
│   ├── 🔹 Mechanism A -> [Key Formula or Rule]
│   └── 🔹 Mechanism B -> [Real-world Application]
├── ⚡ Pillar 2: [Name]
│   ├── 🔹 Law / Feature 1 -> [Details]
│   └── 🔹 Law / Feature 2 -> [Details]
└── 🚀 Pillar 3: [Name]
    └── 🔹 Practical Implementation
\`\`\`

### 🔗 CROSS-BRANCH SYNERGY TABLE
| Origin Branch | Target Branch | How They Influence Each Other | Real-World Breakthrough |
| :--- | :--- | :--- | :--- |
| Branch A | Branch B | ... | ... |

> [!TIP]
> **Cognitive Memory Anchor:** A 1-sentence mental model connecting all pillars together.`
  },
  {
    id: 'cheatsheet',
    command: '/CHEATSHEET',
    aliases: ['/CHEAT', '/CRAM', '/FORMULAS', '/SUMMARY_SHEET', '/REVISION', '/SHEET'],
    title: '1-Page Exam Cram Sheet',
    desc: 'High-density visual tables, formulas, units, traps & flash check',
    icon: '📋',
    category: 'Education',
    directive: (topic) => `Act as a Tier-1 University Exam Coach and Professional Cheat Sheet Designer.
Condense the entire topic into an ultra-dense, visually aesthetic, zero-fluff "1-Page Visual Revision Sheet" for:
"${topic}"

REQUIREMENTS:
1. **⚡ Golden Rules & Formulas Table:**
   | Concept / Formula | Mathematical Notation ($) | SI Units / Types | When to Apply | Exceptions / Boundaries |
   | :--- | :--- | :--- | :--- | :--- |
   | ... | $...$ | ... | ... | ... |

2. **📊 Key Numerical Benchmarks / Comparative Stats Table:**
   Include actual numeric estimates or metrics (e.g. complexity, memory, latency, score) so the interactive Chart button is activated!

3. **⚠️ The 5 Deadliest Traps & Misconceptions:**
   Format with high-visibility tags:
   - 🔴 **Trap 1:** [Mistake] ➔ 🟢 **Correction:** [Exact fix]
   - 🔴 **Trap 2:** [Mistake] ➔ 🟢 **Correction:** [Exact fix]

4. **📐 Visual Architecture / Flowchart:**
   Include a short 4-5 node \`\`\`mermaid diagram summarizing the core pipeline.

5. **🎯 Rapid-Fire Self-Check Quiz:**
   3 pointed flash questions with immediate 1-line bold answers.`
  },
  {
    id: 'feynman',
    command: '/FEYNMAN',
    aliases: ['/SIMPLE', '/TEACH_ME', '/ANALOGY', '/INTUITION', '/PLAIN_ENGLISH'],
    title: 'The Feynman Technique',
    desc: 'Explain deeply using simple analogies, visual diagrams & pinpoint gaps',
    icon: '🔬',
    category: 'Education',
    directive: (topic) => `Apply the legendary Feynman Technique to explain:
"${topic}"

STRUCTURE TO FOLLOW STRICTLY (VISUAL & INTUITIVE):
# 🔬 The Feynman Breakdown: [TOPIC TITLE]

### 🧸 1. The 10-Year-Old Test (Zero Jargon)
Explain the core idea in 2-3 engaging, lively paragraphs as if explaining to a curious 10-year-old. No academic pretension.

### 🚗 2. The Visual Everyday Analogy
> [!NOTE]
> **The Analogy in Action:** Paint a vivid, relatable picture (e.g. traffic lights, water pipes, kitchen chefs, pizza delivery).

Provide a simple \`\`\`mermaid flowchart LR diagram mapping the **Analogy Component** ➔ **Real Technical Component**.

### ⚙️ 3. Layering the Technical Engine
Now connect the analogy directly to the actual equations, code, or hardware mechanisms:
| Analogy Element | Real Technical Concept | What Happens Under the Hood |
| :--- | :--- | :--- |
| ... | ... | ... |

### 🔍 4. The "Where People Get Stuck" Audit
> [!WARNING]
> **The Intuition Trap:** Highlight the exact point where standard intuition fails and clarify it with a crystal-clear diagram or rule.`
  },
  {
    id: 'socratic_tutor',
    command: '/SOCRATIC_TUTOR',
    aliases: ['/SOCRATIC', '/TUTOR', '/TEACH', '/GUIDE', '/DISCOVERY', '/COACH'],
    title: 'Socratic Tutor',
    desc: 'Interactive visual discovery through inquiry, thought experiments & guiding clues',
    icon: '🏛️',
    category: 'Education',
    directive: (topic) => `Act as an inspiring, master Socratic Professor.
Do NOT simply give away the answer in an essay. Instead, guide me through an interactive visual discovery on:
"${topic}"

FORMAT:
1. **The Central Paradox or Puzzle:** State a fascinating real-world puzzle or scenario in 2 sentences.
2. **Visual Clue Map:** A quick 3-node \`\`\`mermaid flowchart TD diagram illustrating the fork in the road.
3. **The Guiding Question:** Ask me ONE sharp, thought-provoking question to test my intuition.
4. **Interactive Hint Options:** Provide 3 distinct hypotheses (Option A, Option B, Option C) for me to consider.
5. **Prompt for Response:** Invite me to pick a hypothesis or share my reasoning to take the next step!`
  },
  {
    id: 'flashcards',
    command: '/FLASHCARDS',
    aliases: ['/FLASHCARD', '/CARDS', '/ANKI', '/RECALL', '/QUIZ_CARDS', '/FLASH'],
    title: 'Anki Active Recall Cards',
    desc: 'Spaced repetition flashcard deck with memory anchors & difficulty rating',
    icon: '📇',
    category: 'Education',
    directive: (topic) => `Generate a high-yield Active Recall & Anki-compatible Flashcard Deck for:
"${topic}"

Create 6-8 high-impact flashcards. Format each card as a clean visual block:
---
### 📇 CARD [NUMBER]: [Category / Topic Area]
- **Front (Question / Challenge):** Clear, unambiguous prompt testing recall, calculation, or logic.
- **Back (Answer):** Concise, verified, high-yield explanation with formula or code snippet.
> [!TIP]
> **💡 Memory Anchor:** A vivid mnemonic, physical analogy, or visual cue.
- **📊 Retention Difficulty:** 🟢 Easy | 🟡 Medium | 🔴 Hard`
  },
  {
    id: 'mnemonics',
    command: '/MNEMONICS',
    aliases: ['/MNEMONIC', '/MEMORY', '/PALACE', '/TRICK', '/REMEMBER'],
    title: 'Mnemonics & Memory Palaces',
    desc: 'Vivid imagery, spatial memory palaces, diagrams & rhyme anchors',
    icon: '🏰',
    category: 'Education',
    directive: (topic) => `Create an unforgettable visual mnemonic memory system for:
"${topic}"

PROVIDE:
1. **The Catchy Acronym / Story:** A hilarious or vivid phrase where each letter/word triggers a core concept.
2. **The 4-Room Memory Palace (Spatial Walkthrough):**
   | Room / Location | Bizarre Interactive Object | What Concept It Represents |
   | :--- | :--- | :--- |
   | 🚪 1. Front Porch | ... | ... |
   | 🛋️ 2. Living Room | ... | ... |
   | 🍳 3. Kitchen | ... | ... |
   | 🌅 4. Balcony | ... | ... |
3. **Visual Route Flowchart:** A quick \`\`\`mermaid flowchart LR diagram tracking the walk through the memory palace.
4. **Phonetic Rhyme / Sound-Alike Anchor:** A rhyming couplet that locks in the most stubborn terms.`
  },
  {
    id: 'step_by_step',
    command: '/STEP_BY_STEP',
    aliases: ['/STEPS', '/STEP', '/DERIVATION', '/WALKTHROUGH', '/HOWTO', '/STAGE'],
    title: 'Step-by-Step Derivation',
    desc: 'Airtight algebraic or logical proof with visual stage progression & roadmap',
    icon: '🪜',
    category: 'Education',
    directive: (topic) => `Provide an exhaustive, visually structured, and mathematically airtight Step-by-Step Derivation / Solution for:
"${topic}"

RULES:
1. **Roadmap Diagram:** Start with a \`\`\`mermaid flowchart TD showing the progression from [Initial Problem / State] ➔ [Intermediate Stages] ➔ [Final Target].
2. **Step Progression Cards:** For EVERY single step, format cleanly:
   ### 🪜 Step [N]: [Title of Transformation]
   - **Mathematical / Logical Equation:** $...$
   - **Axiom / Law Applied:** State the theorem or rule explicitly.
   - **Plain English Intuition:** Why did we take this step? What did it unlock?
   > [!TIP]
   > **Pro Check:** Quick sanity check or dimensional analysis verifying correctness so far.
3. **Summary Table:** A final verification table reviewing each step's intermediate result.`
  },
  {
    id: 'quiz_me',
    command: '/QUIZ_ME',
    aliases: ['/QUIZ', '/TEST', '/EXAM', '/PRACTICE', '/SELF_TEST', '/QUESTION'],
    title: 'Exam Practice Simulator',
    desc: 'Multiple choice & conceptual questions with hidden solution key & scoring rubric',
    icon: '🎯',
    category: 'Education',
    directive: (topic) => `Generate a rigorous, interactive 5-Question Practice Exam for:
"${topic}"

Include:
- **Q1-Q2:** Conceptual Multiple Choice questions with 4 believable distractors.
- **Q3-Q4:** Analytical / Calculation / Code output problem.
- **Q5:** Tricky "Spot the Bug / Find the Flaw" scenario.

Formatting:
- Present questions cleanly with bullet options.
- DO NOT show answers in the open text!
- Put complete step-by-step solutions, scoring breakdown, and key explanations inside a collapsible:
  <details>
  <summary>🔑 Click to Reveal Answer Key & In-Depth Explanations</summary>
  
  [Detailed solutions here]
  </details>`
  },
  {
    id: 'real_world_case',
    command: '/REAL_WORLD_CASE',
    aliases: ['/CASE', '/CASESTUDY', '/REALWORLD', '/EXAMPLE', '/CASE_STUDY'],
    title: 'Real-World Case Study',
    desc: 'Historical or industry implementation with timeline, architecture & post-mortem',
    icon: '🌍',
    category: 'Education',
    directive: (topic) => `Analyze a real-world enterprise or historical Case Study demonstrating:
"${topic}"

STRUCTURE:
1. **The Organization & Stakes:** Company / context (e.g. Netflix, NASA, Tesla, CrowdStrike, AWS).
2. **Visual Architecture / Incident Timeline:**
   Provide a \`\`\`mermaid flowchart TD or sequence diagram illustrating what happened step by step.
3. **The Architectural / Strategic Decision:** What they engineered and why.
4. **The Impact / Disaster / Breakthrough:**
   | Metric Before | Metric After | Business / Engineering Impact |
   | :--- | :--- | :--- |
   | ... | ... | ... |
5. **The Post-Mortem Engineering Lessons:**
   > [!IMPORTANT]
   > **Core Engineering Takeaway:** The enduring rule to take away.`
  },

  // ── 🔭 Visual & Spatial Perspective Lenses ─────────────────────
  {
    id: '360view',
    command: '/360VIEW',
    aliases: ['/360', '/PANORAMA', '/PANORAMIC', '/ALL_ANGLES', '/FULL_VIEW'],
    title: '360° Panoramic Breakdown',
    desc: 'Inspect across technical, economic, evolutionary & human angles with diagrams',
    icon: '🌐',
    category: 'Visual Perspective',
    directive: (topic) => `Perform a complete 360° Panoramic Multi-Disciplinary Analysis of:
"${topic}"

STRUCTURE TO FOLLOW STRICTLY:
# 🌐 360° Panoramic Analysis: [TOPIC TITLE]

### 🗺️ MULTI-FACETED MERMAID RADAR / TOPOLOGY
Provide a \`\`\`mermaid flowchart TD diagram visualizing the 5 dimensions surrounding the core concept.

### 📐 THE 5 DIMENSIONS:
1. **⚙️ Technical & Engineering Dimension:** Raw mechanics, physics, data structures, or code.
2. **💰 Economic & Market Dimension:** Cost structures, ROI, competitive moats, pricing power.
3. **📜 Historical & Evolutionary Dimension:** Why previous attempts failed and what breakthroughs led here.
4. **🧠 Psychological & Human Dimension:** User friction, adoption hurdles, cognitive ergonomics.
5. **🔮 The 2035 Frontier Dimension:** Where this paradigm will break or evolve over the next decade.

### 📊 SYNTHESIS COMPARISON MATRIX
| Dimension | Primary Driver | Biggest Threat | 5-Year Outlook |
| :--- | :--- | :--- | :--- |
| Technical | ... | ... | ... |
| Economic | ... | ... | ... |
| Historical | ... | ... | ... |
| Human | ... | ... | ... |
| Frontier | ... | ... | ... |`
  },
  {
    id: 'xray',
    command: '/XRAY',
    aliases: ['/UNDER_THE_HOOD', '/INTERNALS', '/MECHANICS', '/INNER_WORKINGS'],
    title: 'X-Ray Internal Mechanics',
    desc: 'Strip away abstractions to reveal registers, memory, OS calls & protocols',
    icon: '🦴',
    category: 'Visual Perspective',
    directive: (topic) => `Conduct an X-Ray Deep Penetration Inspection into:
"${topic}"

Strip away high-level abstractions, frameworks, syntax sugar, and user interfaces. Detail what happens in microseconds:
1. **Visual Stack Diagram:** Provide a \`\`\`mermaid flowchart TD showing the flow from App Layer ➔ Runtime/Heap ➔ OS Syscalls ➔ Hardware/CPU Caches.
2. **Layer-by-Layer Breakdown:**
   - **Layer 1: Silicon & CPU (Registers, ALU, L1/L2/L3 cache lines, branch predictor)**
   - **Layer 2: OS & Kernel (Syscalls, page faults, virtual memory translation, thread scheduling)**
   - **Layer 3: Runtime & Memory (Stack frames vs. Heap allocation, pointer dereferences, garbage collector)**
   - **Layer 4: Network / I/O (Buffers, sockets, serialization, packets)**
3. **Microsecond Timeline Table:**
   | Time Window | Internal Hardware / OS Event | Data In Flight |
   | :--- | :--- | :--- |
   | 0.001 μs | CPU fetches instruction into L1i cache | ... |
   | 0.050 μs | Memory dereference / cache hit | ... |
   | 1.000 μs | Context switch / syscall execution | ... |`
  },
  {
    id: 'droneview',
    command: '/DRONEVIEW',
    aliases: ['/DRONE', '/BIG_PICTURE', '/10000FT', '/MACRO', '/BIRD_EYE', '/HIGH_LEVEL'],
    title: 'Drone View (10,000 Ft View)',
    desc: 'Strategic ecosystem landscape, choke points, dependencies & high ground',
    icon: '🚁',
    category: 'Visual Perspective',
    directive: (topic) => `Provide a 10,000-Foot Strategic Drone View for:
"${topic}"

FORMAT:
1. **Ecosystem Topology Diagram:** A rich \`\`\`mermaid flowchart TD mapping Upstream Providers ➔ Core System ➔ Downstream Consumers & Competitors.
2. **Upstream Supply Chain:** What components, data feeds, or libraries power this?
3. **Downstream Value Chain:** Who depends on this output and why?
4. **Critical Choke Points & Vulnerabilities Table:**
   | Choke Point / Monopoly | Risk Severity | Likelihood of Disruption | Defensive Mitigation |
   | :--- | :--- | :--- | :--- |
   | ... | High / Medium | ... | ... |
5. **The Strategic High Ground:** What specific capability grants an unfair competitive advantage?`
  },
  {
    id: 'microscope',
    command: '/MICROSCOPE',
    aliases: ['/MICRO', '/GRANULAR', '/DEEPDIVE', '/ATOMIC', '/SUBATOMIC'],
    title: 'Microscope Granular Inspection',
    desc: 'Sub-atomic inspection of byte layouts, boundary conditions & hidden constants',
    icon: '🔍',
    category: 'Visual Perspective',
    directive: (topic) => `Zoom in to maximum magnification (1,000,000x) on:
"${topic}"

Focus obsessively on the sub-atomic nuances that 99% of developers and students miss:
1. **Binary & Memory Representation:** Byte layouts, struct padding, bitwise flags, endianness.
2. **Boundary Conditions & Edge Cases Table:**
   | Edge Case Scenario | Typical Behavior | Subtle Failure Mode | Defensive Assertion |
   | :--- | :--- | :--- | :--- |
   | Off-by-one / Empty set | ... | ... | ... |
   | Integer Overflow | ... | ... | ... |
   | Concurrency / Race | ... | ... | ... |
3. **The Hidden Constants ($O(c \cdot N)$):** Why Big-O hides critical real-world overhead (cache misses, malloc overhead).`
  },
  {
    id: 'cross_section',
    command: '/CROSS_SECTION',
    aliases: ['/SLICE', '/SECTION', '/LAYERS', '/CROSSSECTION'],
    title: 'Vertical Cross-Section Slice',
    desc: 'Visual multi-tier architectural stack from UI down to raw storage',
    icon: '🍰',
    category: 'Visual Perspective',
    directive: (topic) => `Cut a vertical architectural cross-section slice through:
"${topic}"

DELIVERABLES:
1. **Vertical Architecture Diagram:** Provide a \`\`\`mermaid flowchart TD showing the strata from Presentation down to Disk/Consensus.
2. **Stratum Breakdown Table:**
   | Stratum Layer | Technologies Involved | Invariants & Rules | Latency Budget |
   | :--- | :--- | :--- | :--- |
   | 🔵 UI / Presentation | ... | ... | < 16ms (60 FPS) |
   | 🟣 Business Logic / API | ... | ... | < 50ms |
   | 🟢 Orchestration & Queues | ... | ... | < 100ms |
   | 🟡 Storage & Consensus | ... | ... | < 20ms |
3. **Data Packet Journey:** Trace a single request or operation as it descends through each stratum and returns.`
  },

  // ── 🛡️ Strategic & Critical Stress-Test Lenses ──────────────────
  {
    id: 'devils_advocate',
    command: '/DEVILS_ADVOCATE',
    aliases: ['/CRITIQUE', '/COUNTER', '/SKEPTIC', '/ADVOCATE', '/OPPONENT'],
    title: 'Devil’s Advocate Stress-Test',
    desc: 'Ruthlessly attack assumptions, fragility, hidden tax & superior alternatives',
    icon: '😈',
    category: 'Strategy',
    directive: (topic) => `Act as the most incisive, ruthless Devil’s Advocate and Senior Critic.
Tear into the following proposal or concept:
"${topic}"

FORMAT WITH VISUAL IMPACT:
# 😈 Devil's Advocate Stress-Test: [TOPIC]

### 💣 1. The 3 Fragile Assumptions
| # | Assumption Made | Why It Is Dangerous or Flawed | What Reality Actually Shows |
| :--- | :--- | :--- | :--- |
| 1 | ... | ... | ... |
| 2 | ... | ... | ... |
| 3 | ... | ... | ... |

### 💸 2. The Hidden Maintenance & Complexity Tax
> [!WARNING]
> **The Ongoing Tax:** Detail the ongoing cognitive, technical, or financial overhead that will quietly drain the team.

### 🔄 3. Failure Mode Flowchart
Provide a \`\`\`mermaid flowchart TD illustrating how a minor failure cascades into a system outage.

### 🛡️ 4. The Superior Simpler Alternative
Present a simpler, robust counter-proposal that achieves 80% of the value with 20% of the headaches.`
  },
  {
    id: 'first_principles',
    command: '/FIRST_PRINCIPLES',
    aliases: ['/PRINCIPLES', '/FOUNDATION', '/ROOT_CAUSE', '/AXIOMS', '/FUNDAMENTALS'],
    title: 'First-Principles Reasoning',
    desc: 'Strip convention and rebuild from bedrock physical/logical truths with diagrams',
    icon: '⚛️',
    category: 'Strategy',
    directive: (topic) => `Deconstruct following Elon Musk's and Aristotle's First-Principles framework:
"${topic}"

STRUCTURE:
1. **Deconstruction of Conventional Dogma:**
   | Traditional Practice ("How it's done") | Underlying Flaw | What We Throw Away |
   | :--- | :--- | :--- |
   | ... | ... | ... |
2. **Bedrock Axioms (What Cannot Be Doubted):**
   List 3 indisputable fundamental physical, mathematical, or economic facts.
3. **Rebuilding Logic Flowchart:**
   Provide a \`\`\`mermaid flowchart TD showing the rebuild starting strictly from Axioms ➔ Core Mechanism ➔ Optimal Architecture.
4. **The Ground-Up Solution:** The innovative implementation derived solely from those first principles.`
  },
  {
    id: 'premortem',
    command: '/PREMORTEM',
    aliases: ['/FAILURE', '/RISKS', '/DISASTER_CHECK', '/POSTMORTEM', '/RISK'],
    title: 'Pre-Mortem Failure Simulation',
    desc: 'Assume catastrophic failure in 18 months; dissect failure cascade & survival playbook',
    icon: '☠️',
    category: 'Strategy',
    directive: (topic) => `Run a rigorous Gary Klein "Pre-Mortem" exercise on:
"${topic}"

PREMISE: "It is 18 months from now. We built and deployed this, and it has FAILED CATASTROPHICALLY. Systems crashed, users revolted, money was burned."

DELIVERABLES:
1. **Catastrophe Incident Flowchart:** A \`\`\`mermaid flowchart TD tracking the domino cascade from early oversight to total collapse.
2. **The 3 Lethal Failure Vectors:**
   | Failure Vector | Early Warning Sign Ignored | Cascade Impact | Root Cause |
   | :--- | :--- | :--- | :--- |
   | ... | ... | ... | ... |
3. **The Survival Playbook:** 3 concrete guardrails to enact TODAY to guarantee this disaster never happens.`
  },
  {
    id: 'swot',
    command: '/SWOT',
    aliases: ['/SWOT_ANALYSIS', '/MATRIX', '/COMPETITIVE'],
    title: 'SWOT Intelligence Matrix',
    desc: '4-quadrant strategic matrix, offensive/defensive playbooks & visual map',
    icon: '📊',
    category: 'Strategy',
    directive: (topic) => `Build an actionable, modern 4-quadrant SWOT Strategic Matrix for:
"${topic}"

FORMAT:
### 📊 SWOT STRATEGIC MATRIX
| 🟢 STRENGTHS (Internal Superpowers) | 🔴 WEAKNESSES (Internal Vulnerabilities) |
| :--- | :--- |
| • [Key Strength 1]<br>• [Key Strength 2]<br>• [Key Strength 3] | • [Vulnerability 1]<br>• [Vulnerability 2]<br>• [Vulnerability 3] |

| 🔵 OPPORTUNITIES (External Tailwinds) | 🟡 THREATS (External Black Swans) |
| :--- | :--- |
| • [Market Opportunity 1]<br>• [Market Opportunity 2] | • [Threat / Competitor 1]<br>• [Threat / Competitor 2] |

### ⚔️ STRATEGIC EXECUTION PLAYBOOK
- **Offensive Play (S × O):** How to weaponize strengths to capitalize on high-yield opportunities.
- **Defensive Shield (W × T):** How to patch critical vulnerabilities before competitors exploit them.`
  },

  // ── 💻 Code & Software Engineering Lenses ──────────────────────
  {
    id: 'production_ready',
    command: '/PRODUCTION_READY',
    aliases: ['/CODE', '/PROD', '/ENTERPRISE_CODE', '/DEVELOP', '/FULL_CODE'],
    title: 'Production-Ready Enterprise Code',
    desc: 'Untruncated, battle-tested code with architecture diagram, types & error handling',
    icon: '🚀',
    category: 'Engineering',
    directive: (topic) => `Write 100% complete, battle-tested, enterprise PRODUCTION-READY code for:
"${topic}"

MANDATORY STANDARDS:
1. **Architecture / Pipeline Diagram:** Include a concise \`\`\`mermaid flowchart TD illustrating component flow.
2. **Zero Placeholders:** NO \`// TODO\`, \`/* Implement here */\`, or ellipsis shortcuts. Write EVERY line of working code.
3. **Strict Type Safety & Invariants:** TypeScript interfaces / Python type hints / Modern C++ types.
4. **Defensive Error Handling:** Custom typed errors, validation, and graceful recovery.
5. **Clean Presentation:**
   - Place all code in syntax-highlighted blocks (\`\`\`typescript, \`\`\`python, etc.).
   - Include a Time & Space complexity summary table.`
  },
  {
    id: 'security_audit',
    command: '/SECURITY_AUDIT',
    aliases: ['/SECURITY', '/AUDIT', '/SEC', '/PENTEST', '/VULNERABILITY', '/VULN'],
    title: 'Cybersecurity Penetration Audit',
    desc: 'OWASP Top 10 evaluation, threat modeling diagram, attack vectors & patches',
    icon: '🛡️',
    category: 'Engineering',
    directive: (topic) => `Act as an elite Lead Security Researcher and Red Team Penetration Tester.
Perform an adversarial Security Audit on:
"${topic}"

DELIVERABLES:
1. **Threat Model & Attack Surface Diagram:** Provide a \`\`\`mermaid flowchart TD showing all ingress points, trust boundaries, and potential exploit vectors.
2. **Vulnerability Assessment Matrix:**
   | Vulnerability (OWASP) | Risk Level | Exploit Scenario | Hardened Mitigation |
   | :--- | :--- | :--- | :--- |
   | Injection / XSS | 🔴 High | ... | ... |
   | Broken Auth / Session | 🟡 Medium | ... | ... |
   | SSRF / Data Leak | 🟢 Low | ... | ... |
3. **Hardened Defense Code Patch:** Exact code and configuration changes to seal the vulnerabilities.`
  },
  {
    id: 'benchmark',
    command: '/BENCHMARK',
    aliases: ['/PERF', '/SPEED', '/PROFILER', '/OPTIMIZE', '/LATENCY'],
    title: 'Benchmark & Profiler',
    desc: 'Big-O complexity table, hardware bottlenecks, latency stats & 10x speedup',
    icon: '⏱️',
    category: 'Engineering',
    directive: (topic) => `Conduct an in-depth Performance Profiling & Optimization Analysis on:
"${topic}"

PROVIDE:
1. **Big-O Complexity & Latency Benchmark Table:**
   | Operation / Subroutine | Best Case | Average Case | Worst Case | Memory (Space) | Typical Latency (ms) |
   | :--- | :--- | :--- | :--- | :--- | :--- |
   | Operation 1 | $O(1)$ | $O(\log N)$ | $O(N)$ | $O(1)$ | 0.04 |
   | Operation 2 | $O(N)$ | $O(N \log N)$ | $O(N^2)$ | $O(N)$ | 2.10 |
   *(Notice: Including numeric latency in milliseconds automatically enables the interactive Chart visualizer in the UI!)*

2. **Execution Flow & Bottleneck Diagram:** A \`\`\`mermaid flowchart TD pinpointing where 80% of CPU cycles are consumed.
3. **The 10x Optimization Plan:** 3 concrete engineering upgrades (e.g. SIMD, cache locality, memoization, zero-copy buffers).`
  },
  {
    id: 'refactor',
    command: '/REFACTOR',
    aliases: ['/CLEAN', '/CLEAN_CODE', '/SOLID', '/MODERNIZE', '/IMPROVE_CODE'],
    title: 'Clean Code & SOLID Refactor',
    desc: 'Eliminate code smells, decouple modules, apply design patterns & show visual diff',
    icon: '✨',
    category: 'Engineering',
    directive: (topic) => `Refactor the following code or architecture using Clean Code and SOLID principles:
"${topic}"

DELIVERABLES:
1. **Architecture Transformation Diagram:** A \`\`\`mermaid flowchart LR showing [Tightly Coupled Legacy] ➔ [Decoupled SOLID Architecture].
2. **Code Smells Audit Table:**
   | Location / Component | Code Smell Identified | Violated Principle | Target Pattern |
   | :--- | :--- | :--- | :--- |
   | ... | Magic numbers / God class | Single Responsibility | Strategy / Factory |
3. **The Clean Implementation:** 100% complete, decoupled, and self-documenting code.
4. **Visual Diff / Improvements Summary:** Key maintainability gains.`
  },

  // ── 💡 Communication & Synthesis Lenses ─────────────────────────
  {
    id: 'eli5',
    command: '/ELI5',
    aliases: ['/5YO', '/5YEAROLD', '/EXPLAIN_LIKE_5', '/VERY_SIMPLE', '/KID'],
    title: 'Explain Like I’m 5',
    desc: 'Joyful, ultra-simple real-world metaphors, ASCII / visual flow & takeaways',
    icon: '🧸',
    category: 'Communication',
    directive: (topic) => `Explain this like I am 5 years old:
"${topic}"

Use fun, joyful metaphors involving toys, animals, candy, or playgrounds:
1. **The Playground Story:** Paint a vivid, simple picture with characters or games.
2. **Visual Step Diagram:** A super simple 3-box \`\`\`mermaid flowchart LR diagram with friendly labels and emojis.
3. **Why It's Cool:** The 1 big reason this matters to the world in plain, joyful words!`
  },
  {
    id: 'executive_brief',
    command: '/EXECUTIVE_BRIEF',
    aliases: ['/BRIEF', '/MEMO', '/EXECUTIVE', '/CEO_MEMO', '/BLUF', '/EXEC'],
    title: 'C-Suite 1-Page Executive Memo',
    desc: 'BLUF, ROI metrics, milestone timeline diagram & clear decision request',
    icon: '👔',
    category: 'Communication',
    directive: (topic) => `Draft a high-impact, 1-page Executive Memo for the CEO / Board of Directors on:
"${topic}"

STRUCTURE:
1. **BLUF (Bottom Line Up Front):** Core conclusion, capital required, and timeline in 2 punchy sentences.
2. **Financial & Strategic ROI Table:**
   | Metric | Current Baseline | Projected (Year 1) | Projected (Year 3) | ROI Multiple |
   | :--- | :--- | :--- | :--- | :--- |
   | Revenue / Savings ($M) | 1.0 | 3.5 | 8.0 | 3.5x |
   | Operational Latency (ms) | 250 | 45 | 20 | 5.5x |
   *(Table numbers will enable visual chart generation!)*
3. **Implementation Roadmap Diagram:** A clean \`\`\`mermaid flowchart LR showing milestones for 30, 60, and 90 days.
4. **Decision & Next Steps:** Explicit decision requested from leadership.`
  },
  {
    id: 'debate',
    command: '/DEBATE',
    aliases: ['/ARGUE', '/PROS_CONS', '/DIALECTIC', '/VERSUS', '/DISCUSS'],
    title: 'Dialectic Expert Debate',
    desc: 'Adversarial debate between two world-class minds with comparison scorecards',
    icon: '⚔️',
    category: 'Strategy',
    directive: (topic) => `Stage a high-intensity, intellectually rigorous Dialectic Debate on:
"${topic}"

FORMAT:
1. **The Core Point of Contention:** State the exact dilemma in 1 sentence.
2. **Advocate A (Proponent):** 3 world-class arguments FOR the approach with real-world case evidence.
3. **Advocate B (Skeptic):** 3 sharp, devastating counter-arguments AGAINST with failure mode analysis.
4. **Side-by-Side Comparison Scorecard Table:**
   | Evaluation Dimension | Advocate A Position | Advocate B Position | Practical Winner |
   | :--- | :--- | :--- | :--- |
   | Scalability | ... | ... | ... |
   | Cost / Simplicity | ... | ... | ... |
   | Long-term Risk | ... | ... | ... |
5. **Synthesis & Strategic Recommendation:** Unify both perspectives into an actionable, stress-tested verdict.`
  },
  {
    id: 'deep_research_lens',
    command: '/DEEP_RESEARCH',
    aliases: ['/RESEARCH', '/DEEP', '/INVESTIGATE', '/MULTI_HOP'],
    title: 'Autonomous Deep Research',
    desc: 'Multi-perspective investigation, edge-case stress testing, empirical evidence & executive synthesis',
    icon: '🧠',
    category: 'Strategy & Execution',
    directive: (topic) => `Perform an exhaustive, multi-hop Autonomous Deep Research Investigation on:
"${topic}"

Execute the rigorous 4-stage research protocol:
<deep_research_journey>
[PHASE 1: SCOPING] Deconstruct the core problem, underlying assumptions, and key boundary conditions.
[PHASE 2: INVESTIGATION] Evaluate empirical evidence, conflicting engineering trade-offs, and multiple paradigms.
[PHASE 3: STRESS TESTING] Identify hidden edge cases, operational bottlenecks, failure modes, and security vulnerabilities.
[PHASE 4: SYNTHESIS] Formulate a production-grade executive roadmap with concrete recommendations.
</deep_research_journey>

FORMAT:
# 🧠 Autonomous Deep Research Report: ${topic}
## 1. Executive Problem Decomposition & Scope
## 2. Multi-Paradigm Technical & Empirical Analysis
- Provide a comparative benchmark table with quantitative metrics.
## 3. Edge-Case Matrix & Failure Mode Defense
- Outline critical failure modes, probability, impact, and defensive mitigations.
## 4. Master Action Plan & Verification Criteria
> [!IMPORTANT]
> Detail actionable milestones and clear acceptance criteria.`
  },
  {
    id: 'web_search_lens',
    command: '/SEARCH',
    aliases: ['/WEB', '/GOOGLE', '/BROWSE', '/INTERNET', '/LIVE'],
    title: 'Grounded Web Search',
    desc: 'Live real-time web retrieval, current facts, documentation & verified source citations',
    icon: '🌐',
    category: 'Education',
    directive: (topic) => `Synthesize live verified information and web grounding for:
"${topic}"

REQUIREMENTS:
1. Provide accurate, up-to-date facts with clear citation anchors ([1], [2]).
2. Include a visual comparison or timeline table if applicable.
3. Highlight official documentation links, key updates, and practical takeaways.
4. Add a "Key Takeaways" summary callout box.`
  }
];

/**
 * Custom User Lenses Management (User-isolated + cloud-synced)
 */
export function getCustomLenses(username) {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const key = username && username !== 'Guest' && username !== 'Guest Operator'
      ? `bhavya_custom_lenses_${username.toLowerCase()}`
      : 'bhavya_custom_lenses';
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomLens(username, lens) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const current = getCustomLenses(username);
    const updated = [lens, ...current.filter(l => l.id !== lens.id)];
    const key = username && username !== 'Guest' && username !== 'Guest Operator'
      ? `bhavya_custom_lenses_${username.toLowerCase()}`
      : 'bhavya_custom_lenses';
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.warn('Could not save custom lens:', e);
    return false;
  }
}

export function deleteCustomLens(username, lensId) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const current = getCustomLenses(username);
    const updated = current.filter(l => l.id !== lensId);
    const key = username && username !== 'Guest' && username !== 'Guest Operator'
      ? `bhavya_custom_lenses_${username.toLowerCase()}`
      : 'bhavya_custom_lenses';
    localStorage.setItem(key, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.warn('Could not delete custom lens:', e);
    return false;
  }
}

export function getAllPromptLenses(username) {
  const custom = getCustomLenses(username);
  const formattedCustom = custom.map(c => ({
    id: c.id || `custom_${Date.now()}`,
    command: c.command.startsWith('/') ? c.command.toUpperCase() : `/${c.command.toUpperCase()}`,
    aliases: c.aliases || [],
    title: c.title,
    desc: c.desc || 'Custom user prompt lens',
    icon: c.icon || '✨',
    category: '⭐ My Custom Lenses',
    directive: (topic) => `${c.promptTemplate || c.desc}\n\nTOPIC / INPUT:\n"${topic}"`
  }));
  return [...formattedCustom, ...PROMPT_LENSES];
}

/**
 * Checks if the user's message starts with any registered slash command or alias
 * Returns { isLens: boolean, lens: object|null, query: string }
 */
export function parsePromptLens(messageText, username = null) {
  if (!messageText || typeof messageText !== 'string') {
    return { isLens: false, lens: null, query: '' };
  }

  const trimmed = messageText.trim();
  if (!trimmed.startsWith('/')) {
    return { isLens: false, lens: null, query: trimmed };
  }

  const firstSpaceIdx = trimmed.indexOf(' ');
  const rawCommand = (firstSpaceIdx === -1 ? trimmed : trimmed.substring(0, firstSpaceIdx)).trim();
  const query = (firstSpaceIdx === -1 ? '' : trimmed.substring(firstSpaceIdx + 1)).trim();

  const upperCmd = rawCommand.toUpperCase(); // e.g. "/HANDWRITING"
  const cleanCmd = upperCmd.replace(/^\//, '').replace(/[-_]/g, ''); // e.g. "HANDWRITING"

  const lensesPool = getAllPromptLenses(username);

  // 1. Direct exact match on primary command or aliases
  let matchedLens = lensesPool.find(l => {
    if (l.command.toUpperCase() === upperCmd) return true;
    if (Array.isArray(l.aliases)) {
      return l.aliases.some(a => {
        const uA = a.toUpperCase();
        return uA === upperCmd || (uA.startsWith('/') ? uA : '/' + uA) === upperCmd;
      });
    }
    return false;
  });

  // 2. Normalized / Prefix / Substring match (e.g. /handwriting matches /HANDWRITTEN_NOTES)
  if (!matchedLens) {
    matchedLens = lensesPool.find(l => {
      const lClean = l.command.toUpperCase().replace(/^\//, '').replace(/[-_]/g, '');
      if (lClean === cleanCmd || lClean.startsWith(cleanCmd) || cleanCmd.startsWith(lClean)) return true;
      if (Array.isArray(l.aliases)) {
        return l.aliases.some(a => {
          const aClean = a.toUpperCase().replace(/^\//, '').replace(/[-_]/g, '');
          return aClean === cleanCmd || aClean.startsWith(cleanCmd) || cleanCmd.startsWith(aClean);
        });
      }
      return false;
    });
  }

  if (matchedLens) {
    return {
      isLens: true,
      lens: matchedLens,
      query: query || "Explain the core mechanics, practical takeaways, and key steps."
    };
  }

  return { isLens: false, lens: null, query: trimmed };
}
