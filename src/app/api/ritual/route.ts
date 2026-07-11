import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { avoidingTask } = await req.json();

    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Cerebras API key not found in server environment." },
        { status: 500 }
      );
    }

    const systemPrompt = `You are the Familiar in Focura, a companion for ADHD users. The user is stuck and cannot start a task.

Generate a ritual of 1-3 micro-steps that will physically walk them into starting the task they are avoiding. Each step must:
- Take under 30 seconds to complete
- Be a physical action with a clear "done" state (open, find, read, write, click, locate — never "think" or "plan")
- Be so small it feels almost silly
- Follow naturally from the previous step
- The last step should leave them literally inside the task

Classic patterns:
For any digital task:
  Step 1: "Open [specific app/file]"
  Step 2: "Find [specific thing] in it"
  Step 3: "Write [your name / first word / function name] at the top"

For reading/research:
  Step 1: "Open the document/page"
  Step 2: "Read just the title and first paragraph"

For scary creative tasks:
  Step 1: "Open a blank document"
  Step 2: "Type the date at the top"
  Step 3: "Write one sentence — even a bad one"

Return ONLY a JSON object, no markdown, no code fences:
{
  "opening_line": "string (1 sentence, warm and specific to their task, Familiar voice, never preachy)",
  "steps": [
    {
      "id": 1,
      "action": "string (the micro-step, imperative verb, under 8 words)",
      "detail": "string (optional extra context, under 12 words, or null)"
    }
  ],
  "step_count": number
}

Maximum 3 steps. Minimum 1.
The opening_line should acknowledge the specific task, not be generic.`;

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
          {
            role: "user",
            content: `I'm stuck on: "${avoidingTask}"`,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cerebras API Error:", errorText);
      return NextResponse.json(
        { error: `Cerebras API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Strip any markdown code fences the model might wrap around JSON
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    try {
      const ritual = JSON.parse(cleaned);
      return NextResponse.json({ ritual });
    } catch {
      // If the model doesn't return valid JSON, send a safe fallback
      console.warn("Failed to parse ritual JSON from Cerebras, raw:", raw);
      return NextResponse.json({
        ritual: {
          opening_line: "Let's just get one tiny thing done together.",
          steps: [
            {
              id: 1,
              action: "Open whatever you need for this task",
              detail: "Just open it — nothing else yet",
            },
            {
              id: 2,
              action: "Find the exact spot where you'd start",
              detail: null,
            },
            {
              id: 3,
              action: "Type or write one single word there",
              detail: "Even your name counts",
            },
          ],
          step_count: 3,
        },
      });
    }
  } catch (error: any) {
    console.error("Ritual API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
