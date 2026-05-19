/** Shared shape for GET /api/reports/presence-daily and the Reports UI. */

import type { PresenceDateRange, PresenceRangePreset } from "@/lib/reports/presence-range";

export type PresenceDemographicRow = {
  state: string;
  stateName: string;
  activeUsers: number;
  percent: number;
};

export type PresenceCityDemographicRow = {
  city: string;
  state: string;
  stateName: string;
  label: string;
  activeUsers: number;
  percent: number;
  lng: number;
  lat: number;
};

export type PresenceOverviewSummary = {
  activeToday: number;
  activeYesterday: number;
  distinctInRange: number;
  registrationsInRange: number;
  peakDayCount: number;
  peakDayLabel: string;
  todayVsYesterdayPercent: number | null;
};

export type PresenceDailyPayload = {
  range: {
    preset: PresenceRangePreset;
    from: string;
    to: string;
    dayCount: number;
  };
  categories: string[];
  activeUsersByDay: number[];
  summary: PresenceOverviewSummary;
  demographicsByState: PresenceDemographicRow[];
  demographicsByCity: PresenceCityDemographicRow[];
  note: string;
};
