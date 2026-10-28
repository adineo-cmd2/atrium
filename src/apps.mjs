/* The ten rooms of the Atrium.
 *
 * This file is metadata only. The build reads each app's own frontend output
 * and never reads a backend database, a search index, or a saved session.
 */
export const apps = [
  {
    slug: "socratic-debate-partner",
    name: "Socratic Debate Partner",
    short: "Socratic",
    tagline: "It never tells you the answer. It sharpens the question.",
    description:
      "Argues the other side, maps the reasoning chain, and presses on the weakest link.",
    accent: "#e2b155",
    accentInk: "#221703",
    port: 8001,
    routes: ["profile", "reasoning graph", "session", "settings"],
    repo: "https://github.com/adineo-cmd2/socratic-debate-partner",
  },
  {
    slug: "cognitive-bias-detector",
    name: "Bias Mirror",
    short: "Bias Mirror",
    tagline: "Your writing, turned into a mirror.",
    description:
      "Finds cognitive patterns in your own drafts, with a quoted passage for every flag.",
    accent: "#b23a26",
    accentInk: "#fff8f2",
    port: 8002,
    routes: ["upload", "bias map", "explorer", "timeline", "settings"],
    repo: "https://github.com/adineo-cmd2/cognitive-bias-detector",
  },
  {
    slug: "contradiction-finder",
    name: "ContraLens",
    short: "ContraLens",
    tagline: "Find where your sources disagree.",
    description:
      "Extracts claims across a corpus and ranks the pairs that contradict each other.",
    accent: "#b45309",
    accentInk: "#fffbf2",
    port: 8003,
    routes: ["corpus", "document", "contradictions", "network", "settings"],
    repo: "https://github.com/adineo-cmd2/contradiction-finder",
  },
  {
    slug: "unknown-research-engine",
    name: "Unknown Engine",
    short: "Unknown",
    tagline: "Not what's known. What isn't.",
    description:
      "Draws the known boundary of a field and maps its open questions and gaps.",
    accent: "#0d7d72",
    accentInk: "#f2fefc",
    port: 8004,
    routes: ["analyse", "known boundary", "gap map", "sessions", "settings"],
    repo: "https://github.com/adineo-cmd2/unknown-research-engine",
  },
  {
    slug: "ai-showrunner",
    name: "AI Showrunner",
    short: "Showrunner",
    tagline: "The writers' room never forgets.",
    description:
      "Keeps a living story bible and checks every episode for continuity and unpaid setups.",
    accent: "#f59e0b",
    accentInk: "#1c1204",
    port: 8005,
    routes: ["story bible", "continuity", "episode editor", "threads", "settings"],
    repo: "https://github.com/adineo-cmd2/ai-showrunner",
  },
  {
    slug: "counterfactual-history",
    name: "Counterfactual History",
    short: "Counterfactual",
    tagline: "Change one thing. Watch history rewrite itself.",
    description:
      "Builds alternate history branches from a divergence point and compares timelines side by side.",
    accent: "#a91f1f",
    accentInk: "#fff7ee",
    port: 8006,
    routes: ["library", "start", "branch explorer", "compare", "timeline"],
    repo: "https://github.com/adineo-cmd2/counterfactual-history",
  },
  {
    slug: "architecture-archaeologist",
    name: "Architecture Archaeologist",
    short: "Archaeologist",
    tagline: "Dig up what the dev was thinking.",
    description:
      "Ingests a codebase, reconstructs its architecture, and answers questions with evidence.",
    accent: "#4ade80",
    accentInk: "#03170b",
    port: 8007,
    routes: ["ingest", "explorer", "ask", "report", "settings"],
    repo: "https://github.com/adineo-cmd2/architecture-archaeologist",
  },
  {
    slug: "code-optimizer",
    name: "Code Optimizer",
    short: "Optimizer",
    tagline: "Optimize for the traffic you actually have.",
    description:
      "Profiles hotspots and proposes measured optimizations with diffs and tradeoffs.",
    accent: "#3fb950",
    accentInk: "#04170a",
    port: 8008,
    routes: ["submit", "analysis", "diff", "history", "settings"],
    repo: "https://github.com/adineo-cmd2/code-optimizer",
  },
  {
    slug: "policy-simulator",
    name: "Policy Simulator",
    short: "Policy",
    tagline: "Trace a policy past its first-order effects.",
    description:
      "Models a policy's effects across groups, with stakeholders, demographics, and history.",
    accent: "#1e3a5f",
    accentInk: "#fffaf0",
    port: 8009,
    routes: ["submit", "impact", "compare", "history", "settings"],
    repo: "https://github.com/adineo-cmd2/policy-simulator",
  },
  {
    slug: "premortem-engine",
    name: "Premortem Engine",
    short: "Premortem",
    tagline: "Imagine the failure before it happens.",
    description:
      "Generates failure scenarios, ranks risks, and tracks mitigations before launch.",
    accent: "#c2372c",
    accentInk: "#fff6f4",
    port: 8010,
    routes: ["submit", "scenarios", "mitigations", "report", "history", "settings"],
    repo: "https://github.com/adineo-cmd2/premortem-engine",
  },
];
