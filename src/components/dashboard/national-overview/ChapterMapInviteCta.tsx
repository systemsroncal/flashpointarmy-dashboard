"use client";

import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { ChapterInviteShareDialog } from "./ChapterInviteShareDialog";

export function ChapterMapInviteCta() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        sx={{
          mt: 2.5,
          pt: 2,
          borderTop: "1px solid rgba(255,215,0,0.14)",
          textAlign: "center",
        }}
      >
        <Stack spacing={0} sx={{ maxWidth: 580, mx: "auto", width: "100%" }}>
          <Box sx={{ display: "block", textAlign: "center" }}>
            <Typography
              component="p"
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.7, mb: 0.75 }}
            >
              God is raising up believers in every state. Know someone who should be part of it?
              <br />
              Invite them to find or join a chapter near them.
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<ShareOutlinedIcon />}
              onClick={() => setOpen(true)}
              sx={{
                fontWeight: 700,
                textTransform: "none",
              }}
            >
              Invite someone to join
            </Button>
          </Box>
        </Stack>
      </Box>

      <ChapterInviteShareDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
