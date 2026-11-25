import { ArmyAuthShell, authYellow } from "@/components/auth/ArmyAuthShell";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";

type Props = {
  headline: string;
  subtitle?: string;
  body: string;
  redirectPath: string;
};

export function ShareLinkLanding({ headline, subtitle, body, redirectPath }: Props) {
  const loginHref = `/login?redirect=${encodeURIComponent(redirectPath)}`;
  const dashboardHref = redirectPath;

  return (
    <ArmyAuthShell hideHeadline contentMaxWidth={520}>
      <Box sx={{ textAlign: "center", py: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: authYellow, mb: 1 }}>
          {headline}
        </Typography>
        {subtitle ? (
          <Typography variant="subtitle1" sx={{ color: "grey.200", mb: 2, fontWeight: 600 }}>
            {subtitle}
          </Typography>
        ) : null}
        <Typography variant="body2" sx={{ color: "grey.400", mb: 3, lineHeight: 1.7 }}>
          {body}
        </Typography>
        <Button
          component={Link}
          href={loginHref}
          variant="contained"
          size="large"
          sx={{ textTransform: "none", fontWeight: 700, mr: 1, mb: 1 }}
        >
          Sign in to view
        </Button>
        <Button
          component={Link}
          href={dashboardHref}
          variant="outlined"
          size="large"
          sx={{ textTransform: "none", fontWeight: 600, mb: 1 }}
        >
          Open link
        </Button>
      </Box>
    </ArmyAuthShell>
  );
}