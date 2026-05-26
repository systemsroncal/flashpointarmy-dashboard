import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { isMaintenanceBannerEnabled } from "@/lib/maintenance";

/** Read MAINTENANCE_BANNER from .env at request time (not only at `next build`). */
export const dynamic = "force-dynamic";

export function MaintenanceBannerGate() {
  if (!isMaintenanceBannerEnabled()) return null;
  return <MaintenanceBanner />;
}
