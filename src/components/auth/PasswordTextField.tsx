"use client";

import { authLabelSx, authTextFieldSx } from "@/components/auth/authFieldStyles";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useState } from "react";

type PasswordTextFieldProps = {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  helperText?: string;
  required?: boolean;
  /** Use white auth form styling (login / reset pages). */
  authStyled?: boolean;
  /** With authStyled: no label above; show `placeholder` inside the field. */
  placeholderOnly?: boolean;
  placeholder?: string;
  sx?: SxProps<Theme>;
};

export function PasswordTextField({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  helperText,
  required = true,
  authStyled = false,
  placeholderOnly = false,
  placeholder,
  sx,
}: PasswordTextFieldProps) {
  const [visible, setVisible] = useState(false);

  const authFieldSx = {
    ...authTextFieldSx,
    "& .MuiIconButton-root": {
      color: "#374151",
      bgcolor: "rgba(0,0,0,0.06)",
      mr: 0.25,
      "&:hover": { color: "#111", bgcolor: "rgba(0,0,0,0.12)" },
    },
    ...(sx && typeof sx === "object" && !Array.isArray(sx) ? sx : {}),
  } as SxProps<Theme>;

  const field = (
    <TextField
      id={id}
      name={name ?? id}
      type={visible ? "text" : "password"}
      required={required}
      fullWidth
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      label={authStyled || placeholderOnly ? undefined : label}
      placeholder={placeholderOnly ? placeholder ?? label : undefined}
      sx={authStyled || placeholderOnly ? authFieldSx : sx}
      inputProps={{ "aria-label": label }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              type="button"
              aria-label={visible ? "Hide password" : "Show password"}
              title={visible ? "Hide password" : "Show password"}
              edge="end"
              size="small"
              onClick={() => setVisible((v) => !v)}
              onMouseDown={(e) => e.preventDefault()}
            >
              {visible ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );

  if (!authStyled) {
    return (
      <Box>
        {field}
        {helperText ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {helperText}
          </Typography>
        ) : null}
      </Box>
    );
  }

  if (placeholderOnly) {
    return (
      <Box>
        {field}
        {helperText ? (
          <Typography
            component="p"
            sx={{ color: "#9ca3af", fontSize: "0.7rem", lineHeight: 1.45, mt: -1, mb: 1.5, mx: 0 }}
          >
            {helperText}
          </Typography>
        ) : null}
      </Box>
    );
  }

  return (
    <Box>
      <Typography component="label" htmlFor={id} sx={authLabelSx}>
        {label}
      </Typography>
      {field}
      {helperText ? (
        <Typography
          component="p"
          sx={{ color: "#9ca3af", fontSize: "0.75rem", lineHeight: 1.45, mt: -1, mb: 1.5 }}
        >
          {helperText}
        </Typography>
      ) : null}
    </Box>
  );
}
