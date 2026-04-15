import type { SxProps, Theme } from "@mui/material";
import { flashpointYellow } from "@/theme/tokens";

/** White inputs, no outline ring — matches reference `.form-control` */
export const authTextFieldSx: SxProps<Theme> = {
  mb: 2,
  "& .MuiOutlinedInput-root": {
    bgcolor: "#ffffff",
    color: "#000000",
    borderRadius: "6px",
    fontSize: "1rem",
    "& fieldset": {
      border: "none",
    },
    "&:hover fieldset": {
      border: "none",
    },
    "&.Mui-focused fieldset": {
      border: "none",
    },
  },
  "& .MuiInputBase-input::placeholder": {
    color: "#9ca3af",
  },
};

export const authLabelSx: SxProps<Theme> = {
  display: "block",
  color: "#d1d5db",
  fontSize: "0.875rem",
  fontWeight: 500,
  mb: 0.5,
};

/**
 * Outlined TextField: label sits inside the field (placeholder-style) until focus or value, then floats up.
 */
export const authFloatingTextFieldSx: SxProps<Theme> = {
  mb: 2,
  display: "block",
  width: "100%",
  "& .MuiOutlinedInput-root": {
    bgcolor: "#ffffff",
    color: "#000000",
    borderRadius: "6px",
    fontSize: "1rem",
    "& fieldset": {
      border: "none",
    },
    "&:hover fieldset": {
      border: "none",
    },
    "&.Mui-focused fieldset": {
      border: "none",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#9ca3af",
  },
  "& .MuiFormControl-root.Mui-focused .MuiInputLabel-root": {
    color: flashpointYellow,
  },
  "& .MuiInputLabel-root.MuiInputLabel-shrink": {
    color: flashpointYellow,
  },
  "& .MuiFormLabel-asterisk": {
    color: flashpointYellow,
  },
};
