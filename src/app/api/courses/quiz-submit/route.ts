import { gradeQuizPayload } from "@/lib/courses/grade-quiz";
import type { QuizElementPayload } from "@/types/course-content";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: { elementId?: string; answers?: Record<string, unknown> };
  try {
    body = (await req.json()) as { elementId?: string; answers?: Record<string, unknown> };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const elementId = body.elementId?.trim();
  if (!elementId) {
    return NextResponse.json({ error: "Missing elementId." }, { status: 400 });
  }

  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};

  const { data: el, error: elErr } = await supabase
    .from("course_elements")
    .select("id, element_type, payload, session_id")
    .eq("id", elementId)
    .maybeSingle();

  if (elErr || !el || el.element_type !== "quiz") {
    return NextResponse.json({ error: "Quiz not found." }, { status: 404 });
  }

  const payload = el.payload as QuizElementPayload;
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.questions)) {
    return NextResponse.json({ error: "Invalid quiz configuration." }, { status: 400 });
  }

  const { score, maxScore } = gradeQuizPayload(payload, answers);

  const { error: upErr } = await supabase.from("course_quiz_results").upsert(
    {
      user_id: user.id,
      element_id: elementId,
      score,
      max_score: maxScore,
      answers,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "user_id,element_id" }
  );

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, score, maxScore });
}
