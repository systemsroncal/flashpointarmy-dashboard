export type CourseElementType =
  | "plain_text"
  | "rich_text"
  | "video"
  | "pdf"
  | "image"
  | "quiz";

export type VideoElementPayload = { url: string };

export type PdfElementPayload = { url: string; fileName?: string | null };

export type ImageElementPayload = { url: string };

export type QuizOption = { id: string; labelHtml: string; correct: boolean };

export type QuizQuestion = {
  id: string;
  type: "tf" | "single" | "multi" | "text";
  promptHtml: string;
  points: number;
  /** True/false (HTML labels optional). */
  correctTrue?: boolean;
  trueLabelHtml?: string;
  falseLabelHtml?: string;
  options?: QuizOption[];
  /** For `text`: each string is trimmed, case-insensitive match. */
  acceptableAnswers?: string[];
};

export type QuizElementPayload = {
  /** If null/omitted/empty in UI → effective max score = sum(question.points). */
  maxPoints?: number | null;
  questions: QuizQuestion[];
};

/** Client → server when submitting a quiz */
export type QuizAnswersPayload = Record<string, unknown>;
