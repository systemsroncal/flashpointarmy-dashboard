"use client";

import { renderTemplatedEmail } from "@/lib/mail/render-email";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { LaunchDefaultPasswordPanel } from "@/components/dashboard/emails/LaunchDefaultPasswordPanel";
import { EmailDeliverySettingsPanel } from "@/components/dashboard/emails/EmailDeliverySettingsPanel";
import { Fragment, useEffect, useMemo, useState } from "react";

type Branding = {
  logo_url: string | null;
  logo_bg_color: string;
  container_bg_color: string;
  footer_html: string;
};

type TemplateRow = {
  id: string;
  template_key: string;
  subject: string;
  body_html: string;
};

const PREVIEW_SHORTCODES: Record<string, string> = {
  user_fullname: "María García",
  user_email: "maria@ejemplo.com",
  validateemail_url: "https://ejemplo.com/auth/verify?token=demo",
  resetpassword_url: "https://ejemplo.com/auth/reset-password?token=demo",
  gathering_title: "Reunión dominical",
  gathering_url: "https://ejemplo.com/dashboard/gatherings/demo",
  app_name: "Flashpoint Dashboard",
  current_year: String(new Date().getFullYear()),
  otp: "123456",
};

const TEMPLATE_LABELS: Record<string, string> = {
  verify_email: "Verificar correo",
  password_reset: "Restablecer contraseña",
  local_leader_assigned: "Líder local asignado",
  gathering_created: "Nuevo encuentro",
  register_otp: "OTP de registro (alta)",
};

type EmailLogSortKey =
  | "created_at"
  | "status"
  | "template"
  | "from_address"
  | "to_address"
  | "subject"
  | "error_message";

export type EmailSendLogRow = {
  id: string;
  created_at: string;
  status: string;
  template_key: string | null;
  from_address: string | null;
  to_address: string;
  subject: string | null;
  body_preview: string | null;
  error_message: string | null;
  triggered_by_user_id: string | null;
};

const TEMPLATE_SHORTCODE_HINTS: Record<string, string> = {
  verify_email:
    "{user_fullname}, {user_email}, {validateemail_url}, {current_year}, {app_name}",
  password_reset:
    "{user_fullname}, {user_email}, {resetpassword_url}, {current_year}, {app_name}",
  local_leader_assigned:
    "{user_fullname}, {user_email}, {current_year}, {app_name}",
  gathering_created:
    "{user_fullname}, {user_email}, {gathering_title}, {gathering_url}, {current_year}, {app_name}",
  register_otp:
    "{otp}, {user_email}, {user_fullname}, {app_name}, {current_year} (códigos de enlace no usados)",
};

function initialTabIndex(isSuperAdmin: boolean, initialTab?: string): number {
  if (!isSuperAdmin) return 0;
  if (initialTab === "sending") return 2;
  return 0;
}

export function EmailsSettingsClient({
  isSuperAdmin,
  initialBranding,
  initialTemplates,
  initialLogs,
  defaultTestEmail,
  canEdit,
  initialTab,
  gmailConnected,
  gmailError,
}: {
  isSuperAdmin: boolean;
  initialBranding: Branding;
  initialTemplates: TemplateRow[];
  initialLogs: EmailSendLogRow[];
  defaultTestEmail: string;
  canEdit: boolean;
  initialTab?: string;
  gmailConnected?: boolean;
  gmailError?: string;
}) {
  const [branding, setBranding] = useState<Branding>(initialBranding);
  const [templates, setTemplates] = useState<TemplateRow[]>(initialTemplates);
  const [selectedKey, setSelectedKey] = useState(
    initialTemplates[0]?.template_key ?? "verify_email"
  );

  const currentTpl = templates.find((t) => t.template_key === selectedKey);
  const [subject, setSubject] = useState(currentTpl?.subject ?? "");
  const [bodyHtml, setBodyHtml] = useState(currentTpl?.body_html ?? "");

  const [savingBrand, setSavingBrand] = useState(false);
  const [savingTpl, setSavingTpl] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState(() => initialTabIndex(isSuperAdmin, initialTab));
  const [logs, setLogs] = useState<EmailSendLogRow[]>(initialLogs);
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [testSending, setTestSending] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [detailLog, setDetailLog] = useState<EmailSendLogRow | null>(null);
  const [previewLog, setPreviewLog] = useState<EmailSendLogRow | null>(null);
  const [logSearch, setLogSearch] = useState("");
  const [logOrderBy, setLogOrderBy] = useState<EmailLogSortKey>("created_at");
  const [logOrder, setLogOrder] = useState<"asc" | "desc">("desc");
  const [logPage, setLogPage] = useState(0);
  const [logsRowsPerPage, setLogsRowsPerPage] = useState(25);
  /** Defer heavy MUI tree until after mount so password-manager extensions (e.g. Proton Pass) cannot break SSR hydration. */
  const [hydrationSafe, setHydrationSafe] = useState(false);
  useEffect(() => {
    setHydrationSafe(true);
  }, []);


  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  function handleLogSort(property: EmailLogSortKey) {
    const isAsc = logOrderBy === property && logOrder === "asc";
    setLogOrder(isAsc ? "desc" : "asc");
    setLogOrderBy(property);
  }

  const displayedLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    const base = !q
      ? logs
      : logs.filter((row) => {
          const tpl = row.template_key
            ? (TEMPLATE_LABELS[row.template_key] ?? row.template_key)
            : "";
          const blob = [
            new Date(row.created_at).toLocaleString(),
            row.status,
            tpl,
            row.from_address ?? "",
            row.to_address,
            row.subject ?? "",
            row.error_message ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return blob.includes(q);
        });
    const dir = logOrder === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      const cmpStr = (x: string | null | undefined, y: string | null | undefined) =>
        dir * String(x ?? "").localeCompare(String(y ?? ""), undefined, { sensitivity: "base" });
      switch (logOrderBy) {
        case "created_at": {
          const ta = new Date(a.created_at).getTime();
          const tb = new Date(b.created_at).getTime();
          return dir * (ta - tb);
        }
        case "status":
          return cmpStr(a.status, b.status);
        case "template": {
          const la = a.template_key
            ? (TEMPLATE_LABELS[a.template_key] ?? a.template_key)
            : "";
          const lb = b.template_key
            ? (TEMPLATE_LABELS[b.template_key] ?? b.template_key)
            : "";
          return cmpStr(la, lb);
        }
        case "from_address":
          return cmpStr(a.from_address, b.from_address);
        case "to_address":
          return cmpStr(a.to_address, b.to_address);
        case "subject":
          return cmpStr(a.subject, b.subject);
        case "error_message":
          return cmpStr(a.error_message, b.error_message);
        default:
          return 0;
      }
    });
  }, [logs, logSearch, logOrder, logOrderBy]);

  useEffect(() => {
    setLogPage(0);
  }, [logSearch, logOrderBy, logOrder]);

  const pagedLogs = useMemo(() => {
    if (logsRowsPerPage < 0) return displayedLogs;
    return displayedLogs.slice(
      logPage * logsRowsPerPage,
      logPage * logsRowsPerPage + logsRowsPerPage
    );
  }, [displayedLogs, logPage, logsRowsPerPage]);

  async function refreshLogs() {
    setLogsLoading(true);
    try {
      const res = await fetch("/api/email/settings/logs");
      const data = (await res.json()) as { logs?: EmailSendLogRow[]; error?: string };
      if (res.ok && data.logs) setLogs(data.logs);
    } finally {
      setLogsLoading(false);
    }
  }

  async function sendTestEmail() {
    const to = testEmail.trim();
    if (!to || !to.includes("@")) {
      setErr("Introduce un correo válido para el envío de prueba.");
      return;
    }
    setTestSending(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/email/settings/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_key: selectedKey, to_email: to }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Falló el envío de prueba.");
      setMsg(
        `Correo de prueba enviado a ${to} con la plantilla «${TEMPLATE_LABELS[selectedKey] ?? selectedKey}».`
      );
      void refreshLogs();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falló el envío de prueba.");
    } finally {
      setTestSending(false);
    }
  }

  const handleSelectTemplate = (key: string) => {
    const t = templates.find((x) => x.template_key === key);
    setSelectedKey(key);
    setSubject(t?.subject ?? "");
    setBodyHtml(t?.body_html ?? "");
  };

  const brandingPreview = useMemo(() => {
    return renderTemplatedEmail(
      branding,
      {
        subject: "Asunto de vista previa",
        body_html:
          "<p>Este es un <strong>cuerpo</strong> de ejemplo para la vista previa de marca.</p>",
      },
      PREVIEW_SHORTCODES
    );
  }, [branding]);

  const templatePreview = useMemo(() => {
    return renderTemplatedEmail(
      branding,
      { subject, body_html: bodyHtml },
      PREVIEW_SHORTCODES
    );
  }, [branding, subject, bodyHtml]);

  if (initialTemplates.length === 0) {
    return (
      <Alert severity="warning">
        No se encontraron plantillas de correo. Aplica la migración 012 (módulo de correo) en Supabase y recarga esta
        página.
      </Alert>
    );
  }

  async function saveBranding() {
    setErr(null);
    setMsg(null);
    setSavingBrand(true);
    try {
      const res = await fetch("/api/email/settings/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: branding.logo_url?.trim() || null,
          logo_bg_color: branding.logo_bg_color,
          container_bg_color: branding.container_bg_color,
          footer_html: branding.footer_html,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Error al guardar.");
      setMsg("Marca guardada.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSavingBrand(false);
    }
  }

  async function saveTemplate() {
    setErr(null);
    setMsg(null);
    setSavingTpl(true);
    try {
      const res = await fetch("/api/email/settings/template", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_key: selectedKey,
          subject,
          body_html: bodyHtml,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Error al guardar.");
      setTemplates((prev) =>
        prev.map((t) =>
          t.template_key === selectedKey ? { ...t, subject, body_html: bodyHtml } : t
        )
      );
      setMsg("Plantilla guardada.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al guardar.");
    } finally {
      setSavingTpl(false);
    }
  }

  if (!hydrationSafe) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-busy="true"
        aria-label="Cargando configuración de correo"
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h5">Configuración de correo</Typography>
      <Typography variant="body2" color="text.secondary">
        El diseño global (zona del logo, colores, pie) envuelve cada correo transaccional. Cada plantilla solo guarda el
        asunto y el HTML interior del mensaje.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="Plantillas y marca" />
        <Tab label="Registro de envíos" />
        {isSuperAdmin ? <Tab label="Envío (Gmail / SMTP)" /> : null}
        {isSuperAdmin ? <Tab label="Contraseñas de lanzamiento" /> : null}
      </Tabs>

      {msg && <Alert severity="success">{msg}</Alert>}
      {err && <Alert severity="error">{err}</Alert>}

      {tab === 1 ? (
        <Paper sx={{ p: 2, overflow: "auto" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="subtitle1">Envíos recientes</Typography>
            <Button size="small" variant="outlined" onClick={() => void refreshLogs()} disabled={logsLoading}>
              {logsLoading ? "Cargando…" : "Actualizar"}
            </Button>
          </Stack>
          {logs.length === 0 ? (
            <Typography color="text.secondary">
              Aún no hay entradas en el registro. Aplica la migración 015 si falta esta tabla.
            </Typography>
          ) : (
            <>
              <TextField
                size="small"
                fullWidth
                label="Buscar en el registro"
                placeholder="Hora, estado, plantilla, direcciones, asunto…"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                sx={{ mb: 2, maxWidth: 480 }}
              />
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={logOrderBy === "created_at"}
                      direction={logOrderBy === "created_at" ? logOrder : "asc"}
                      onClick={() => handleLogSort("created_at")}
                    >
                      Fecha y hora
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={logOrderBy === "status"}
                      direction={logOrderBy === "status" ? logOrder : "asc"}
                      onClick={() => handleLogSort("status")}
                    >
                      Estado
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={logOrderBy === "template"}
                      direction={logOrderBy === "template" ? logOrder : "asc"}
                      onClick={() => handleLogSort("template")}
                    >
                      Plantilla
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={logOrderBy === "from_address"}
                      direction={logOrderBy === "from_address" ? logOrder : "asc"}
                      onClick={() => handleLogSort("from_address")}
                    >
                      De
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={logOrderBy === "to_address"}
                      direction={logOrderBy === "to_address" ? logOrder : "asc"}
                      onClick={() => handleLogSort("to_address")}
                    >
                      Para
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={logOrderBy === "subject"}
                      direction={logOrderBy === "subject" ? logOrder : "asc"}
                      onClick={() => handleLogSort("subject")}
                    >
                      Asunto
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <TableSortLabel
                      active={logOrderBy === "error_message"}
                      direction={logOrderBy === "error_message" ? logOrder : "asc"}
                      onClick={() => handleLogSort("error_message")}
                    >
                      Error
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pagedLogs.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell sx={{ whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                      {new Date(row.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={row.status}
                        color={row.status === "sent" ? "success" : "error"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {row.template_key
                        ? (TEMPLATE_LABELS[row.template_key] ?? row.template_key)
                        : "—"}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.from_address ?? "—"}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.to_address}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, fontSize: "0.8rem" }}>{row.subject ?? "—"}</TableCell>
                    <TableCell sx={{ maxWidth: 220, fontSize: "0.72rem", verticalAlign: "top" }}>
                      {row.error_message ? (
                        <Typography color="error" component="span" sx={{ wordBreak: "break-word" }}>
                          {row.error_message}
                        </Typography>
                      ) : (
                        <Typography color="text.secondary" variant="body2">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Todos los detalles">
                        <IconButton
                          size="small"
                          aria-label="Ver detalle completo del registro"
                          onClick={() => setDetailLog(row)}
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Vista previa del correo (renderizado)">
                        <span>
                          <IconButton
                            size="small"
                            aria-label="Vista previa del correo enviado"
                            onClick={() => setPreviewLog(row)}
                            disabled={!row.body_preview?.trim()}
                          >
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {displayedLogs.length === 0 && logs.length > 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography variant="body2" color="text.secondary">
                        No hay entradas que coincidan con la búsqueda.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            {displayedLogs.length > 0 ? (
              <TablePagination
                component="div"
                count={displayedLogs.length}
                page={logsRowsPerPage < 0 ? 0 : logPage}
                onPageChange={(_, next) => setLogPage(next)}
                rowsPerPage={logsRowsPerPage}
                onRowsPerPageChange={(e) => {
                  const v = Number(e.target.value);
                  setLogsRowsPerPage(v);
                  setLogPage(0);
                }}
                rowsPerPageOptions={[10, 20, 25, 50, 100, { label: "Todas", value: -1 }]}
                labelRowsPerPage="Filas por página"
                labelDisplayedRows={({ from, to, count }) =>
                  `${from}–${to} de ${count !== -1 ? count : to}`
                }
              />
            ) : null}
            </>
          )}
        </Paper>
      ) : null}

      {isSuperAdmin && tab === 2 ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Envío — Google Workspace (OAuth) o SMTP del servidor
          </Typography>
          <EmailDeliverySettingsPanel gmailConnected={gmailConnected} gmailError={gmailError} />
        </Paper>
      ) : null}

      {isSuperAdmin && tab === 3 ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Lanzamiento — contraseña por defecto
          </Typography>
          <LaunchDefaultPasswordPanel />
        </Paper>
      ) : null}

      {tab === 0 ? (
      <Fragment>
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Marca y diseño
        </Typography>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }} useFlexGap>
            <TextField
              label="URL de la imagen del logo"
              fullWidth
              value={branding.logo_url ?? ""}
              onChange={(e) =>
                setBranding((b) => ({ ...b, logo_url: e.target.value || null }))
              }
              disabled={!canEdit}
              helperText="URL HTTPS pública. Si está vacío, se muestra un título en texto."
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Fondo de la franja del logo"
                fullWidth
                value={branding.logo_bg_color}
                onChange={(e) =>
                  setBranding((b) => ({ ...b, logo_bg_color: e.target.value }))
                }
                disabled={!canEdit}
              />
              <TextField
                label="Fondo del contenedor exterior"
                fullWidth
                value={branding.container_bg_color}
                onChange={(e) =>
                  setBranding((b) => ({ ...b, container_bg_color: e.target.value }))
                }
                disabled={!canEdit}
              />
            </Stack>
            <TextField
              label="HTML del pie"
              fullWidth
              multiline
              minRows={4}
              value={branding.footer_html}
              onChange={(e) =>
                setBranding((b) => ({ ...b, footer_html: e.target.value }))
              }
              disabled={!canEdit}
              helperText={`Códigos: {current_year}, {app_name}. Ejemplo: <p>© {current_year}</p>`}
            />
            <Button
              variant="contained"
              onClick={saveBranding}
              disabled={!canEdit || savingBrand}
            >
              {savingBrand ? "Guardando…" : "Guardar marca"}
            </Button>
          </Stack>
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Vista previa en vivo (cuerpo de ejemplo)
            </Typography>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "auto",
                maxHeight: 420,
                bgcolor: "grey.900",
              }}
            >
              <Box
                component="div"
                dangerouslySetInnerHTML={{ __html: brandingPreview.html }}
              />
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Divider />

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Plantillas de mensaje
        </Typography>
        <FormControl fullWidth sx={{ maxWidth: 400, mb: 2 }}>
          <InputLabel id="tpl-select">Plantilla</InputLabel>
          <Select
            labelId="tpl-select"
            label="Plantilla"
            value={selectedKey}
            onChange={(e) => handleSelectTemplate(e.target.value)}
          >
            {templates.map((t) => (
              <MenuItem key={t.template_key} value={t.template_key}>
                {TEMPLATE_LABELS[t.template_key] ?? t.template_key}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Shortcodes para esta plantilla: {TEMPLATE_SHORTCODE_HINTS[selectedKey] ?? "—"}
        </Typography>

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }} useFlexGap>
            <TextField
              label="Asunto"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={!canEdit}
            />
            <TextField
              label="Cuerpo HTML"
              fullWidth
              multiline
              minRows={12}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              disabled={!canEdit}
              InputProps={{ sx: { fontFamily: "monospace", fontSize: 13 } }}
            />
            <Button
              variant="contained"
              onClick={saveTemplate}
              disabled={!canEdit || savingTpl}
            >
              {savingTpl ? "Guardando…" : "Guardar plantilla"}
            </Button>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Envío de prueba (plantilla actual)
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Usa shortcodes de ejemplo (María G., enlaces demo). Los envíos aparecen en la pestaña Registro de envíos.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
              <TextField
                label="Enviar prueba a"
                type="email"
                size="small"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={!canEdit}
                sx={{ flex: 1, minWidth: 200 }}
              />
              <Button
                variant="outlined"
                onClick={() => void sendTestEmail()}
                disabled={!canEdit || testSending}
              >
                {testSending ? "Enviando…" : "Enviar correo de prueba"}
              </Button>
            </Stack>
          </Stack>
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Vista previa en vivo (asunto: {templatePreview.subject})
            </Typography>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "auto",
                maxHeight: 520,
                bgcolor: "grey.900",
              }}
            >
              <Box
                component="div"
                dangerouslySetInnerHTML={{ __html: templatePreview.html }}
              />
            </Box>
          </Box>
        </Stack>
      </Paper>
      </Fragment>
      ) : null}

      <Dialog
        open={detailLog != null}
        onClose={() => setDetailLog(null)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Registro de envío — detalle completo</DialogTitle>
        <DialogContent dividers>
          {detailLog ? (
            <Stack spacing={2} sx={{ pt: 0.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  ID del registro
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem", wordBreak: "break-all" }}>
                  {detailLog.id}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Creado el
                </Typography>
                <Typography variant="body2">{new Date(detailLog.created_at).toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Estado
                </Typography>
                <Typography variant="body2">{detailLog.status}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Clave de plantilla
                </Typography>
                <Typography variant="body2">
                  {detailLog.template_key
                    ? (TEMPLATE_LABELS[detailLog.template_key] ?? detailLog.template_key)
                    : "—"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Remitente
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {detailLog.from_address ?? "—"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Destinatario
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                  {detailLog.to_address}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Asunto
                </Typography>
                <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                  {detailLog.subject ?? "—"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Descripción del error
                </Typography>
                <Typography
                  variant="body2"
                  color={detailLog.error_message ? "error" : "text.secondary"}
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {detailLog.error_message ?? "— (sin error — envío correcto o error no registrado)"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Usuario que disparó el envío (ID)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem", wordBreak: "break-all" }}>
                  {detailLog.triggered_by_user_id ?? "—"}
                </Typography>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Cuerpo HTML (completo, según registro)
                </Typography>
                <TextField
                  value={detailLog.body_preview ?? ""}
                  fullWidth
                  multiline
                  minRows={8}
                  maxRows={20}
                  InputProps={{ readOnly: true, sx: { fontFamily: "monospace", fontSize: 12 } }}
                  placeholder="No se guardó cuerpo para esta fila."
                />
              </Box>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailLog(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewLog != null}
        onClose={() => setPreviewLog(null)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Vista previa del correo</DialogTitle>
        <DialogContent>
          {previewLog ? (
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                <strong>Asunto:</strong> {previewLog.subject ?? "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Para:</strong> {previewLog.to_address}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                HTML renderizado en un marco aislado (sin scripts). Aproxima cómo se ve el mensaje en un cliente de
                correo.
              </Typography>
              {previewLog.body_preview?.trim() ? (
                <Box
                  sx={{
                    borderRadius: 1,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "grey.100",
                  }}
                >
                  <iframe
                    title="Vista previa HTML del correo"
                    srcDoc={previewLog.body_preview}
                    sandbox=""
                    style={{
                      width: "100%",
                      height: 560,
                      border: "none",
                      display: "block",
                      background: "#ffffff",
                    }}
                  />
                </Box>
              ) : (
                <Typography color="text.secondary">No se registró HTML de cuerpo para esta entrada.</Typography>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewLog(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
