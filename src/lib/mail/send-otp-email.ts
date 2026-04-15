import { sendTemplatedEmail } from "@/lib/mail/send-templated-email";

type OtpMailInput = {
  email: string;
  otp: string;
  appName?: string;
};

/**
 * Sends registration OTP using the editable `register_otp` template + global branding
 * (same pipeline as verify_email / other templates). Logs via `sendTemplatedEmail`.
 */
export async function sendOtpEmail({ email, otp, appName = "Flashpoint Dashboard" }: OtpMailInput) {
  await sendTemplatedEmail(
    "register_otp",
    email,
    {
      user_email: email,
      user_fullname: email.split("@")[0] || "there",
      otp,
      app_name: appName,
      validateemail_url: "",
      resetpassword_url: "",
      gathering_title: "",
      gathering_url: "",
    },
    { triggeredByUserId: null }
  );
}
