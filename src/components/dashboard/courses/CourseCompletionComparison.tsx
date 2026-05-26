"use client";

import type { CourseCompletionRow } from "@/lib/courses/course-completion-stats";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const baseOpts: ApexOptions = {
  chart: {
    toolbar: { show: true },
    zoom: { enabled: true },
    foreColor: "rgba(255,255,255,0.72)",
    background: "transparent",
  },
  theme: { mode: "dark" },
  grid: { borderColor: "rgba(255,215,0,0.14)" },
  dataLabels: { enabled: false },
};

type Props = {
  courses: CourseCompletionRow[];
  /** Locks to one course and hides the course picker (course progress page). */
  fixedCourseId?: string;
};

export function CourseCompletionComparison({ courses, fixedCourseId }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState(fixedCourseId ?? "");

  useEffect(() => {
    if (fixedCourseId) {
      setSelectedCourseId(fixedCourseId);
      return;
    }
    if (courses.length === 0) {
      setSelectedCourseId("");
      return;
    }
    setSelectedCourseId((cur) =>
      cur && courses.some((c) => c.courseId === cur) ? cur : (courses[0]?.courseId ?? "")
    );
  }, [courses, fixedCourseId]);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.courseId === selectedCourseId) ?? null,
    [courses, selectedCourseId]
  );

  const courseCompletionOpts = useMemo((): ApexOptions => {
    const courseLabel = selectedCourse?.title ?? "course";
    return {
      ...baseOpts,
      chart: { ...baseOpts.chart, id: `course-completion-${selectedCourseId}`, type: "bar", stacked: false },
      plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: "55%" } },
      xaxis: {
        categories: ["Started", "Completed"],
        title: { text: undefined },
      },
      yaxis: { min: 0, decimalsInFloat: 0, title: { text: "Users" } },
      colors: ["#4cc9f0", "#e9c46a"],
      legend: { position: "top" },
      title: {
        text: `Leaders vs. Members — ${courseLabel}`,
        style: { color: "#90be6d" },
      },
      tooltip: { shared: true, intersect: false },
      dataLabels: { enabled: true },
    };
  }, [selectedCourse, selectedCourseId]);

  if (courses.length === 0 || !selectedCourse) {
    return (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <Typography color="text.secondary">No published courses with student progress yet.</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {!fixedCourseId && courses.length > 1 ? (
        <FormControl size="small" sx={{ minWidth: 240, alignSelf: { md: "flex-end" } }}>
          <InputLabel id="course-completion-course-label">Course</InputLabel>
          <Select
            labelId="course-completion-course-label"
            label="Course"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(String(e.target.value))}
          >
            {courses.map((c) => (
              <MenuItem key={c.courseId} value={c.courseId}>
                {c.title || c.courseId.slice(0, 6)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip
          size="small"
          color="info"
          variant="outlined"
          label={`Leaders: ${selectedCourse.leaderCompleted} / ${selectedCourse.leaderStarted} (${selectedCourse.leaderPercent}%)`}
        />
        <Chip
          size="small"
          color="warning"
          variant="outlined"
          label={`Members: ${selectedCourse.memberCompleted} / ${selectedCourse.memberStarted} (${selectedCourse.memberPercent}%)`}
        />
        <Chip size="small" variant="outlined" label={`Sessions in course: ${selectedCourse.totalSessions}`} />
      </Stack>

      <Chart
        type="bar"
        height={320}
        series={[
          {
            name: "Local leaders",
            data: [selectedCourse.leaderStarted, selectedCourse.leaderCompleted],
          },
          {
            name: "Members",
            data: [selectedCourse.memberStarted, selectedCourse.memberCompleted],
          },
        ]}
        options={courseCompletionOpts}
      />

      <TableContainer component={Paper} sx={{ bgcolor: "transparent", boxShadow: "none" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Role bucket</TableCell>
              <TableCell align="right">Started</TableCell>
              <TableCell align="right">Completed</TableCell>
              <TableCell sx={{ minWidth: 220 }}>Completion</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(
              [
                {
                  key: "leader",
                  label: "Local leaders",
                  started: selectedCourse.leaderStarted,
                  completed: selectedCourse.leaderCompleted,
                  pct: selectedCourse.leaderPercent,
                },
                {
                  key: "member",
                  label: "Members",
                  started: selectedCourse.memberStarted,
                  completed: selectedCourse.memberCompleted,
                  pct: selectedCourse.memberPercent,
                },
              ] as const
            ).map((row) => {
              const pct = row.pct;
              const tone =
                pct >= 75 ? "#2a9d8f" : pct >= 50 ? "#e9c46a" : pct >= 25 ? "#f4a261" : "#e63946";
              return (
                <TableRow key={row.key}>
                  <TableCell>{row.label}</TableCell>
                  <TableCell align="right">{row.started}</TableCell>
                  <TableCell align="right">{row.completed}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5} sx={{ minWidth: 200 }}>
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: 10,
                          borderRadius: 999,
                          bgcolor: "rgba(255,255,255,0.08)",
                          overflow: "hidden",
                        }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: "100%",
                            bgcolor: "transparent",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: tone,
                              borderRadius: 999,
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: tone, fontVariantNumeric: "tabular-nums" }}>
                        {row.started === 0
                          ? "No users started"
                          : `${pct}% of started ${row.label.toLowerCase()} completed`}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
