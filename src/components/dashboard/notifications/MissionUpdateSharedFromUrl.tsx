"use client";

import { AnnouncementDescriptionBody } from "@/components/dashboard/notifications/AnnouncementDescriptionBody";
import { InlinePdfPreview } from "@/components/pdf/InlinePdfPreview";
import type { AnnouncementListItem } from "@/lib/dashboard/announcements-types";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const SHARED_DIALOG_PAPER_SX = {
  width: "100%",
  maxWidth: 720,
  bgcolor: "#141418",
  border: "1px solid rgba(255,215,0,0.18)",
  borderRadius: 2,
  boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
  maxHeight: "min(92vh, 900px)",
  display: "flex",
  flexDirection: "column",
} as const;

type Props = {
  items: AnnouncementListItem[];
  loading: boolean;
};

export function MissionUpdateSharedFromUrl({ items, loading }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const updateId = searchParams.get("update")?.trim() || null;
  const [open, setOpen] = useState(false);

  const clearUpdateQuery = useCallback(() => {
    const q = new URLSearchParams(searchParams.toString());
    q.delete("update");
    const next = q.toString() ? `${pathname}?${q}` : pathname;
    router.replace(next, { scroll: false });
  }, [pathname, router, searchParams]);

  const close = useCallback(() => {
    setOpen(false);
    clearUpdateQuery();
  }, [clearUpdateQuery]);

  useEffect(() => {
    if (updateId) setOpen(true);
    else setOpen(false);
  }, [updateId]);

  const row = useMemo(
    () => (updateId ? items.find((i) => i.id === updateId) ?? null : null),
    [items, updateId]
  );

  if (!updateId && !open) return null;

  return (
    <Dialog
      open={open}
      onClose={close}
      fullWidth
      maxWidth="md"
      scroll="paper"
      PaperProps={{ sx: SHARED_DIALOG_PAPER_SX }}
    >
      <DialogTitle
        sx={{
          fontWeight: 800,
          color: "grey.100",
          pr: 6,
          lineHeight: 1.35,
        }}
      >
        {row?.title ?? "Mission Update"}
        <IconButton
          aria-label="Close"
          onClick={close}
          sx={{ position: "absolute", right: 8, top: 8, color: "grey.400" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.22) rgba(255,255,255,0.06)",
        }}
      >
        {loading ? (
          <CircularProgress size={28} sx={{ display: "block", mx: "auto", my: 3, color: "primary.main" }} />
        ) : null}
        {!loading && updateId && !row ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            This Mission Update is not available or was removed from your list.
          </Typography>
        ) : null}
        {row && !loading ? (
          <Stack spacing={2}>
            <Typography variant="caption" color="text.secondary">
              {new Date(row.created_at).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
            <Box
              sx={{
                lineHeight: 1.65,
                fontSize: "0.875rem",
                color: "grey.200",
              }}
            >
              <AnnouncementDescriptionBody html={row.description} />
            </Box>
            {row.ctas?.length ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {row.ctas.map((c, idx) => (
                  <Button
                    key={`${row.id}-shared-cta-${idx}`}
                    component="a"
                    href={c.url}
                    target={c.open_in_new_tab !== false ? "_blank" : undefined}
                    rel={c.open_in_new_tab !== false ? "noopener noreferrer" : undefined}
                    variant="contained"
                    disableElevation
                    sx={{
                      bgcolor: c.bg_color,
                      color: c.text_color,
                      "&:hover": { bgcolor: c.bg_color, filter: "brightness(1.08)" },
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    {c.label}
                  </Button>
                ))}
              </Stack>
            ) : null}
            {row.pdf_url?.trim() ? (
              <InlinePdfPreview pdfUrl={row.pdf_url.trim()} fileName={row.pdf_file_name} />
            ) : null}
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}