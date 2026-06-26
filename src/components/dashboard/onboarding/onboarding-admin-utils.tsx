"use client";

import { formatOnboardingStepLabel } from "@/lib/onboarding/member-onboarding-status";
import { Chip } from "@mui/material";

export function OnboardingStatusChip({ status }: { status: string }) {
  let color: "default" | "warning" | "success" | "info" = "default";
  if (status === "completed") color = "success";
  else if (status === "in_progress") color = "warning";
  else if (status === "pending") color = "info";
  return <Chip size="small" label={formatOnboardingStepLabel(status)} color={color} variant="outlined" />;
}

export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  const t = value.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function formatCoachMeetingWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}
