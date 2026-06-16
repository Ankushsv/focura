import { uid, type Subtask } from "./types";

const TEMPLATES: Array<(title: string) => string> = [
  (t) => `Open everything you need for \u201c${t}\u201d — tabs, files, tools`,
  () => "Write one sentence describing what \u201cdone\u201d looks like",
  (t) => `Do the smallest visible piece of \u201c${t}\u201d (5 minutes)`,
  () => "Push through one focused middle chunk — just one",
  () => "Review, tidy up, and mark it done — you earned this one",
];

export async function generateBreakdown(title: string): Promise<Subtask[]> {
  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "breakdown",
        title,
      }),
    });

    if (!response.ok) throw new Error("API failed");
    const data = await response.json();
    return data.subtasks.map((st: any) => ({
      id: uid(),
      text: st.text,
      xp: st.xp,
      done: false,
    }));
  } catch (error) {
    console.warn("AI breakdown failed, falling back to templates:", error);
    // Fallback template
    return TEMPLATES.map((fn) => ({
      id: uid(),
      text: fn(title),
      xp: 5 + Math.floor(Math.random() * 11),
      done: false,
    }));
  }
}

const MICRO_STEPS: Array<(title: string) => string> = [
  (t) => `Set a 2-minute timer and just open \u201c${t}\u201d. That is the whole mission.`,
  (t) => `Write one messy sentence about \u201c${t}\u201d. Quality is illegal for 2 minutes.`,
  (t) => `Do the tiniest physical step of \u201c${t}\u201d — open the file, the tab, the doc.`,
];

export async function generateMicroStep(title: string): Promise<string> {
  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "rescue",
        title,
      }),
    });

    if (!response.ok) throw new Error("API failed");
    const data = await response.json();
    return data.step;
  } catch (error) {
    console.warn("AI micro-step failed, falling back to template:", error);
    return MICRO_STEPS[Math.floor(Math.random() * MICRO_STEPS.length)](title);
  }
}
