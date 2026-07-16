import { redirect } from "next/navigation";
import { MOBILIZE_HOME_HREF } from "@/lib/mobilize/mobilize-nav-config";

export default function MobilizeHomePage() {
  redirect(MOBILIZE_HOME_HREF);
}
