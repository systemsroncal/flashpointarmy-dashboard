/** Client-safe OTP constants (no Node.js crypto). */

export const OTP_PURPOSE_REGISTER = "register";
export const OTP_PURPOSE_CHANGE_EMAIL = "change_email";
export const OTP_TTL_MINUTES = 10;
/** Minimum wait before another OTP email (registration, change email, etc.). */
export const OTP_RESEND_COOLDOWN_SECONDS = 120;
