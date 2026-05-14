/** Shared shape for GET /api/reports/presence-daily and the Reports UI. */
export type PresenceDailyPayload = {
  categories: string[];
  activeUsersByDay: number[];
  note: string;
};
