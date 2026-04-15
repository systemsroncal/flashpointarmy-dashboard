"use client";

import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string; description: string | null };
type Mod = { id: string; slug: string; name: string };
type RP = {
  role_id: string;
  module_id: string;
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
};

type CellKey = "can_create" | "can_read" | "can_update" | "can_delete";

const LABELS: Record<CellKey, string> = {
  can_create: "Create",
  can_read: "View",
  can_update: "Edit",
  can_delete: "Delete",
};

function cellKey(roleId: string, moduleId: string) {
  return `${roleId}:${moduleId}`;
}

function buildDraft(roles: Role[], modules: Mod[], matrix: RP[]): Record<string, RP> {
  const out: Record<string, RP> = {};
  for (const r of roles) {
    for (const m of modules) {
      const k = cellKey(r.id, m.id);
      const f = matrix.find((x) => x.role_id === r.id && x.module_id === m.id);
      out[k] = f
        ? { ...f }
        : {
            role_id: r.id,
            module_id: m.id,
            can_create: false,
            can_read: false,
            can_update: false,
            can_delete: false,
          };
    }
  }
  return out;
}

export function RolesAdmin({
  allowed,
  canEdit,
  roles,
  modules,
  matrix,
}: {
  allowed: boolean;
  /** When true, matrix can be edited and saved (requires `admin_roles` update). */
  canEdit: boolean;
  roles: Role[];
  modules: Mod[];
  matrix: RP[];
}) {
  const router = useRouter();
  const matrixSig = useMemo(() => JSON.stringify(matrix), [matrix]);
  const [draft, setDraft] = useState<Record<string, RP>>(() =>
    buildDraft(roles, modules, matrix)
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    setDraft(buildDraft(roles, modules, matrix));
  }, [roles, modules, matrixSig]);

  const toggle = useCallback((k: string, field: CellKey) => {
    setDraft((prev) => {
      const cur = prev[k];
      if (!cur) return prev;
      const nextVal = !cur[field];
      const next = { ...cur, [field]: nextVal };
      if (field === "can_read" && !nextVal) {
        next.can_create = false;
        next.can_update = false;
        next.can_delete = false;
      }
      if (field !== "can_read" && nextVal) {
        next.can_read = true;
      }
      return { ...prev, [k]: next };
    });
  }, []);

  async function handleSave() {
    setSaveError(null);
    setSaveOk(false);
    setSaving(true);
    try {
      const cells = Object.values(draft);
      const res = await fetch("/api/admin/role-permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cells }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveError(data.error || "Save failed.");
        return;
      }
      setSaveOk(true);
      window.setTimeout(() => setSaveOk(false), 5000);
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!allowed) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography color="error">You do not have access to role administration.</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ color: "primary.main" }}>
        Roles & permissions
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Control what each role can see and do per module. <strong>View</strong> is required to access
        the module; <strong>Create / Edit / Delete</strong> apply within it.
      </Typography>

      {canEdit ? (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexWrap: "wrap" }}>
          <Button variant="contained" size="small" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Typography variant="caption" color="text.secondary">
            Changes apply after save. Users may need to refresh the app to pick up new permissions.
          </Typography>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          You can view this matrix. Ask a user with <strong>Roles & permissions → Edit</strong> to
          change access.
        </Typography>
      )}

      {saveError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      ) : null}
      {saveOk ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          Permissions saved.
        </Alert>
      ) : null}

      <TableContainer sx={{ maxWidth: "100%", overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 140 }}>Role / module</TableCell>
              {modules.map((m) => (
                <TableCell key={m.id} align="left" sx={{ minWidth: 160, verticalAlign: "bottom" }}>
                  <Typography variant="subtitle2" component="span">
                    {m.name}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {m.slug}
                  </Typography>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell sx={{ verticalAlign: "top" }}>
                  <strong>{r.name}</strong>
                  {r.description ? (
                    <Typography variant="caption" display="block" color="text.secondary">
                      {r.description}
                    </Typography>
                  ) : null}
                </TableCell>
                {modules.map((m) => {
                  const k = cellKey(r.id, m.id);
                  const f = draft[k];
                  return (
                    <TableCell key={m.id} align="left" sx={{ verticalAlign: "top", py: 1 }}>
                      {f ? (
                        <FormGroup sx={{ gap: 0 }}>
                          {(Object.keys(LABELS) as CellKey[]).map((field) => (
                            <FormControlLabel
                              key={field}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={f[field]}
                                  disabled={!canEdit}
                                  onChange={() => toggle(k, field)}
                                  sx={{ py: 0.25 }}
                                />
                              }
                              label={
                                <Typography variant="caption" component="span">
                                  {LABELS[field]}
                                </Typography>
                              }
                              sx={{ mr: 0, ml: 0, alignItems: "center" }}
                            />
                          ))}
                        </FormGroup>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
