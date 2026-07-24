"use client";

import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import { hasCertificateAttachment } from "@/lib/training/certificate-requests";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Link as MuiLink,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "fp-external-cert-prompt-dismissed";

type Props = {
  showPrompt: boolean;
  courseSlug?: string;
  /** Human-readable course name shown in the prompt. */
  courseTitle?: string;
  /** `inline` = simple Patriot Academy link below training CTA */
  variant?: "default" | "compact" | "inline";
  /** Text alignment for `inline` variant (course page left column uses `left`). */
  align?: "center" | "left";
  /** Server-side pending request — show thank-you instead of the CTA link. */
  pendingReview?: boolean;
};

export function ExternalTrainingCertificateBanner({
  showPrompt,
  courseSlug = BIBLICAL_CITIZENSHIP_COURSE_SLUG,
  courseTitle = "Biblical Citizenship",
  variant = "default",
  align = "center",
  pendingReview = false,
}: Props) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [completionDate, setCompletionDate] = useState("");
  const [organization, setOrganization] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(pendingReview);

  useEffect(() => {
    if (variant === "inline") return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, [variant]);

  const resetForm = useCallback(() => {
    setConfirmed(false);
    setCompletionDate("");
    setOrganization("");
    setError(null);
  }, []);

  function openForm() {
    resetForm();
    setFormOpen(true);
  }

  function handleNo() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  const closeSuccessDialog = useCallback(() => {
    setSuccessOpen(false);
    setSubmitted(true);
  }, []);

  async function handleSubmit() {
    setError(null);
    if (!confirmed) {
      setError("Please confirm you have completed this training.");
      return;
    }
    if (!completionDate) {
      setError("Completion date is required.");
      return;
    }
    if (!organization.trim()) {
      setError("Organization / chapter is required.");
      return;
    }

    setSubmitting(true);
    try {
      const submitRes = await fetch("/api/training/certificate-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          completed_training_confirmed: true,
          completion_date: completionDate,
          organization_name: organization.trim(),
        }),
      });
      const submitJson = (await submitRes.json()) as { error?: string };
      if (!submitRes.ok) throw new Error(submitJson.error ?? "Submit failed.");

      setFormOpen(false);
      setSuccessOpen(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!showPrompt || (variant === "default" && dismissed)) return null;

  if (submitted) {
    if (variant === "inline") {
      return (
        <Typography
          sx={{
            mt: 1.5,
            textAlign: align === "left" ? { xs: "center", md: "left" } : "center",
            color: "rgba(255,255,255,0.78)",
            fontSize: "0.9rem",
            lineHeight: 1.65,
          }}
        >
          Thank you. We received your request for the <strong>{courseTitle}</strong> course. A team member will
          review it and update your account.
        </Typography>
      );
    }
    return (
      <Alert severity="info" icon={<CheckCircleOutlineIcon />} sx={{ mb: 2 }}>
        Thank you. We received your request for the <strong>{courseTitle}</strong> course. A team member will
        review it and update your account. You do not need to submit again unless we ask you to.
      </Alert>
    );
  }

  const titleSx = {
    color: "rgba(255,255,255,0.95)",
    fontWeight: 700,
    fontSize: { xs: "1.1rem", sm: "1.2rem" },
    lineHeight: 1.45,
    mb: 1.25,
  } as const;

  const bodySx = {
    color: "rgba(255,255,255,0.82)",
    mb: 2,
    lineHeight: 1.75,
    fontSize: { xs: "1rem", sm: "1.05rem" },
  } as const;

  const formDialog = (
    <Dialog open={formOpen} onClose={() => !submitting && setFormOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontSize: "1.15rem", fontWeight: 700 }}>
        Already Completed Biblical Citizenship?
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
          If you previously completed the Biblical Citizenship course through another organization, you may submit
          your previous completion below to unlock the next step in your journey.
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
          <strong>We strongly encourage you to retake the course if it has been more than a year since you completed it.</strong>{" "}
          The training is continually impacting lives, and a refresher is a valuable way to strengthen your biblical
          and constitutional foundation.
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <FormControlLabel
          control={<Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />}
          label={`I have completed the ${courseTitle} course`}
          sx={{ display: "flex", alignItems: "flex-start", mb: 2, "& .MuiFormControlLabel-label": { lineHeight: 1.6 } }}
        />

        <TextField
          label="Completion date"
          type="date"
          value={completionDate}
          onChange={(e) => setCompletionDate(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Organization / chapter where you completed it"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setFormOpen(false)} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void handleSubmit()} disabled={submitting}>
          {submitting ? <CircularProgress size={22} color="inherit" /> : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const successDialog = (
    <Dialog open={successOpen} onClose={closeSuccessDialog} maxWidth="sm" fullWidth>
      <DialogContent sx={{ pt: 3 }}>
        <Alert
          severity="success"
          icon={<CheckCircleOutlineIcon fontSize="inherit" />}
          sx={{
            alignItems: "flex-start",
            "& .MuiAlert-icon": { mt: 0.25 },
            bgcolor: "success.50",
            color: "success.dark",
            border: "1px solid",
            borderColor: "success.light",
          }}
        >
          <Typography component="div" fontWeight={700} sx={{ mb: 1.25, fontSize: "1.05rem" }}>
            Submission Received
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.25, lineHeight: 1.65 }}>
            Thank you! We&apos;ve received your previous Biblical Citizenship completion.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.25, lineHeight: 1.65 }}>
            Your Journey Progress will be updated automatically. Please allow up to 24 hours for your account to
            reflect the change.
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
            Once completed, you&apos;ll be able to access the Mission Briefing and begin your 12 Mission Opportunities.
          </Typography>
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="contained" color="success" onClick={closeSuccessDialog} sx={{ fontWeight: 700 }}>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (variant === "inline") {
    return (
      <>
        <Typography
          sx={{
            mt: 1.5,
            textAlign: align === "left" ? { xs: "center", md: "left" } : "center",
            color: "rgba(255,255,255,0.78)",
            fontSize: "19px",
            lineHeight: 1.65,
          }}
        >
          Already completed this course
          <br />
          through Patriot Academy?{" "}
          <MuiLink
            component="button"
            type="button"
            onClick={openForm}
            sx={{
              color: "primary.main",
              fontWeight: 700,
              cursor: "pointer",
              verticalAlign: "baseline",
              textDecoration: "underline",
              "&:hover": { color: "primary.light" },
            }}
          >
            Continue Here
          </MuiLink>
        </Typography>
        {formDialog}
        {successDialog}
      </>
    );
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mb: variant === "compact" ? 2 : 0,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          border: "1px solid rgba(212, 175, 55, 0.45)",
          bgcolor: "rgba(22, 22, 28, 0.92)",
        }}
      >
        <Typography sx={titleSx}>
          Have you already finished the <strong>{courseTitle}</strong> course somewhere else?
        </Typography>
        <Typography sx={bodySx}>
          Some people complete the <strong>{courseTitle}</strong> course at another church, chapter, or training
          program — not on this website. If that is you, you do not need to watch every lesson here again.
        </Typography>
        <Typography sx={{ ...bodySx, mb: 2.5 }}>
          Tap <strong>Yes</strong> to tell us where and when you completed it. Our team will review your request and
          update your account when approved.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={openForm}
            sx={{ fontWeight: 700, minHeight: 48, px: 3, fontSize: "1rem" }}
          >
            Yes
          </Button>
          <Button
            variant="outlined"
            onClick={handleNo}
            sx={{
              borderColor: "rgba(255,255,255,0.35)",
              color: "grey.200",
              minHeight: 48,
              px: 3,
              fontSize: "1rem",
            }}
          >
            No, I have not
          </Button>
        </Box>
      </Paper>
      {formDialog}
      {successDialog}
    </>
  );
}

/** Preview or download certificate in admin detail dialog */
export function CertificateFilePreview({
  url,
  mime,
  fileName,
}: {
  url: string;
  mime: string | null;
  fileName: string | null;
}) {
  if (!hasCertificateAttachment(url)) return null;

  const src = publicAssetSrc(url);
  const isPdf = mime === "application/pdf" || url.toLowerCase().endsWith(".pdf");
  const label = fileName ?? (isPdf ? "Certificate.pdf" : "Certificate");

  if (isPdf) {
    return (
      <Box sx={{ mt: 1 }}>
        <Button
          component="a"
          href={src}
          download={label}
          target="_blank"
          rel="noopener noreferrer"
          variant="outlined"
          startIcon={<DownloadIcon />}
          sx={{ justifyContent: "flex-start" }}
        >
          Download {label}
        </Button>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={label}
      sx={{ mt: 1, maxWidth: "100%", maxHeight: 420, borderRadius: 1, border: "1px solid", borderColor: "divider" }}
    />
  );
}
