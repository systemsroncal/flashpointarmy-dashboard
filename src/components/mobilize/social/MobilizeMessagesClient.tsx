"use client";

import { MobilizeSectionEmptyState } from "@/components/mobilize/MobilizeSectionEmptyState";
import { MESSAGES_EMPTY } from "@/lib/mobilize/social/social-empty-copy";
import type { ConversationSummary, DirectMessageRow } from "@/lib/mobilize/social/load-direct-messages";
import type { MobilizeAuthorSummary } from "@/lib/mobilize/social/resolve-authors";
import { MOBILIZE_BOTTOM_NAV_HEIGHT_PX } from "@/lib/mobilize/mobilize-ui-surface";
import { publicAssetSrc } from "@/lib/media/public-asset-url";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type RecipientOption = MobilizeAuthorSummary;

const MESSENGER_BLUE = "#0084ff";
const THREAD_BG = "#f0f2f5";
const SIDEBAR_WIDTH = 360;

function formatMessageTime(iso: string) {
  try {
    const date = new Date(iso);
    const now = new Date();
    const sameDay =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();
    if (sameDay) {
      return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function ConversationListItem({
  conversation,
  selected,
  onSelect,
}: {
  conversation: ConversationSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  const previewPrefix = conversation.last_message.is_outgoing ? "You: " : "";
  return (
    <ListItemButton
      onClick={onSelect}
      selected={selected}
      sx={{
        px: 2,
        py: 1.25,
        alignItems: "flex-start",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        bgcolor: selected ? "rgba(0,132,255,0.08)" : "transparent",
        "&.Mui-selected": { bgcolor: "rgba(0,132,255,0.1)" },
      }}
    >
      <Avatar
        src={conversation.peer.avatar_url ? publicAssetSrc(conversation.peer.avatar_url) : undefined}
        sx={{ width: 52, height: 52, mr: 1.5 }}
      >
        {conversation.peer.display_name.slice(0, 1)}
      </Avatar>
      <ListItemText
        primary={
          <Typography fontWeight={700} noWrap sx={{ color: "#050505", fontSize: "0.95rem" }}>
            {conversation.peer.display_name}
          </Typography>
        }
        secondary={
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              sx={{ color: "#65676b", flex: 1, fontSize: "0.82rem" }}
            >
              {previewPrefix}
              {conversation.last_message.body}
            </Typography>
            <Typography variant="caption" sx={{ color: "#65676b", flexShrink: 0 }}>
              {formatMessageTime(conversation.last_message.created_at)}
            </Typography>
          </Stack>
        }
        sx={{ m: 0 }}
      />
    </ListItemButton>
  );
}

function MessageBubble({ message }: { message: DirectMessageRow }) {
  const outgoing = message.is_outgoing;
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: outgoing ? "flex-end" : "flex-start",
        mb: 0.75,
        px: { xs: 1, sm: 2 },
      }}
    >
      <Box
        sx={{
          maxWidth: { xs: "82%", sm: "68%" },
          px: 1.5,
          py: 1,
          borderRadius: outgoing ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          bgcolor: outgoing ? MESSENGER_BLUE : "#e4e6eb",
          color: outgoing ? "#fff" : "#050505",
          boxShadow: "0 1px 1px rgba(0,0,0,0.06)",
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.45, fontSize: "0.92rem" }}>
          {message.body}
        </Typography>
      </Box>
    </Box>
  );
}

export function MobilizeMessagesClient() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const router = useRouter();
  const searchParams = useSearchParams();
  const withParam = searchParams.get("with")?.trim() || "";

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [thread, setThread] = useState<DirectMessageRow[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<MobilizeAuthorSummary | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [composeQuery, setComposeQuery] = useState("");
  const [composeResults, setComposeResults] = useState<RecipientOption[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const messengerHeight = useMemo(
    () => ({
      xs: `calc(100dvh - 7rem - ${MOBILIZE_BOTTOM_NAV_HEIGHT_PX}px - env(safe-area-inset-bottom, 0px))`,
      md: "calc(100dvh - 6.5rem - env(safe-area-inset-bottom, 0px))",
    }),
    []
  );

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/mobilize/social/messages");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load messages.");
      setConversations(json.conversations ?? []);
    } catch {
      setConversations([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(async (peerId: string) => {
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/mobilize/social/messages?peer_id=${encodeURIComponent(peerId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load conversation.");
      setThread(json.thread ?? []);
    } catch {
      setThread([]);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  const openConversation = useCallback(
    async (peer: MobilizeAuthorSummary) => {
      setSelectedPeer(peer);
      setError(null);
      if (isMobile) setMobileShowThread(true);
      await loadThread(peer.id);
      router.replace(`/dashboard/mobilize/messages?with=${peer.id}`, { scroll: false });
    },
    [isMobile, loadThread, router]
  );

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!withParam) return;
    const existing = conversations.find((c) => c.peer.id === withParam);
    if (existing) {
      setSelectedPeer(existing.peer);
      if (isMobile) setMobileShowThread(true);
      void loadThread(withParam);
      return;
    }
    void fetch(`/api/mobilize/social/messages/recipients?q=`)
      .then((res) => res.json())
      .then((json) => {
        const match = (json.recipients ?? []).find((r: RecipientOption) => r.id === withParam);
        if (match) {
          void openConversation(match);
        }
      })
      .catch(() => {});
  }, [withParam, conversations, isMobile, loadThread, openConversation]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  useEffect(() => {
    const q = composeQuery.trim();
    if (q.length < 1) {
      setComposeResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void fetch(`/api/mobilize/social/messages/recipients?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((json) => setComposeResults(json.recipients ?? []))
        .catch(() => setComposeResults([]));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [composeQuery]);

  async function sendMessage() {
    if (!selectedPeer) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/mobilize/social/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: selectedPeer.id, body: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed.");
      setDraft("");
      await Promise.all([loadThread(selectedPeer.id), loadConversations()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }

  function handleBackToList() {
    setMobileShowThread(false);
    router.replace("/dashboard/mobilize/messages", { scroll: false });
  }

  const showSidebar = !isMobile || !mobileShowThread;
  const showThreadPanel = !isMobile || mobileShowThread;

  const sidebar = (
    <Box
      sx={{
        width: { xs: "100%", md: SIDEBAR_WIDTH },
        flexShrink: 0,
        display: showSidebar ? "flex" : "none",
        flexDirection: "column",
        bgcolor: "#fff",
        borderRight: { md: "1px solid rgba(0,0,0,0.1)" },
        minHeight: 0,
      }}
    >
      <Box sx={{ px: 2, py: 1.75, borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <Typography variant="h6" fontWeight={800} sx={{ color: "#050505", letterSpacing: "-0.02em" }}>
          Chats
        </Typography>
        <TextField
          size="small"
          fullWidth
          placeholder="Search mutual follows"
          value={composeQuery}
          onChange={(e) => setComposeQuery(e.target.value)}
          sx={{ mt: 1.25 }}
        />
      </Box>

      {composeResults.length ? (
        <Paper variant="outlined" sx={{ mx: 1.5, mt: 1, maxHeight: 180, overflow: "auto" }}>
          {composeResults.map((recipient) => (
            <ListItemButton key={recipient.id} onClick={() => void openConversation(recipient)}>
              <Avatar
                src={recipient.avatar_url ? publicAssetSrc(recipient.avatar_url) : undefined}
                sx={{ width: 36, height: 36, mr: 1.25 }}
              >
                {recipient.display_name.slice(0, 1)}
              </Avatar>
              <ListItemText primary={recipient.display_name} secondary={recipient.handle} />
            </ListItemButton>
          ))}
        </Paper>
      ) : null}

      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        {loadingList ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={26} />
          </Box>
        ) : !conversations.length ? (
          <Box sx={{ p: 2 }}>
            <MobilizeSectionEmptyState
              layout="stacked"
              title={MESSAGES_EMPTY.title}
              description="You can message members who follow you and whom you follow. Search above to start a chat."
            />
          </Box>
        ) : (
          conversations.map((conversation) => (
            <ConversationListItem
              key={conversation.peer.id}
              conversation={conversation}
              selected={selectedPeer?.id === conversation.peer.id}
              onSelect={() => void openConversation(conversation.peer)}
            />
          ))
        )}
      </Box>
    </Box>
  );

  const threadPanel = (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: showThreadPanel ? "flex" : "none",
        flexDirection: "column",
        bgcolor: "#fff",
      }}
    >
      {selectedPeer ? (
        <>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{
              px: { xs: 1, sm: 2 },
              py: 1.25,
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              flexShrink: 0,
            }}
          >
            {isMobile ? (
              <IconButton aria-label="Back to chats" onClick={handleBackToList} edge="start">
                <ArrowBackIcon />
              </IconButton>
            ) : null}
            <Avatar
              component={Link}
              href={`/dashboard/mobilize/profile/${selectedPeer.id}`}
              src={selectedPeer.avatar_url ? publicAssetSrc(selectedPeer.avatar_url) : undefined}
              sx={{ width: 40, height: 40 }}
            >
              {selectedPeer.display_name.slice(0, 1)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component={Link}
                href={`/dashboard/mobilize/profile/${selectedPeer.id}`}
                fontWeight={700}
                noWrap
                sx={{ color: "#050505", textDecoration: "none", display: "block" }}
              >
                {selectedPeer.display_name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {selectedPeer.handle}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", bgcolor: THREAD_BG, py: 2 }}>
            {loadingThread ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress size={26} />
              </Box>
            ) : (
              <>
                {thread.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                <div ref={threadEndRef} />
              </>
            )}
          </Box>

          <Box sx={{ px: { xs: 1, sm: 2 }, py: 1.25, borderTop: "1px solid rgba(0,0,0,0.08)", bgcolor: "#fff" }}>
            {error ? (
              <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            ) : null}
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Aa"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 99,
                    bgcolor: THREAD_BG,
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Send message"
                        onClick={() => void sendMessage()}
                        disabled={sending || !draft.trim()}
                        sx={{ color: MESSENGER_BLUE }}
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>
          </Box>
        </>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            bgcolor: THREAD_BG,
            p: 3,
          }}
        >
          <Typography variant="body1" color="text.secondary" textAlign="center">
            Select a chat to start messaging members you follow mutually.
          </Typography>
        </Box>
      )}
    </Box>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        height: messengerHeight,
        maxHeight: messengerHeight,
        display: "flex",
        overflow: "hidden",
        borderRadius: { xs: 2, md: 2.5 },
        border: "1px solid rgba(0,0,0,0.1)",
        bgcolor: "#fff",
      }}
    >
      {sidebar}
      {threadPanel}
    </Paper>
  );
}
