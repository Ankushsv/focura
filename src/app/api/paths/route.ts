import { NextResponse } from "next/server";

// Simple ID generator matching the lib
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: Request) {
  try {
    const { title, goal, category } = await req.json();

    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Cerebras API key not found in server environment." },
        { status: 500 }
      );
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "A valid path title is required." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are Focura's AI Curriculum Designer, an expert at breaking down long-term skills and goals into a clear, ADHD-friendly sequential roadmap (skill tree).
Your job is to generate exactly 6 progressive milestones (nodes) for the path: "${title}" (Goal: "${goal || "None specified"}").
Each milestone must feel achievable, encouraging, and represent a logical step in a sequential progression from beginner to expert.
Assign an XP value (a number between 25 and 60) to each milestone representing its relative effort.

You must respond with a JSON array containing exactly 6 objects, where each object has:
- "label": A short, motivating title for the milestone (e.g., "Master Hiragana", "Your First 5K Run").
- "description": A concise, action-oriented, and encouraging sentence about what to do in this milestone.
- "xp": An integer between 25 and 60.

Response Format:
[
  { "label": "Milestone Label", "description": "Milestone description", "xp": 30 },
  ...
]

Do not include any chat wrapper, markdown block markers, explanation, or notes. Output ONLY the JSON array.`;

    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "zai-glm-4.7",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate a 6-step roadmap for: "${title}"` },
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cerebras API status: ${response.statusText}`);
    }

    const data = await response.json();
    const content = (data.choices?.[0]?.message?.content || "").trim();

    // Clean markdown code blocks
    const cleanedJson = content
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/, "")
      .replace(/```\s*$/, "")
      .trim();

    const rawNodes = JSON.parse(cleanedJson);
    if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
      throw new Error("Invalid roadmap format returned from AI.");
    }

    // Convert raw nodes into the Focura PathNode structure
    const nodes = rawNodes.map((n: any) => ({
      id: uid(),
      label: n.label,
      description: n.description,
      xp: n.xp || 30,
      status: "locked",
      children: [] as string[],
    }));

    // Chain nodes sequentially
    for (let i = 0; i < nodes.length - 1; i++) {
      nodes[i].children = [nodes[i + 1].id];
    }

    // First node is available
    if (nodes.length > 0) {
      nodes[0].status = "available";
    }

    return NextResponse.json({ nodes });
  } catch (error: any) {
    console.error("Paths API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
