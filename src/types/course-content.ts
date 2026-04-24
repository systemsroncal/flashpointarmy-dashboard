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
  type: "tf" | "single" | "multi";
  promptHtml: string;
  points: number;
  /** For true/false questions */
  correctTrue?: boolean;
  options?: QuizOption[];
};

export type QuizElementPayload = {
  maxPoints: number;
  questions: QuizQuestion[];
};

/** Client → server when submitting a quiz */
export type QuizAnswersPayload = Record<string, unknown>;
