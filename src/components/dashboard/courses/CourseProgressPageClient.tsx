"use client";

import { CourseCompletionComparison } from "@/components/dashboard/courses/CourseCompletionComparison";
import {
  CourseProgressUsersTable,
  type CourseProgressRow,
} from "@/components/dashboard/courses/CourseProgressUsersTable";
import type { CourseCompletionRow } from "@/lib/courses/course-completion-stats";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link as MuiLink,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";

export type ProgressRoleFilter = "all" | "member" | "leader";

type Props = {
  courseTitle: string;
  courseSlug: string;
  courseId: string;
  rows: CourseProgressRow[];
  totalSessions: number;
  quizCount: number;
  appliesGrades: boolean;
  completionRow: CourseCompletionRow;
  totalRegisteredUsers: number;
  totalWithProgress: number;
};

function filterByRole(rows: CourseProgressRow[], filter: ProgressRoleFilter): CourseProgressRow[] {
  if (filter === "all") return rows.filter((r) => r.roleBucket === "member" || r.roleBucket === "leader");
  if (filter === "member") return rows.filter((r) => r.roleBucket === "member");
  return rows.filter((r) => r.roleBucket === "leader");
}

export function CourseProgressPageClient({
  courseTitle,
  courseSlug,
  courseId,
  rows,
  totalSessions,
  quizCount,
  appliesGrades,
  completionRow,
  totalRegisteredUsers,
  totalWithProgress,
}: Props) {
  const [roleFilter, setRoleFilter] = useState<ProgressRoleFilter>("all");

  const filteredRows = useMemo(() => filterByRole(rows, roleFilter), [rows, roleFilter]);

  const memberLeaderTotal = useMemo(
    () => rows.filter((r) => r.roleBucket === "member" || r.roleBucket === "leader").length,
    [rows]
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 1 }}>
        Progress — {courseTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Public URL: /dashboard/course/{courseSlug}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
        <strong>{totalWithProgress}</strong> users have session activity in this course (
        {memberLeaderTotal} members or local leaders). That is expected: the list only includes people who
        opened or progressed at least one session — not all{" "}
        <strong>{totalRegisteredUsers.toLocaleString()}</strong> registered dashboard users. Admins and
        staff without a member/local leader role are excluded from the default view (same buckets as{" "}
        <MuiLink component={Link} href="/dashboard/reports" underline="hover" color="primary.light">
          Reports
        </MuiLink>
        ).
      </Typography>

      <Accordion
        defaultExpanded={false}
        disableGutters
        elevation={0}
        sx={{
          mb: 2.5,
          bgcolor: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,215,0,0.14)",
          borderRadius: 1,
          "&::before": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "primary.main" }} />}>
          <Box>
            <Typography variant="subtitle1" sx={{ color: "#90be6d", fontWeight: 700 }}>
              Course completion comparison
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Local leaders vs. members — started and completed every session (same chart as Reports)
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <CourseCompletionComparison courses={[completionRow]} fixedCourseId={courseId} />
        </AccordionDetails>
      </Accordion>

      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend" sx={{ color: "text.secondary", fontSize: "0.875rem", mb: 0.5 }}>
          Show users
        </FormLabel>
        <RadioGroup
          row
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as ProgressRoleFilter)}
        >
          <FormControlLabel value="all" control={<Radio size="small" />} label="Members + local leaders" />
          <FormControlLabel value="member" control={<Radio size="small" />} label="Members only" />
          <FormControlLabel value="leader" control={<Radio size="small" />} label="Local leaders only" />
        </RadioGroup>
      </FormControl>

      <CourseProgressUsersTable
        rows={filteredRows}
        totalSessions={totalSessions}
        quizCount={quizCount}
      />

      {!appliesGrades ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          This course has grades disabled; quiz scores are still listed per attempt when quizzes exist.
        </Typography>
      ) : null}
    </Box>
  );
}
