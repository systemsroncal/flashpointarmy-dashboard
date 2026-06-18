"use client";

import { CourseCompletionComparison } from "@/components/dashboard/courses/CourseCompletionComparison";
import {
  CourseProgressUsersTable,
  type CourseProgressRow,
} from "@/components/dashboard/courses/CourseProgressUsersTable";
import type { CourseCompletionRow } from "@/lib/courses/course-completion-stats";
import DownloadOutlined from "@mui/icons-material/DownloadOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  Link as MuiLink,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useMemo, useState } from "react";
import { StateChapterFilterControls } from "@/components/forms/StateChapterFilterControls";
import { matchesStateChapterFilter, type ChapterSearchRow } from "@/lib/chapters/chapter-search";
import { downloadExcelFromApi } from "@/lib/export/download-xlsx-client";

export type ProgressRoleFilter = "all" | "member" | "leader";

type Props = {
  courseTitle: string;
  courseSlug: string;
  courseId: string;
  rows: CourseProgressRow[];
  chapterOptions: ChapterSearchRow[];
  totalSessions: number;
  quizOnlySessionCount?: number;
  quizCount: number;
  appliesGrades: boolean;
  completionRow: CourseCompletionRow;
  totalRegisteredUsers: number;
  totalWithProgress: number;
  isSuperAdmin?: boolean;
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
  chapterOptions,
  totalSessions,
  quizOnlySessionCount = 0,
  quizCount,
  appliesGrades,
  completionRow,
  totalRegisteredUsers,
  totalWithProgress,
  isSuperAdmin = false,
}: Props) {
  const [roleFilter, setRoleFilter] = useState<ProgressRoleFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterChapterId, setFilterChapterId] = useState("all");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const filteredRows = useMemo(() => {
    let list = filterByRole(rows, roleFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const blob = [r.label, r.city ?? "", r.state ?? "", r.roleLabel].join(" ").toLowerCase();
        return blob.includes(q);
      });
    }
    list = list.filter((r) =>
      matchesStateChapterFilter(r.primaryChapterId, chapterOptions, filterState, filterChapterId)
    );
    return list;
  }, [rows, roleFilter, searchQuery, filterState, filterChapterId, chapterOptions]);

  const memberLeaderTotal = useMemo(
    () => rows.filter((r) => r.roleBucket === "member" || r.roleBucket === "leader").length,
    [rows]
  );

  async function handleExportExcel() {
    setExporting(true);
    setExportError(null);
    try {
      const params = new URLSearchParams({
        courseId,
        role: roleFilter,
        chapterId: filterChapterId,
        state: filterState,
      });
      await downloadExcelFromApi(
        `/api/export/course-progress?${params.toString()}`,
        `course-progress-${courseSlug}.xlsx`
      );
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ color: "primary.main", mb: 1 }}>
        Progress — {courseTitle}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Public URL: /dashboard/course/{courseSlug}
      </Typography>
      {quizOnlySessionCount > 0 ? (
        <Typography variant="body2" color="warning.main" sx={{ mb: 1.5, lineHeight: 1.55 }}>
          Progress uses <strong>{totalSessions}</strong> learner sessions only.{" "}
          <strong>{quizOnlySessionCount}</strong> quiz-only session
          {quizOnlySessionCount === 1 ? "" : "s"} in the editor are hidden from the course grid and not
          required for 100% completion.
        </Typography>
      ) : null}
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

      {exportError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      ) : null}

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

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 1.5,
          mb: 2,
          alignItems: { md: "flex-start" },
          width: "100%",
          minWidth: 0,
        }}
      >
        <TextField
          size="small"
          label="Search"
          placeholder="Name, city, state, role…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            width: { xs: "100%", md: "auto" },
            flex: { md: "1 1 280px" },
            minWidth: { md: 260 },
            maxWidth: { md: 480 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        {chapterOptions.length > 0 ? (
          <StateChapterFilterControls
            chapters={chapterOptions}
            filterState={filterState}
            filterChapterId={filterChapterId}
            onStateChange={setFilterState}
            onChapterChange={setFilterChapterId}
          />
        ) : null}
        {isSuperAdmin ? (
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadOutlined />}
          disabled={exporting}
          onClick={() => void handleExportExcel()}
          sx={{ alignSelf: { xs: "stretch", md: "flex-start" }, whiteSpace: "nowrap" }}
        >
          {exporting ? "Exporting…" : "Export to Excel"}
        </Button>
        ) : null}
      </Box>

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
