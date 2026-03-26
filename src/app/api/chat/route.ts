import { NextResponse } from "next/server";
import { generateWithFallback } from "../../../lib/llm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, answers } = body;

    const formattedAnswers =
      answers && typeof answers === "object"
        ? Object.entries(answers)
            .map(([q, a]) => `${q}: ${String(a)}`)
            .join("\n")
        : "";

    const prompt = `
You are a healthcare triage assistant.

Do NOT give a final diagnosis.
Keep the response crisp, practical, and easy to understand.

Return ONLY in this exact format:

Concern area: <very short>
Urgency: <Low / Moderate / High>
Recommended doctor: <General Physician / ENT / Dermatologist / Gynecologist / Orthopedic / Cardiologist / Neurologist / Gastroenterologist / Pulmonologist / Psychiatrist / Emergency Medicine / other>
What to do now:
- <point 1>
- <point 2>
- <point 3>

Emergency warning:
- <only if needed, otherwise write "No immediate red-flag emergency signs from the current answers.">

Do not add extra headings.
Do not write long paragraphs.
Do not use markdown bold.

Patient message:
${message || "No additional message"}

Assessment answers:
${formattedAnswers}
`;

    const result = await generateWithFallback(prompt);

    return NextResponse.json({
      reply: result.text,
      provider: result.provider,
      model: result.model,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Unknown error occurred while generating AI response.",
      },
      { status: 500 }
    );
  }
}