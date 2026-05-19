"use client";

import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/auth/email-otp-constants";
import { useCallback, useEffect, useState } from "react";

export function formatOtpResendCountdown(secondsLeft: number): string {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useOtpResendCooldown(cooldownSeconds = OTP_RESEND_COOLDOWN_SECONDS) {
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!cooldownEndsAt) {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) setCooldownEndsAt(null);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cooldownEndsAt]);

  const startCooldown = useCallback(() => {
    setCooldownEndsAt(Date.now() + cooldownSeconds * 1000);
  }, [cooldownSeconds]);

  const clearCooldown = useCallback(() => {
    setCooldownEndsAt(null);
    setSecondsLeft(0);
  }, []);

  return {
    secondsLeft,
    canResend: secondsLeft <= 0,
    startCooldown,
    clearCooldown,
    formatCountdown: formatOtpResendCountdown,
  };
}
