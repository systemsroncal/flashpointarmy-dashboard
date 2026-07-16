"use client";

import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MobilizeSocialHubContent } from "@/components/mobilize/social/MobilizeSocialHubContent";
import { MobilizeSocialHubLayout } from "@/components/mobilize/social/MobilizeSocialHubLayout";
import { MESSAGES_EMPTY } from "@/lib/mobilize/social/social-empty-copy";
import { SOCIAL_HUB_TEXT_MUTED } from "@/lib/mobilize/social/social-hub-surface";
import type { DirectMessageRow } from "@/lib/mobilize/social/load-direct-messages";
import { mobilizeChapterDetailRootSx } from "@/lib/mobilize/mobilize-ui-surface";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type SearchMember = { id: string; display_name: string; handle: string; href: string };

export function MobilizeMessagesClient() {
  const [messages, setMessages] = useState<DirectMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientQuery, setRecipientQuery] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [recipientLabel, setRecipientLabel] = useState("");
  const [searchResults, setSearchResults] = useState<SearchMember[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mobilize/social/messages");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load messages.");
      setMessages(json.messages ?? []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const q = recipientQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(`/api/mobilize/social/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((json) => setSearchResults(json.members ?? []))
        .catch(() => setSearchResults([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [recipientQuery]);

  async function sendMessage() {
    const text = body.trim();
    if (!recipientId || !text) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/mobilize/social/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: recipientId, body: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed.");
      setBody("");
      setRecipientQuery("");
      setRecipientId("");
      setRecipientLabel("");
      setSearchResults([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Box sx={mobilizeChapterDetailRootSx}>
      <MobilizeSocialHubLayout>
        <MobilizeSocialHubContent tone="light">
          <Box sx={{ p: { xs: 1.5, sm: 2 }, flex: 1, display: "flex", flexDirection: "column" }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            Messages
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, color: SOCIAL_HUB_TEXT_MUTED }}>
            Direct messages you send and receive. Members with private profiles cannot be messaged.
          </Typography>

          <Paper
            elevation={0}
            sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", bgcolor: "#fff" }}
          >
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              New message
            </Typography>
            {error ? (
              <Alert severity="error" sx={{ mb: 1.5 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            ) : null}
            <TextField
              size="small"
              fullWidth
              label="To"
              placeholder="Search member name"
              value={recipientQuery}
              onChange={(e) => {
                setRecipientQuery(e.target.value);
                setRecipientId("");
                setRecipientLabel("");
              }}
              sx={{ mb: 1 }}
            />
            {recipientLabel ? (
              <Chip
                size="small"
                label={recipientLabel}
                onDelete={() => {
                  setRecipientId("");
                  setRecipientLabel("");
                  setRecipientQuery("");
                }}
                sx={{ mb: 1 }}
              />
            ) : null}
            {searchResults.length && !recipientId ? (
              <Paper variant="outlined" sx={{ mb: 1, maxHeight: 160, overflow: "auto" }}>
                {searchResults.map((m) => (
                  <ListItemButton
                    key={m.id}
                    onClick={() => {
                      setRecipientId(m.id);
                      setRecipientLabel(m.display_name);
                      setRecipientQuery(m.display_name);
                      setSearchResults([]);
                    }}
                  >
                    <ListItemText primary={m.display_name} secondary={m.handle} />
                  </ListItemButton>
                ))}
              </Paper>
            ) : null}
            <TextField
              size="small"
              fullWidth
              multiline
              minRows={2}
              label="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              sx={{ mb: 1.5 }}
            />
            <Button
              variant="contained"
              disabled={sending || !recipientId || !body.trim()}
              onClick={() => void sendMessage()}
            >
              {sending ? "Sending…" : "Send"}
            </Button>
          </Paper>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          ) : !messages.length ? (
            <MobilizeSectionEmptyState fill title={MESSAGES_EMPTY.title} description={MESSAGES_EMPTY.description} />
          ) : (
            <Stack spacing={1}>
              {messages.map((m) => {
                const peer = m.is_outgoing ? m.recipient : m.sender;
                return (
                  <Paper
                    key={m.id}
                    elevation={0}
                    sx={{ p: 1.5, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", bgcolor: "#fff" }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Avatar src={peer.avatar_url ?? undefined} sx={{ width: 40, height: 40 }}>
                        {peer.display_name.slice(0, 1)}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography
                            component={Link}
                            href={`/dashboard/mobilize/profile/${peer.id}`}
                            fontWeight={700}
                            sx={{ color: "inherit", textDecoration: "none" }}
                          >
                            {peer.display_name}
                          </Typography>
                          <Chip
                            size="small"
                            label={m.is_outgoing ? "Sent" : "Received"}
                            variant="outlined"
                            sx={{ height: 22 }}
                          />
                        </Stack>
                        <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                          {m.body}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                          {new Date(m.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
          </Box>
        </MobilizeSocialHubContent>
      </MobilizeSocialHubLayout>
    </Box>
  );
}
