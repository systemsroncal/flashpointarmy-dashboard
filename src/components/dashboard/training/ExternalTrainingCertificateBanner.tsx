"use client";

import { BIBLICAL_CITIZENSHIP_COURSE_SLUG } from "@/lib/courses/course-completion";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UploadFileIcon from "@mui/icons-material/UploadFile";
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
  /** Compact layout for course grid page */
  variant?: "default" | "compact";
};

export function ExternalTrainingCertificateBanner({
  showPrompt,
  courseSlug = BIBLICAL_CITIZENSHIP_COURSE_SLUG,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [completionDate, setCompletionDate] = useState("");
  const [organization, setOrganization] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const resetForm = useCallback(() => {
    setConfirmed(false);
    setCompletionDate("");
    setOrganization("");
    setFile(null);
    setError(null);
  }, []);

  function handleNo() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }

  function handleYes() {
    resetForm();
    setFormOpen(true);
  }

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
    if (!file) {
      setError("Please upload your certificate (image or PDF).");
      return;
    }

    setSubmitting(true);
    try {
      const uploadFd = new FormData();
      uploadFd.append("file", file);
      const uploadRes = await fetch("/api/training/certificate-requests/upload", {
        method: "POST",
        body: uploadFd,
      });
      const uploadJson = (await uploadRes.json()) as {
        error?: string;
        url?: string;
        file_name?: string;
        mime?: string;
      };
      if (!uploadRes.ok) throw new Error(uploadJson.error ?? "Upload failed.");

      const submitRes = await fetch("/api/training/certificate-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseSlug,
          completed_training_confirmed: true,
          completion_date: completionDate,
          organization_name: organization.trim(),
          certificate_url: uploadJson.url,
          certificate_file_name: uploadJson.file_name ?? file.name,
          certificate_mime: uploadJson.mime ?? file.type,
        }),
      });
      const submitJson = (await submitRes.json()) as { error?: string };
      if (!submitRes.ok) throw new Error(submitJson.error ?? "Submit failed.");

      setFormOpen(false);
      setSubmitted(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!showPrompt || dismissed) return null;

  if (submitted) {
    return (
      <Alert severity="info" icon={<CheckCircleOutlineIcon />} sx={{ mb: 2 }}>
        Your external training certificate request has been submitted and is pending review. You will be notified once
        an administrator approves or rejects it.
      </Alert>
    );
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          mb: variant === "compact" ? 2 : 3,
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2,
          border: "1px solid rgba(212, 175, 55, 0.45)",
          bgcolor: "rgba(22, 22, 28, 0.92)",
        }}
      >
        <Typography sx={{ color: "rgba(255,255,255,0.92)", fontWeight: 600, mb: 1 }}>
          Completed this course elsewhere?
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.78)", mb: 2, lineHeight: 1.6 }}>
          If you have already completed Biblical Citizenship training through another organization or platform, you may
          submit your certificate for review instead of retaking every session here.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Button variant="contained" color="primary" onClick={handleYes} sx={{ fontWeight: 700 }}>
            Yes
          </Button>
          <Button variant="outlined" onClick={handleNo} sx={{ borderColor: "rgba(255,255,255,0.35)", color: "grey.200" }}>
            No
          </Button>
        </Box>
      </Paper>

      <Dialog open={formOpen} onClose={() => !submitting && setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>External training certificate</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Submit proof that you completed this training at another organization or chapter. An administrator will
            review your request.
          </Typography>

          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          <FormControlLabel
            control={<Checkbox checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />}
            label="I have completed this training"
            sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}
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
            sx={{ mb: 2 }}
          />

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            fullWidth
            sx={{ mb: 1, justifyContent: "flex-start", py: 1.25 }}
          >
            {file ? file.name : "Certificate upload (image or PDF)"}
            <input
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </Button>
          {file && file.type.startsWith("image/") ? (
            <Box
              component="img"
              src={URL.createObjectURL(file)}
              alt="Certificate preview"
              sx={{ mt: 1, maxWidth: "100%", maxHeight: 160, borderRadius: 1, border: "1px solid", borderColor: "divider" }}
            />
          ) : null}
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
    </>
  );
}

/** Preview certificate in admin detail dialog */
export function CertificateFilePreview({
  url,
  mime,
  fileName,
}: {
  url: string;
  mime: string | null;
  fileName: string | null;
}) {
  const src = publicAssetSrc(url);
  const isPdf = mime === "application/pdf" || url.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {fileName ?? "Certificate.pdf"}
        </Typography>
        <Box
          component="iframe"
          src={src}
          title="Certificate PDF"
          sx={{ width: "100%", height: 420, border: "1px solid", borderColor: "divider", borderRadius: 1 }}
        />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={fileName ?? "Certificate"}
      sx={{ mt: 1, maxWidth: "100%", maxHeight: 420, borderRadius: 1, border: "1px solid", borderColor: "divider" }}
    />
  );
}
