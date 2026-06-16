import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { type, title } = await req.json();

    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Cerebras API key not found in server environment." },
        { status: 500 }
      );
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "A valid task title is required." },
        { status: 400 }
      );
    }

    if (type === "breakdown") {
      // 1. Task Breakdown logic
      const systemPrompt = `You are an AI Productivity Assistant specializing in ADHD-friendly task breakdown.
Your goal is to break down a larger task into exactly 5 progressive subtasks.
Keep each subtask action-oriented, simple, and low-friction (especially the first few).
Assign an XP value (a number between 5 and 15) to each subtask representing its relative effort.

You must respond with a JSON array of objects, where each object has:
- "text": A concise, clear, and encouraging subtask title.
- "xp": An integer between 5 and 15.

Response Format:
[
  { "text": "Subtask text here", "xp": 10 },
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
            { role: "user", content: `Break down the task: "${title}"` },
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

      // Clean markdown code blocks if Llama includes them
      const cleanedJson = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/, "")
        .replace(/```\s*$/, "")
        .trim();

      const subtasks = JSON.parse(cleanedJson);
      if (!Array.isArray(subtasks) || subtasks.length === 0) {
        throw new Error("Invalid subtasks format returned from AI.");
      }

      return NextResponse.json({ subtasks });
    } else if (type === "rescue") {
      // 2. Micro-step Rescue logic
      const systemPrompt = `You are Focura's AI Coach helping an ADHD user who is completely stuck and overwhelmed by a task.
Generate exactly ONE actionable 2-minute micro-step to help them break inertia.
The step must be incredibly easy, mechanical, and low-friction. 
For example: "Just open the file and write a title," or "Open the browser tab and read one sentence."
Limit your response to a single, encouraging sentence (max 25 words). Do not include any tags, markdown, or chat headers.`;

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
            { role: "user", content: `I'm stuck on: "${title}"` },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Cerebras API status: ${response.statusText}`);
      }

      const data = await response.json();
      const rescueStep = (data.choices?.[0]?.message?.content || "").trim();

      return NextResponse.json({ step: rescueStep });
    } else {
      return NextResponse.json(
        { error: `Invalid operation type: ${type}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Tasks API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
