export type NodeStatus = "locked" | "available" | "done";

export interface PathNode {
  id: string;
  label: string;
  description: string;
  xp: number;
  status: NodeStatus;
  children: string[]; // ids of child nodes
}

export interface MasteryPath {
  id: string;
  title: string;
  goal: string;
  category: "coding" | "fitness" | "learning" | "creative" | "other";
  createdAt: number;
  nodes: PathNode[];
}

export const CATEGORY_ICONS: Record<MasteryPath["category"], string> = {
  coding: "💻",
  fitness: "🏋️",
  learning: "📚",
  creative: "🎨",
  other: "⭐",
};

export const CATEGORY_COLORS: Record<MasteryPath["category"], string> = {
  coding: "#8b5cf6",
  fitness: "#22d3ee",
  learning: "#fbbf24",
  creative: "#f43f5e",
  other: "#a3a3a3",
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function makeNode(
  label: string,
  description: string,
  xp: number,
  children: string[] = [],
  status: NodeStatus = "locked"
): PathNode {
  return { id: uid(), label, description, xp, status, children };
}

export function generateSkillTree(
  category: MasteryPath["category"]
): PathNode[] {
  const templates: Record<
    MasteryPath["category"],
    Array<[string, string, number]>
  > = {
    coding: [
      ["Foundations", "Master the basics of your language", 30],
      ["Functions & Logic", "Write clean, reusable functions", 35],
      ["Data Structures", "Arrays, maps, and beyond", 40],
      ["Async & APIs", "Fetch data like a pro", 45],
      ["Testing", "Write code that proves itself", 40],
      ["System Design", "Architect scalable solutions", 60],
    ],
    fitness: [
      ["Consistency", "Show up 3x this week", 25],
      ["Form & Technique", "Quality over quantity", 30],
      ["Progressive Overload", "Beat last week's numbers", 35],
      ["Recovery", "Rest is training too", 25],
      ["Nutrition Basics", "Fuel the machine", 30],
      ["Peak Performance", "Personal record week", 50],
    ],
    learning: [
      ["First Principles", "Understand the why, not just the what", 25],
      ["Active Recall", "Test yourself before the test", 30],
      ["Spaced Repetition", "Review at the right intervals", 35],
      ["Deep Work", "2 hours of zero distraction study", 40],
      ["Teach It Back", "Explain it to someone else", 35],
      ["Mastery Project", "Apply everything in one project", 60],
    ],
    creative: [
      ["Daily Practice", "Create something every day for a week", 25],
      ["Study the Masters", "Analyze work you admire", 30],
      ["Constraints", "Create within strict limits", 35],
      ["Feedback Loop", "Share and get feedback", 35],
      ["Style Development", "Find your unique voice", 45],
      ["Signature Work", "Create your best piece yet", 60],
    ],
    other: [
      ["Getting Started", "Take the first step", 20],
      ["Build Momentum", "Three days in a row", 25],
      ["Deepen the Skill", "Go past the surface", 35],
      ["Overcome a Challenge", "Push through the hard part", 40],
      ["Share the Progress", "Show your work", 30],
      ["Level Complete", "You've done it", 50],
    ],
  };

  const steps = templates[category];
  const nodes: PathNode[] = steps.map(([label, description, xp]) =>
    makeNode(label, description, xp)
  );

  // Chain nodes: each node's children = next node
  for (let i = 0; i < nodes.length - 1; i++) {
    nodes[i].children = [nodes[i + 1].id];
  }

  // First node is always available
  nodes[0].status = "available";

  return nodes;
}
