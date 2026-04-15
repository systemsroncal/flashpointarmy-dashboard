import type { ReactNode } from "react";

/** Auth routes inherit Barlow from root `layout.tsx` (`--font-barlow`). No extra Google Font fetch. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
