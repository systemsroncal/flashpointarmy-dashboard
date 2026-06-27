"use client";

import { Box } from "@mui/material";
import { useEffect, type ReactNode } from "react";

type Props = {
  /** When true (from Training → Start Biblical Citizenship), skip hero and focus Course Lessons. */
  startAtLessons: boolean;
  intro: ReactNode;
  lessons: ReactNode;
};

export function BiblicalCitizenshipCourseShell({ startAtLessons, intro, lessons }: Props) {
  useEffect(() => {
    if (!startAtLessons) return;
    const el = document.getElementById("course-lessons");
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }, [startAtLessons]);

  return (
    <Box>
      {!startAtLessons ? intro : null}
      {lessons}
    </Box>
  );
}
