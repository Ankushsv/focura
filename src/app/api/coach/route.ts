import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, sessions, tasks } = await req.json();

    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Cerebras API key not found in server environment." },
        { status: 500 }
      );
    }

    // 1. Compile User Stats for context
    const totalSessions = sessions?.length || 0;
    const completedTasks = tasks?.filter((t: any) => t.done)?.length || 0;
    const totalTasks = tasks?.length || 0;
    const avgSessionMinutes =
      totalSessions > 0
        ? Math.round(
            sessions.reduce((acc: number, s: any) => acc + (s.actualMinutes || 0), 0) /
              totalSessions
          )
        : 0;

    // 2. Build contextual system prompt
    const systemPrompt = `You are Focura's AI Coach, a friendly, compassionate, and highly practical guide tailored for ADHD and neurodivergent brains. 
Your tone is encouraging, non-judgmental, warm, and highly action-oriented. You understand executive dysfunction, rejection sensitive dysphoria (RSD), hyperfocus, and overwhelm.

Keep your responses concise, readable, and structured. Use bullet points or short paragraphs. Avoid long blocks of text.

When helping the user:
- Recommend breaking big goals down into tiny, low-friction micro-steps (e.g. "Just open the document" or "Spend 2 minutes on it").
- Value progress over perfection.
- Suggest using the Pomodoro/Focus Timer, listening to Brown Noise in the Ambient Studio, or checking in on Consistency Shields.
- Integrate the user's progress statistics directly to celebrate their wins!

Current User Stats:
- Completed Quests (Tasks): ${completedTasks} out of ${totalTasks}
- Focus Sessions Logged: ${totalSessions}
- Average Focus Session Duration: ${avgSessionMinutes} minutes

Format your response in GitHub-style Markdown. Keep responses relatively short so they are easy to digest.`;

    // 3. Map messages to OpenAI format
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === "coach" ? "assistant" : "user",
        content: m.text,
      })),
    ];

    // 4. Send request to Cerebras Systems API
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "zai-glm-4.7",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cerebras API Error response:", errorText);
      return NextResponse.json(
        { error: `Cerebras API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Coach API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
