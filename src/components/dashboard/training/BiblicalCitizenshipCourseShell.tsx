"use client";

import { Box } from "@mui/material";
import { useEffect, type ReactNode } from "react";

type Props = {
  /** From Training → Start Biblical Citizenship: scroll to Course Lessons (hero stays visible). */
  startAtLessons: boolean;
  intro: ReactNode;
  lessons: ReactNode;
};

export function BiblicalCitizenshipCourseShell({ startAtLessons, intro, lessons }: Props) {
  useEffect(() => {
    if (!startAtLessons) return;
    const scrollToLessons = () => {
      document.getElementById("course-lessons")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const t = window.setTimeout(scrollToLessons, 150);
    return () => window.clearTimeout(t);
  }, [startAtLessons]);

  return (
    <Box>
      {intro}
      {lessons}
    </Box>
  );
}
