/** Shared shape for GET /api/reports/presence-daily and the Reports UI. */

export const PRESENCE_REPORT_DAYS = 30;

export type PresenceDemographicRow = {
  state: string;
  activeUsers: number;
  percent: number;
};

export type PresenceOverviewSummary = {
  activeToday: number;
  activeYesterday: number;
  distinctLast30Days: number;
  registrationsLast30Days: number;
  peakDayCount: number;
  peakDayLabel: string;
  todayVsYesterdayPercent: number | null;
};

export type PresenceDailyPayload = {
  categories: string[];
  activeUsersByDay: number[];
  summary: PresenceOverviewSummary;
  demographicsByState: PresenceDemographicRow[];
  note: string;
};
