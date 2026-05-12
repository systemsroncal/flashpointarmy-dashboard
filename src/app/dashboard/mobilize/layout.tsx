import { MobilizeToastProvider } from "@/components/mobilize/MobilizeToastProvider";

export default function MobilizeLayout({ children }: { children: React.ReactNode }) {
  return <MobilizeToastProvider>{children}</MobilizeToastProvider>;
}
